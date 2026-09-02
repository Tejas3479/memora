import { Job } from 'bullmq';
import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';
import { createLogger, retry, slackBreaker, notionBreaker, qdrantBreaker } from '@memora/shared';
import { prisma } from '../prisma.js';
import { embedText } from '../services/embedding.js';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  checkCompatibility: false,
});
const QDRANT_COLLECTION = 'memories';
const logger = createLogger('IntegrationPoll');

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

        const channel = (integration.metadata as any)?.channel || (integration.metadata as any)?.channels?.[0] || 'general';
        const cursorParam = integration.cursor ? `&cursor=${integration.cursor}` : '';
        const response = await slackBreaker.execute(() =>
          retry(
            async () => {
              const res = await fetch(`https://slack.com/api/conversations.history?channel=${encodeURIComponent(channel)}&limit=10${cursorParam}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (!res.ok) throw new Error(`Slack API error: ${res.status}`);
              return res;
            },
            { attempts: 3, delay: 1000, backoff: 'exponential' }
          )
        );

        const data = await response.json();
        if (data.ok && Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            if (!msg.text) continue;

            const msgUrl = `slack://message/${msg.ts}`;
            const existing = await prisma.memory.findFirst({
              where: { userId, url: msgUrl },
            });
            if (existing) continue;

            const textVector = await embedText(msg.text);
            const memory = await prisma.memory.create({
              data: {
                userId,
                title: `Slack Message from ${msg.user || 'Unknown'}`,
                content: msg.text,
                source: 'SLACK',
                url: msgUrl,
                metadata: {
                  ts: msg.ts,
                  channel: 'C0123456',
                },
              },
            });
            const memoryId = memory.id;

            await qdrantBreaker.execute(() =>
              retry(
                () => qdrant.upsert(QDRANT_COLLECTION, {
                  wait: true,
                  points: [
                    {
                      id: crypto.randomUUID(),
                      vector: textVector,
                      payload: {
                        userId,
                        chunkId: crypto.randomUUID(),
                        memoryId,
                        source: 'SLACK',
                        url: msgUrl,
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
                }),
                { attempts: 3, delay: 1000, backoff: 'exponential' }
              )
            );
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

        const response = await notionBreaker.execute(() =>
          retry(
            async () => {
              const res = await fetch('https://api.notion.com/v1/search', {
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
              if (!res.ok) throw new Error(`Notion API error: ${res.status}`);
              return res;
            },
            { attempts: 3, delay: 1000, backoff: 'exponential' }
          )
        );

        const data = await response.json();
        if (Array.isArray(data.results)) {
          for (const page of data.results) {
            const pageTitle = page.properties?.title?.title?.[0]?.plain_text || 'Untitled Notion Page';
            const pageUrl = page.url || `notion://${page.id}`;
            const pageContent = `Notion Page: ${pageTitle}\nLast Edited: ${page.last_edited_time}`;

            const existing = await prisma.memory.findFirst({
              where: { userId, url: pageUrl },
            });
            if (existing) continue;

            const textVector = await embedText(pageContent);
            const memory = await prisma.memory.create({
              data: {
                userId,
                title: pageTitle,
                content: pageContent,
                source: 'NOTION',
                url: pageUrl,
                metadata: {
                  notionId: page.id,
                },
              },
            });
            const memoryId = memory.id;

            await qdrantBreaker.execute(() =>
              retry(
                () => qdrant.upsert(QDRANT_COLLECTION, {
                  wait: true,
                  points: [
                    {
                      id: crypto.randomUUID(),
                      vector: textVector,
                      payload: {
                        userId,
                        chunkId: crypto.randomUUID(),
                        memoryId,
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
                }),
                { attempts: 3, delay: 1000, backoff: 'exponential' }
              )
            );
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
