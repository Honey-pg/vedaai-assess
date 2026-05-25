import mongoose, { Schema, Document } from 'mongoose';

export type VedaRole = 'teacher' | 'student';

export interface IUserDoc extends Document {
  clerkUserId: string;
  email: string;
  displayName?: string;
  role: VedaRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    displayName: { type: String },
    role: {
      type: String,
      enum: ['teacher', 'student'],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User ?? mongoose.model<IUserDoc>('User', UserSchema);
