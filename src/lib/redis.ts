/**
 * Redis Configuration
 *
 * Singleton Redis client for BullMQ job queues
 */

import Redis from 'ioredis';
import { logger } from './logger';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// Create Redis connection
export const redis = globalForRedis.redis ?? new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null, // Required for BullMQ
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      logger.warn('Redis reconnect on error:', { error: err.message });
      return true;
    },
  }
);

// Event handlers for monitoring
redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (err: Error) => {
  logger.error('Redis connection error', err);
});

redis.on('ready', () => {
  logger.info('Redis ready to accept commands');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export default redis;
