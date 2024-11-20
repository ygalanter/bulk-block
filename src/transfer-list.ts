import { AppBskyGraphGetList, AtpAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

// Initialize the ATP agent with your service URL
const agent = new AtpAgent({ service: 'https://bsky.social' });
dotenv.config();

const handle = process.env.BSKY_BOT_HANDLE!;
const password = process.env.BSKY_BOT_PASSWORD!;

const sourceListURL = 'https://bsky.app/profile/skywatch.blue/lists/3lbckxhgu3r2v'; 

//const targetListURL = 'https://bsky.app/profile/numb.comfortab.ly/lists/3kn6pvyceas2r'; // right wing propaganda
//const targetListURL = 'https://bsky.app/profile/numb.comfortab.ly/lists/3kppycyn22u2r'; // transphobes and homophobes
const targetListURL = 'https://bsky.app/profile/numb.comfortab.ly/lists/3kwcndk7wmc2w'; // trolls

/**
 * Converts a Bluesky list URL to its corresponding at:// URI.
 * @param url - The Bluesky list URL.
 * @returns The corresponding at:// URI.
 */
async function convertListUrlToAtUri(url: string): Promise<string> {

    // Parse the URL to extract the handle and rkey
    const urlPattern = /^https:\/\/bsky\.app\/profile\/([^/]+)\/lists\/([^/]+)$/;
    const match = url.match(urlPattern);

    if (!match) {
        throw new Error('Invalid Bluesky list URL format.');
    }

    const [_, handle, rkey] = match;

    // Resolve the handle to a DID
    const response = await agent.com.atproto.identity.resolveHandle({ handle });
    const did = response.data.did;

    // Construct the at:// URI
    const atUri = `at://${did}/app.bsky.graph.list/${rkey}`;
    return atUri;
}



// Function to fetch all items from a moderation list
async function fetchListItems(listUri: string): Promise<string[]> {
    const items: string[] = [];
    let cursor: string | undefined;

    do {
        let response: AppBskyGraphGetList.Response

        try {
            response = await agent.app.bsky.graph.getList({
                list: listUri,
                cursor,
                limit: 100,
            });
        } catch (error) {
            response = await agent.app.bsky.graph.getList({
                list: listUri,
                cursor,
                limit: 100,
            });
        }


        if (response.data.items) {
            items.push(...response.data.items.map(item => item.subject.did));
        }

        cursor = response.data.cursor;
    } while (cursor);

    return items;
}

// Function to add items to a moderation list in batches
async function addItemsToList(listUri: string, items: string[], batchSize = 100) {
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const operations = batch.map(did => ({

            collection: 'app.bsky.graph.listitem',
           "$type": 'com.atproto.repo.applyWrites#create',
            value: {
                subject: did,
                list: listUri,
                createdAt: new Date().toISOString(),

            }
        }));

        try {
            await agent.com.atproto.repo.applyWrites({
                repo: agent.session?.did ?? '',
                writes: operations

            });



        } catch (error) {
            console.error('An error occurred while adding items to the list:', error);
        }

        console.log(`Added ${batch.length} items to the list.`);


    }
}

// Main function to transfer users from source to target list
async function transferModerationList() {
    try {

        // Log in to the Bluesky account
        await agent.login({ identifier: handle, password });

        const sourceListUri = await convertListUrlToAtUri(sourceListURL);
        const targetListUri = await convertListUrlToAtUri(targetListURL);

        // Fetch all DIDs from the source list
        const sourceItems = await fetchListItems(sourceListUri);
        console.log(`Fetched ${sourceItems.length} items from the source list.`);

        // Fetch all DIDs from the target list to avoid duplicates
        const targetItems = await fetchListItems(targetListUri);
        console.log(`Fetched ${targetItems.length} items from the target list.`);

        const targetSet = new Set(targetItems);

        // Filter out DIDs already present in the target list
        const newItems = sourceItems.filter(did => !targetSet.has(did));
        console.log(`Found ${newItems.length} new items to add to the target list.`);

        // Add new items to the target list in batches
        await addItemsToList(targetListUri, newItems);
        console.log('Transfer completed successfully.');
    } catch (error) {
        console.error('An error occurred during the transfer:', error);
    }
}

// Execute the transfer
transferModerationList();
