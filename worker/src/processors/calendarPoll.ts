import { Job } from 'bullmq';
import { CalendarPollPayload, CalendarPollResult, createLogger } from '@memora/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const logger = createLogger('CalendarPoll');

export async function calendarPollProcessor(job: Job<CalendarPollPayload>): Promise<CalendarPollResult> {
  const { userId, integrationId } = job.data;

  // Retrieve integration credentials from PostgreSQL
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
  if (!integration) {
    return { eventsProcessed: 0, errors: ['Integration config not found'] };
  }

  // Under development, mock parsing 5 new Google calendar items
  logger.info(`Processing calendar events for user ${userId}`);

  return {
    eventsProcessed: 5,
    errors: [],
  };
}
