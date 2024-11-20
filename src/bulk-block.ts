import { AtpAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

const agent = new AtpAgent({ service: 'https://bsky.social' });

dotenv.config();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function blockFollowersOfAccount(targetHandle: string) {
  try {

    await agent.login({
      identifier: process.env.BSKY_BOT_HANDLE!,
      password: process.env.BSKY_BOT_HANDLE!
    });

    let cursor: string | undefined = undefined;

    do {
      const response = await agent.getFollowers({
        actor: targetHandle,
        limit: 100,
        cursor,
      });

      const followers = response.data.followers;

      for (const follower of followers) {

        try {

          await agent.app.bsky.graph.block.create(
            { repo: agent.session!.did },
            {
              subject: follower.did,
              createdAt: new Date().toISOString(),
            }
          );

          console.log(`Blocked follower: ${follower.handle}`);
        } catch (error) {
          console.error(`Failed to block follower: ${follower.handle}`, error);
        }


        await sleep(10000);

      }

      cursor = response.data.cursor;
    } while (cursor);

    console.log(`All followers of ${targetHandle} have been blocked.`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

blockFollowersOfAccount('asshole-whose-followers-to-block.bsky.social');
