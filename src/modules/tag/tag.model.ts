import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  title: string;
  appliesOn: 'job' | 'skill';
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    title: { type: String, required: true },
    appliesOn: { type: String, enum: ['job', 'skill'], required: true },
  },
  { timestamps: true }
);

export const Tag = mongoose.model<ITag>('Tag', tagSchema);
