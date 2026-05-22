import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AssignmentModel } from '../models/Assignment';
import { assignmentQueue } from '../queues/assignmentQueue';
import { redisClient } from '../config/redis';
import { upload } from '../middleware/upload';
import { extractTextFromFile } from '../services/pdfService';

const router = Router();

const CACHE_TTL = 3600; // 1 hour

const questionConfigSchema = z.object({
  type: z.enum(['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_in_blank']),
  count: z.number().min(1, 'At least 1 question').max(50),
  marksPerQuestion: z.number().min(1, 'At least 1 mark'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const assignmentInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  questionConfigs: z
    .string()
    .transform((val) => JSON.parse(val))
    .pipe(z.array(questionConfigSchema).min(1, 'Add at least one question type')),
  additionalInstructions: z.string().optional(),
});

// POST /api/assignments
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = assignmentInputSchema.parse(req.body);

    let fileContent: string | undefined;
    if (req.file) {
      fileContent = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    }

    const assignment = await AssignmentModel.create({
      input: {
        ...validated,
        fileContent,
      },
      status: 'pending',
    });

    const job = await assignmentQueue.add('generate', {
      assignmentId: assignment._id.toString(),
    });

    await AssignmentModel.findByIdAndUpdate(assignment._id, {
      jobId: job.id,
    });

    // Cache in Redis
    await redisClient.setex(
      `assignment:${assignment._id}`,
      CACHE_TTL,
      JSON.stringify(assignment.toJSON())
    );

    res.status(201).json({
      assignmentId: assignment._id,
      jobId: job.id,
      status: 'pending',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    console.error('Error creating assignment:', error);
    res.status(500).json({
      error: 'Failed to create assignment',
      code: 'INTERNAL_ERROR',
    });
  }
});

// GET /api/assignments (list) — register before GET /:id so static routes aren't shadowed by the param handler
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [assignments, total] = await Promise.all([
      AssignmentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AssignmentModel.countDocuments(filter),
    ]);

    res.json({
      assignments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing assignments:', error);
    res.status(500).json({
      error: 'Failed to list assignments',
      code: 'INTERNAL_ERROR',
    });
  }
});

// GET /api/assignments/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check Redis cache first
    const cached = await redisClient.get(`assignment:${id}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.status === 'completed' || parsed.status === 'failed') {
        res.json(parsed);
        return;
      }
    }

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found', code: 'NOT_FOUND' });
      return;
    }

    // Update cache
    await redisClient.setex(`assignment:${id}`, CACHE_TTL, JSON.stringify(assignment.toJSON()));

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      error: 'Failed to fetch assignment',
      code: 'INTERNAL_ERROR',
    });
  }
});

// POST /api/assignments/:id/regenerate
router.post('/:id/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found', code: 'NOT_FOUND' });
      return;
    }

    assignment.status = 'pending';
    assignment.result = undefined;
    assignment.error = undefined;
    await assignment.save();

    const job = await assignmentQueue.add('generate', {
      assignmentId: id,
    });

    await AssignmentModel.findByIdAndUpdate(id, { jobId: job.id });

    // Invalidate cache
    await redisClient.del(`assignment:${id}`);

    res.json({ jobId: job.id, status: 'pending' });
  } catch (error) {
    console.error('Error regenerating assignment:', error);
    res.status(500).json({
      error: 'Failed to regenerate assignment',
      code: 'INTERNAL_ERROR',
    });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentModel.findByIdAndDelete(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found', code: 'NOT_FOUND' });
      return;
    }
    await redisClient.del(`assignment:${id}`);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      error: 'Failed to delete assignment',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
