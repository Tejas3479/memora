import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';
import { createLogger } from '@memora/shared';

const prisma = new PrismaClient();
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  checkCompatibility: false,
});
const QDRANT_COLLECTION = 'memories';
const logger = createLogger('IntegrationPoll');

async function embedText(text: string): Promise<number[]> {
  const voyageKey = process.env.VOYAGE_API_KEY;
  const size = process.env.EMBEDDING_MODE === 'local' ? 384 : 1024;
  
  if (!voyageKey) {
    const vec = new Array(size).fill(0);
    for (let i = 0; i < Math.min(text.length, size); i++) {
      vec[i] = text.charCodeAt(i) / 1000;
    }
    const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / mag);
  }

  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voyageKey}`,
      },
      body: JSON.stringify({
        model: 'voyage-3.5',
        input: [text],
      }),
    });
    if (!res.ok) throw new Error(`Voyage error: ${res.status}`);
    const body = await res.json();
    return body.data[0].embedding;
  } catch (err) {
    logger.warn('Voyage fetch failed, using fallback vector', err);
    const vec = new Array(size).fill(0).map(() => Math.random());
    const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / mag);
  }
}

export async function integrationPollProcessor(job: Job): Promise<number> {
  const integrations = await prisma.integration.findMany();
  let syncCount = 0;

  for (const integration of integrations) {
    logger.info(`Syncing integration ${integration.provider} for user ${integration.userId}`);
    const userId = integration.userId;

    try {
      if (integration.provider === 'SLACK') {
        const token = integration.accessToken;
        if (!token) continue;

        const cursorParam = integration.cursor ? `&cursor=${integration.cursor}` : '';
        const response = await fetch(`https://slack.com/api/conversations.history?channel=C0123456&limit=10${cursorParam}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.ok && Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            if (!msg.text) continue;

            const textVector = await embedText(msg.text);
            const memoryId = crypto.randomUUID();

            await qdrant.upsert(QDRANT_COLLECTION, {
              wait: true,
              points: [
                {
                  id: crypto.randomUUID(),
                  vector: textVector,
                  payload: {
                    userId,
                    chunkId: crypto.randomUUID(),
                    source: 'SLACK',
                    url: `slack://message/${msg.ts}`,
                    title: `Slack Message from ${msg.user || 'Unknown'}`,
                    content: msg.text,
                    timestamp: Math.floor(Date.now() / 1000),
                    metadata: {
                      memoryId,
                      ts: msg.ts,
                      channel: 'C0123456',
                    },
                  },
                },
              ],
            });
          }

          const nextCursor = data.response_metadata?.next_cursor || null;
          await prisma.integration.update({
            where: { id: integration.id },
            data: { cursor: nextCursor, updatedAt: new Date() },
          });
          syncCount++;
        }
      } else if (integration.provider === 'NOTION') {
        const token = integration.accessToken;
        if (!token) continue;

        const response = await fetch('https://api.notion.com/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: { property: 'object', value: 'page' },
            page_size: 5,
          }),
        });

        const data = await response.json();
        if (Array.isArray(data.results)) {
          for (const page of data.results) {
            const pageTitle = page.properties?.title?.title?.[0]?.plain_text || 'Untitled Notion Page';
            const pageUrl = page.url || `notion://${page.id}`;
            const pageContent = `Notion Page: ${pageTitle}\nLast Edited: ${page.last_edited_time}`;

            const textVector = await embedText(pageContent);
            const memoryId = crypto.randomUUID();

            await qdrant.upsert(QDRANT_COLLECTION, {
              wait: true,
              points: [
                {
                  id: crypto.randomUUID(),
                  vector: textVector,
                  payload: {
                    userId,
                    chunkId: crypto.randomUUID(),
                    source: 'NOTION',
                    url: pageUrl,
                    title: pageTitle,
                    content: pageContent,
                    timestamp: Math.floor(Date.now() / 1000),
                    metadata: {
                      memoryId,
                      notionId: page.id,
                    },
                  },
                },
              ],
            });
          }
          await prisma.integration.update({
            where: { id: integration.id },
            data: { updatedAt: new Date() },
          });
          syncCount++;
        }
      } else {
        await prisma.integration.update({
          where: { id: integration.id },
          data: { updatedAt: new Date() },
        });
        syncCount++;
      }
    } catch (err) {
      logger.error(`Failed to sync integration ${integration.id}`, err);
    }
  }

  return syncCount;
}
