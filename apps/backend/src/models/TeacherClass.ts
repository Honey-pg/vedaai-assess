import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherClassDoc extends Document {
  teacherId: string;
  name: string;
  /** Optional grouping label shown in dashboards */
  subject?: string;
  description?: string;
  /** Invite code students use on Join Class (unique, ambiguous-char-free) */
  joinCode: string;
  studentEmails: string[];
  /** Clerk ids of learners who joined with the code */
  studentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherClassSchema = new Schema<ITeacherClassDoc>(
  {
    teacherId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    description: { type: String, trim: true },
    joinCode: { type: String, required: true, unique: true, index: true },
    studentEmails: { type: [String], default: [] },
    studentIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

TeacherClassSchema.index({ teacherId: 1, updatedAt: -1 });

export const TeacherClassModel =
  mongoose.models.TeacherClass ?? mongoose.model<ITeacherClassDoc>('TeacherClass', TeacherClassSchema);
