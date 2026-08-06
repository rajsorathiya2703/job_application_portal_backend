import mongoose, { Schema, Document } from 'mongoose';

export interface IEducation {
  universityName: string;
  courseName: string;
  startYear?: number;
  endYear?: number;
  percentage?: number;
}

export interface IExperience {
  companyName: string;
  startDate?: Date;
  endDate?: Date;
  field?: string;
  description?: string;
}

export interface IProject {
  title: string;
  description?: string;
  techStack: string[];
  startDate?: Date;
  endDate?: Date;
  link?: string;
}

export interface IJobSeekerProfile extends Document {
  user: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  address?: string;
  skills: mongoose.Types.ObjectId[];
  education: IEducation[];
  experience: IExperience[];
  projects: IProject[];
  createdAt: Date;
  updatedAt: Date;
}

const educationSchema = new Schema<IEducation>({
  universityName: { type: String, required: true },
  courseName: { type: String, required: true },
  startYear: { type: Number },
  endYear: { type: Number },
  percentage: { type: Number },
});

const experienceSchema = new Schema<IExperience>({
  companyName: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  field: { type: String },
  description: { type: String },
});

const projectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String },
  techStack: [{ type: String }],
  startDate: { type: Date },
  endDate: { type: Date },
  link: { type: String },
});

const jobSeekerProfileSchema = new Schema<IJobSeekerProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    skills: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    education: [educationSchema],
    experience: [experienceSchema],
    projects: [projectSchema],
  },
  { timestamps: true }
);

export const JobSeekerProfile = mongoose.model<IJobSeekerProfile>('JobSeekerProfile', jobSeekerProfileSchema);
