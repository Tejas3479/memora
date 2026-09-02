import { Job } from 'bullmq';
import { CalendarPollPayload, CalendarPollResult, createLogger } from '@memora/shared';
import { prisma } from '../prisma.js';

const logger = createLogger('CalendarPoll');

export async function calendarPollProcessor(job: Job<CalendarPollPayload>): Promise<CalendarPollResult> {
  const { userId, integrationId } = job.data;

  // Retrieve integration credentials from PostgreSQL
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
  if (!integration) {
    return { eventsProcessed: 0, errors: ['Integration config not found'] };
  }

  logger.info(`Processing calendar events for user ${userId}`);

  let eventsProcessed = 0;
  const errors: string[] = [];

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
              where: { userId, url: eventUrl },
            });
            if (existing) continue;

            const startTime = item.start?.dateTime || item.start?.date || '';
            const summary = item.summary || 'Untitled Event';
            const description = item.description || '';

            await prisma.memory.create({
              data: {
                userId,
                title: `Calendar: ${summary}`,
                content: `Event: ${summary}\nStart: ${startTime}\nDescription: ${description}`,
                source: 'DOCUMENT',
                url: eventUrl,
                metadata: {
                  eventId: item.id,
                  startTime,
                  organizer: item.organizer?.email,
                },
              },
            });
            eventsProcessed++;
          }
        }
      } else {
        errors.push(`Google Calendar API returned status ${res.status}`);
      }
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  return {
    eventsProcessed,
    errors,
  };
}
