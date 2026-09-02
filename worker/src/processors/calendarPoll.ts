import { Job } from 'bullmq';
import crypto from 'crypto';
import { CalendarPollPayload, CalendarPollResult, createLogger } from '@memora/shared';
import { prisma } from '../prisma.js';
import { QdrantService } from '../services/qdrant.js';
import { embedText } from '../services/embedding.js';

const logger = createLogger('CalendarPoll');
const qdrant = new QdrantService();

export async function calendarPollProcessor(job: Job<CalendarPollPayload>): Promise<CalendarPollResult> {
  const { userId, integrationId } = job.data || {};

  // Retrieve integrations: either specific ID or all active Google integrations for recurring sync
  const integrations = integrationId
    ? await prisma.integration.findMany({ where: { id: integrationId } })
    : await prisma.integration.findMany({ where: { provider: 'GOOGLE' } });

  if (integrations.length === 0) {
    return { eventsProcessed: 0, errors: integrationId ? ['Integration config not found'] : [] };
  }

  let eventsProcessed = 0;
  const errors: string[] = [];

  for (const integration of integrations) {
    const targetUserId = integration.userId;
    logger.info(`Processing calendar events for user ${targetUserId}`);

    if (integration.accessToken) {
      try {
        const now = new Date().toISOString();
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=10&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            for (const item of data.items) {
              const eventUrl = item.htmlLink || `calendar://event/${item.id}`;
              const existing = await prisma.memory.findFirst({
                where: { userId: targetUserId, url: eventUrl },
              });
              if (existing) continue;

              const startTime = item.start?.dateTime || item.start?.date || '';
              const summary = item.summary || 'Untitled Event';
              const description = item.description || '';
              const content = `Event: ${summary}\nStart: ${startTime}\nDescription: ${description}`;

              const memory = await prisma.memory.create({
                data: {
                  userId: targetUserId,
                  title: `Calendar: ${summary}`,
                  content,
                  source: 'DOCUMENT',
                  url: eventUrl,
                  metadata: {
                    eventId: item.id,
                    startTime,
                    organizer: item.organizer?.email,
                  },
                },
              });

              // Generate vector embedding and dual-write to Qdrant
              try {
                const vector = await embedText(content);
                await qdrant.upsertMemories([
                  {
                    id: crypto.randomUUID(),
                    vector,
                    payload: {
                      memoryId: memory.id,
                      userId: targetUserId,
                      title: memory.title,
                      content,
                      url: eventUrl,
                      source: 'document',
                      timestamp: Math.floor(memory.createdAt.getTime() / 1000),
                      chunkId: crypto.randomUUID(),
                      metadata: memory.metadata,
                    },
                  },
                ]);
              } catch (vecErr) {
                logger.warn(`Failed to upsert calendar event vector to Qdrant for memory ${memory.id}:`, vecErr);
              }

              eventsProcessed++;
            }
          }
        } else {
          errors.push(`Google Calendar API returned status ${res.status} for user ${targetUserId}`);
        }
      } catch (err) {
        errors.push((err as Error).message);
      }
    }
  }

  return {
    eventsProcessed,
    errors,
  };
}
