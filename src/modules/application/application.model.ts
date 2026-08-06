import mongoose, { Schema, Document } from 'mongoose';

export interface IStatusHistory {
  status: string;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId;
}

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId;
  jobSeeker: mongoose.Types.ObjectId;
  resume: mongoose.Types.ObjectId;
  coverLetter?: string;
  status: 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistory>({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    jobSeeker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ['applied', 'under_review', 'shortlisted', 'rejected', 'hired', 'withdrawn'],
      default: 'applied',
    },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, jobSeeker: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
