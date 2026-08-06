import mongoose, { Schema, Document } from 'mongoose';

export interface IRecruiterProfile extends Document {
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  designation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recruiterProfileSchema = new Schema<IRecruiterProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    designation: { type: String },
  },
  { timestamps: true }
);

export const RecruiterProfile = mongoose.model<IRecruiterProfile>('RecruiterProfile', recruiterProfileSchema);
