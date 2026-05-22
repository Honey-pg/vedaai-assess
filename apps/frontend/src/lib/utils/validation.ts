import { z } from 'zod';

export const questionConfigSchema = z.object({
  type: z.enum(['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_in_blank']),
  count: z.number().min(1, 'At least 1 question').max(50, 'Max 50 questions'),
  marksPerQuestion: z.number().min(1, 'At least 1 mark').max(100, 'Max 100 marks'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const assignmentFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  questionConfigs: z
    .array(questionConfigSchema)
    .min(1, 'Add at least one question type'),
  additionalInstructions: z.string().optional(),
});

export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
export type QuestionConfigData = z.infer<typeof questionConfigSchema>;
