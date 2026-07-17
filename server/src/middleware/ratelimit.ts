import { config } from '../config.js';

export function globalRateLimit() {
  return {
    max: 100,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (request: any) => {
      return request.user?.userId || request.ip;
    },
  };
}

export function strictRateLimit() {
  return {
    max: 20,
    timeWindow: 60 * 60 * 1000, // 1 hour
    keyGenerator: (request: any) => {
      return request.user?.userId || request.ip;
    },
  };
}

export function searchRateLimit() {
  return {
    max: 50,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (request: any) => {
      return request.user?.userId || request.ip;
    },
  };
}
