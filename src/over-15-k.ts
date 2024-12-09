import { AtpAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

dotenv.config();

async function findUsersExceedingFollowThreshold() {
  const agent = new AtpAgent({ service: 'https://bsky.social' });

  await agent.login({
    identifier: process.env.BSKY_BOT_HANDLE!,
    password: process.env.BSKY_BOT_PASSWORD!,
  });

  const handle = 'ofvick.bsky.social';
  const didResolution = await agent.com.atproto.identity.resolveHandle({ handle });
  const did = didResolution.data.did;
  const listUri = `at://${did}/app.bsky.graph.list/3latnmdd7vz2s`;

  const members = [];
  let cursor: string | undefined;

  do {
    const response = await agent.app.bsky.graph.getList({
      list: listUri,
      limit: 100,
      cursor,
    });

    members.push(...response.data.items);
    cursor = response.data.cursor;
  } while (cursor);

  const threshold = 10000;
  const usersExceedingThreshold = [];

  for (const member of members) {
    const profile = await agent.app.bsky.actor.getProfile({ actor: member.subject.did });
    if (profile.data.followsCount! > threshold) {
      usersExceedingThreshold.push({
        handle: profile.data.handle,
        followsCount: profile.data.followsCount,
      });
    }
  }

  console.log(`Users following more than ${threshold} accounts:`);
  console.table(usersExceedingThreshold.sort((a, b) => b.followsCount! - a.followsCount!));
}

findUsersExceedingFollowThreshold().catch(console.error);
