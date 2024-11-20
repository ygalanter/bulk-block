import { AtpAgent } from '@atproto/api';

import * as dotenv from 'dotenv';
dotenv.config();

const handle = process.env.BSKY_BOT_HANDLE!;
const password = process.env.BSKY_BOT_PASSWORD!;

const agent = new AtpAgent({ service: 'https://bsky.social' });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deleteAllConversations() {
  try {
    // Log in to the Bluesky account
    await agent.login({ identifier: handle, password });

    // Fetch all conversations
    const conversations = await agent.chat.bsky.convo.listConvos({limit: 100}, { headers: { "Atproto-Proxy": "did:web:api.bsky.chat#bsky_chat" } });

    for (const convo of conversations.data.convos) {
      const convoId = convo.id;

      // Fetch all messages in the conversation
      const messages = await agent.chat.bsky.convo.getMessages({ convoId }, { headers: { "Atproto-Proxy": "did:web:api.bsky.chat#bsky_chat" } });

      for (const message of messages.data.messages) {
        const messageId = message.id as string;

        // Delete the message for yourself
        await agent.chat.bsky.convo.deleteMessageForSelf({ convoId, messageId }, { headers: { "Atproto-Proxy": "did:web:api.bsky.chat#bsky_chat" } });
        console.log(`Deleted message ${messageId} in conversation ${convoId}`);
      }

      console.log(`Deleted all messages in conversation ${convoId}`);
      
      await agent.chat.bsky.convo.leaveConvo({ convoId }, { headers: { "Atproto-Proxy": "did:web:api.bsky.chat#bsky_chat" } });

      await sleep(1000);
    }

    console.log('Deleted all conversations.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

deleteAllConversations();
