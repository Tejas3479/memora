import { Redis } from 'ioredis';
import { config } from './config.js';

export const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

redis.on('error', (err) => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Redis] Connection error:', err);
  }
});

export default redis;
