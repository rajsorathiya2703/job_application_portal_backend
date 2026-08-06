import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  description?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  contactNumber1?: string;
  contactNumber2?: string;
  logo?: string;
  website?: string;
  isVerified: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    description: { type: String },
    industry: { type: String },
    companySize: { type: String },
    address: { type: String },
    contactNumber1: { type: String },
    contactNumber2: { type: String },
    logo: { type: String },
    website: { type: String },
    isVerified: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', companySchema);
