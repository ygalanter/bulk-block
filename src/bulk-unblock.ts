import { AtpAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

dotenv.config();

const handle = process.env.BSKY_BOT_HANDLE!;
const appPassword = process.env.BSKY_BOT_PASSWORD!;

// Define rate limit parameters
const REQUESTS_PER_MINUTE = 100; // Adjust based on Bluesky's rate limits
const REQUEST_INTERVAL = 60000 / REQUESTS_PER_MINUTE; // Interval in milliseconds

async function unblockAllUsers() {
  const agent = new AtpAgent({ service: 'https://bsky.social' });

  // Log in to your Bluesky account
  await agent.login({ identifier: handle, password: appPassword });

  let cursor: string | undefined;
  let totalUnblocked = 0;

  do {
    // Retrieve a batch of blocked accounts
    const blocks = await agent.app.bsky.graph.getBlocks({ limit: 100, cursor });

    for (const block of blocks.data.blocks) {
   

      try {
        // Construct the rkey using the blocked user's DID
        const rkey = block.viewer?.blocking?.split('/').pop();

        await agent.app.bsky.graph.block.delete({
          repo: agent.session?.did ?? '',
          rkey,
        });
        totalUnblocked++;
        console.log(`Unblocked user: ${block.handle} (Total unblocked: ${totalUnblocked})`);
      } catch (error) {
        console.error(`Failed to unblock user: ${block.displayName}`, error);
      }

      // Wait to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL));
    }

    cursor = blocks.data.cursor;
  } while (cursor);

  console.log(`All users have been unblocked. Total unblocked: ${totalUnblocked}`);
}

unblockAllUsers().catch(console.error);
