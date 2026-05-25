import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { AssignmentModel } from '../models/Assignment';
import { generatePaper } from '../services/aiService';
import { emitToAssignment } from '../socket';
import type { WSEvent } from '@vedaai/shared/types';

interface JobData {
  assignmentId: string;
}

const worker = new Worker(
  'assignment-generation',
  async (job: Job<JobData>) => {
    const { assignmentId } = job.data;

    try {
      const assignment = await AssignmentModel.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'processing' });

      const startEvent: WSEvent = {
        type: 'job:started',
        assignmentId,
        message: 'Generating your assessment...',
      };
      emitToAssignment(assignmentId, 'job:started', startEvent);

      const progressEvent: WSEvent = {
        type: 'job:progress',
        assignmentId,
        progress: 30,
        message: 'Constructing prompt and calling AI...',
      };
      emitToAssignment(assignmentId, 'job:progress', progressEvent);

      const result = await generatePaper(assignment.input, assignmentId, {
        onProgress: (message, progress) => {
          emitToAssignment(assignmentId, 'job:progress', {
            type: 'job:progress',
            assignmentId,
            progress: progress ?? 35,
            message,
          });
        },
      });

      const validateEvent: WSEvent = {
        type: 'job:progress',
        assignmentId,
        progress: 80,
        message: 'Parsing and validating questions...',
      };
      emitToAssignment(assignmentId, 'job:progress', validateEvent);

      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        result,
      });

      const completeEvent: WSEvent = {
        type: 'job:completed',
        assignmentId,
        progress: 100,
        message: 'Your question paper is ready.',
      };
      emitToAssignment(assignmentId, 'job:completed', completeEvent);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        error: errorMessage,
      });

      const failEvent: WSEvent = {
        type: 'job:failed',
        assignmentId,
        error: errorMessage,
      };
      emitToAssignment(assignmentId, 'job:failed', failEvent);

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed for assignment ${job.data.assignmentId}`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

export { worker };
