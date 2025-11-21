import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const redisConnection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisConnection.on('connect', () => {
  logger.info('Connected to Redis');
});

redisConnection.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

export const createRedisClient = () => {
  return new Redis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
  });
};
