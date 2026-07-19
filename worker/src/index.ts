import { Worker } from 'bullmq';
import { config } from './config.js'; // Fallback to config from server or local
import { Redis } from 'ioredis';
import {
  CALENDAR_POLL_QUEUE,
  WEEKLY_DIGEST_QUEUE,
  AUTOMATION_RUNNER_QUEUE,
  createLogger,
} from '@memora/shared';

// Import local processors
import { automationProcessor } from './processors/automation.js';
import { calendarPollProcessor } from './processors/calendarPoll.js';
import { digestProcessor } from './processors/digest.js';
import { loopRunnerProcessor } from './processors/loopRunner.js';
import { integrationPollProcessor } from './processors/integrationPoll.js';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = createLogger('WorkerMain');

const wAutomation = new Worker(AUTOMATION_RUNNER_QUEUE, automationProcessor, { connection });
const wCalendar = new Worker(CALENDAR_POLL_QUEUE, calendarPollProcessor, { connection });
const wDigest = new Worker(WEEKLY_DIGEST_QUEUE, digestProcessor, { connection });
const wIntegrations = new Worker('integration-poll', integrationPollProcessor, { connection });
const wLoops = new Worker('loop-runner', loopRunnerProcessor, { connection });

logger.info('Memora Background Workers successfully wired and active');

wAutomation.on('completed', (job) => logger.info(`Job Completed - Automation rule ran: ${job.id}`));
wAutomation.on('failed', (job, err) => logger.error(`Job Failed - Automation: ${job?.id}`, err));

wCalendar.on('completed', (job) => logger.info(`Job Completed - Calendar sync: ${job.id}`));
wCalendar.on('failed', (job, err) => logger.error(`Job Failed - Calendar: ${job?.id}`, err));

wDigest.on('completed', (job) => logger.info(`Job Completed - Weekly digest built: ${job.id}`));
wDigest.on('failed', (job, err) => logger.error(`Job Failed - Digest: ${job?.id}`, err));

// Graceful Shut-Down handlers
const shutdown = async () => {
  logger.info('Shutting down workers...');
  await Promise.all([
    wAutomation.close(),
    wCalendar.close(),
    wDigest.close(),
    wIntegrations.close(),
    wLoops.close(),
  ]);
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
