import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { PLAN_LIMITS } from '@memora/shared';
import { getMonthKey } from '../lib/date.js';
import { RateLimitError, UnauthorizedError } from '../lib/errors.js';

const redis = new Redis(config.redis.url);

export async function planLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    throw new UnauthorizedError('User context required');
  }

  const { userId, plan } = request.user;
  const monthKey = getMonthKey();
  const redisKey = `plan:ingest:${userId}:${monthKey}`;
  
  const currentCount = parseInt((await redis.get(redisKey)) || '0', 10);
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
  const value = await redis.incr(redisKey);
  if (value === 1) {
    // Expire in 60 days
    await redis.expire(redisKey, 60 * 24 * 60 * 60);
  }
  return value;
}
