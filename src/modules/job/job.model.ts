import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  totalExperience?: { min: number; max: number };
  relevantExperience?: { min: number; max: number };
  jobType: 'full_time' | 'part_time' | 'internship' | 'contract';
  workMode: 'onsite' | 'remote' | 'hybrid';
  tags: mongoose.Types.ObjectId[];
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    isRemote?: boolean;
  };
  company: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  openPositions: number;
  status: 'open' | 'closed' | 'draft';
  applicationDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    totalExperience: {
      min: { type: Number },
      max: { type: Number },
    },
    relevantExperience: {
      min: { type: Number },
      max: { type: Number },
    },
    jobType: { type: String, enum: ['full_time', 'part_time', 'internship', 'contract'], required: true },
    workMode: { type: String, enum: ['onsite', 'remote', 'hybrid'], required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    location: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      isRemote: { type: Boolean },
    },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    openPositions: { type: Number, default: 1 },
    status: { type: String, enum: ['open', 'closed', 'draft'], default: 'open' },
    applicationDeadline: { type: Date },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>('Job', jobSchema);
