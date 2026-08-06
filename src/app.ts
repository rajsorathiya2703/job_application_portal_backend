import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { jobSeekerRoutes } from './modules/jobSeeker/jobSeeker.routes';
import { recruiterRoutes } from './modules/recruiter/recruiter.routes';
import { tagRoutes } from './modules/tag/tag.routes';
import { jobRoutes } from './modules/job/job.routes';
import { resumeRoutes } from './modules/resume/resume.routes';
import { applicationRoutes } from './modules/application/application.routes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// DEV-ONLY: Serve uploaded files as static assets so fileUrl values are reachable
// during local development (e.g. GET /uploads/resumes/<filename>).
// In production, serve files from a cloud CDN (S3, Cloudinary, etc.) instead;
// do NOT expose the uploads directory on a stateless/ephemeral server.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Job Portal API! Visit /api/health to check server status.');
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/job-seekers', jobSeekerRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', applicationRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
