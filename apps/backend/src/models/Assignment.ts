import mongoose, { Schema, Document } from 'mongoose';
import type { AssignmentInput, JobStatus, GeneratedPaper } from '@vedaai/shared/types';

export interface IAssignment extends Document {
  /** Clerk user id of the owning teacher */
  teacherId: string;
  /** Clerk user ids enrolled to view / receive this assignment */
  studentIds: string[];
  /** Account emails (normalized lowercase) that may access this assignment alongside studentIds */
  studentEmails: string[];
  input: AssignmentInput;
  status: JobStatus;
  jobId?: string;
  result?: GeneratedPaper;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_in_blank'],
      required: true,
    },
    count: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
  },
  { _id: false }
);

const AssignmentInputSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    dueDate: { type: String, required: true },
    questionConfigs: { type: [QuestionConfigSchema], required: true },
    additionalInstructions: { type: String },
    fileContent: { type: String },
  },
  { _id: false }
);

const AssignmentSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    studentIds: { type: [String], default: [], index: true },
    studentEmails: { type: [String], default: [], index: true },
    input: { type: AssignmentInputSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ createdAt: -1 });
AssignmentSchema.index({ teacherId: 1, createdAt: -1 });
AssignmentSchema.index({ studentIds: 1 });

export const AssignmentModel =
  mongoose.models.Assignment ?? mongoose.model<IAssignment>('Assignment', AssignmentSchema);
