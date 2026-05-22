import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const redisClient = new IORedis(env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});
