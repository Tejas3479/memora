import { Queue } from 'bullmq';
import { config } from '../config.js';
import {
  CALENDAR_POLL_QUEUE,
  WEEKLY_DIGEST_QUEUE,
  AUTOMATION_RUNNER_QUEUE,
  CALENDAR_POLL_OPTIONS,
  WEEKLY_DIGEST_OPTIONS,
} from '@memora/shared';

const queueOptions = {
  connection: {
    url: config.redis.url,
  },
};

export const calendarPollQueue = new Queue(CALENDAR_POLL_QUEUE, queueOptions);
export const weeklyDigestQueue = new Queue(WEEKLY_DIGEST_QUEUE, queueOptions);
export const automationRunnerQueue = new Queue(AUTOMATION_RUNNER_QUEUE, queueOptions);

export async function setupRecurringJobs(): Promise<void> {
  try {
    // Add Repeatable tasks for active calendar sync pollings
    await calendarPollQueue.add(
      'recurring-calendar-sync',
      {},
      {
        repeat: {
          every: 5 * 60 * 1000, // every 5 minutes
        },
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400 },
      },
    );

    // Setup Weekly Digest monday scheduling
    await weeklyDigestQueue.add(
      'recurring-weekly-digest',
      {},
      {
        repeat: {
          pattern: '0 9 * * 1', // 9:00 AM on Monday
        },
        removeOnComplete: { age: 604800, count: 10 },
      },
    );
  } catch (err) {
    console.error('[Jobs] Recurring job setup failed:', err);
  }
}
