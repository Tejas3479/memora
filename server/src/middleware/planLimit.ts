import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../redis.js';
import { PLAN_LIMITS } from '@memora/shared';
import { getMonthKey } from '../lib/date.js';
import { RateLimitError, UnauthorizedError } from '../lib/errors.js';

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
