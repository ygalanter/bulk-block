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
  let totalUnmuted = 0;

  do {
    // Retrieve a batch of blocked accounts
    const mutes = await agent.app.bsky.graph.getMutes({ limit: 100, cursor });

    for (const mute of mutes.data.mutes) {
      const { did } = mute;

      try {
        await agent.unmute(did)
        totalUnmuted++;
        console.log(`Unmuted user: ${mute.handle} (Total unmuted: ${totalUnmuted})`);
      } catch (error) {
        console.error(`Failed to unmute user: ${mute.handle}`, error);
      }

      // Wait to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL));
    }

    cursor = mutes.data.cursor;
  } while (cursor);

  console.log(`All users have been unmuted. Total umuted: ${totalUnmuted}`);
}

unblockAllUsers().catch(console.error);
