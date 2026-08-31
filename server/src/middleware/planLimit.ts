import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { PLAN_LIMITS } from '@memora/shared';
import { getMonthKey } from '../lib/date.js';
import { RateLimitError, UnauthorizedError } from '../lib/errors.js';

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: isTest ? 0 : 20,
  retryStrategy: isTest ? () => null : (times) => Math.min(times * 50, 2000),
});
redis.on('error', () => {});

export async function planLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    throw new UnauthorizedError('User context required');
  }

  const { userId, plan } = request.user;
  const monthKey = getMonthKey();
  const redisKey = `plan:ingest:${userId}:${monthKey}`;
  
  let currentCount = 0;
  try {
    const raw = await redis.get(redisKey);
    currentCount = parseInt(raw || '0', 10);
  } catch (err) {
    // Graceful fallback if Redis is unreachable
    currentCount = 0;
  }

  const limit = PLAN_LIMITS[plan].memoriesPerMonth;

  if (currentCount >= limit) {
    throw new RateLimitError(
      `Plan limits exceeded. Your current plan (${plan}) allows up to ${limit} ingestions per month.`
    );
  }
}

export async function incrementIngestCounter(userId: string): Promise<number> {
  const monthKey = getMonthKey();
  const redisKey = `plan:ingest:${userId}:${monthKey}`;
  try {
    const value = await redis.incr(redisKey);
    if (value === 1) {
      // Expire in 60 days
      await redis.expire(redisKey, 60 * 24 * 60 * 60);
    }
    return value;
  } catch (err) {
    return 1;
  }
}
