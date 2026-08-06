import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  jobSeeker: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'docx';
  fileSizeKB?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    jobSeeker: { type: Schema.Types.ObjectId, ref: 'JobSeekerProfile', required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'doc', 'docx'], required: true },
    fileSizeKB: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);
