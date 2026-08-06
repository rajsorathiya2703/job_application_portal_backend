import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  role: 'job_seeker' | 'recruiter';
  email: string;
  password?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  avatar?: string;
  contactNumber?: string;
  isEmailVerified: boolean;
  emailVerifyToken?: string;
  emailVerifyExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['job_seeker', 'recruiter'], required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String },
    avatar: { type: String },
    contactNumber: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },
    emailVerifyExpiry: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiry: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
