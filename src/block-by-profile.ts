import { AtpAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

const agent = new AtpAgent({ service: 'https://bsky.social' });

dotenv.config();

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function blockByProfile(searchString: string) {

    await agent.login({
        identifier: process.env.BSKY_BOT_HANDLE!,
        password: process.env.BSKY_BOT_PASSWORD!
    });

    let cursor: string | undefined = undefined;

    do {
        const response = await agent.searchActors(
            {
                q: searchString,
                limit: 100,
                cursor,
            }
        );

        const actors = response.data.actors;

        for (const actor of actors) {

            try {

                // await agent.app.bsky.graph.block.create(
                //     { repo: agent.session!.did },
                //     {
                //         subject: actor.did,
                //         createdAt: new Date().toISOString(),
                //     }
                // );

                console.log(`\u001b[34m\u001b[1mHandle: \u001b[0m${actor.handle}`);
                console.log(`\u001b[34m\u001b[1mBio: \u001b[0m${actor.description}`);
                console.log(`\u001b[1m\u001b[31mSimulated block\u001b[0m`);
                console.log(`---------------------------------`);
            } catch (error) {
                console.error(`Failed to block profile: ${actor.handle}`, error);
            }

            await sleep(1000);
        }

        cursor = response.data.cursor;
    } while (cursor);

}

blockByProfile('🌊 #FBR');

