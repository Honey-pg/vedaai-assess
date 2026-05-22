import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const assignmentQueue = new Queue('assignment-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
