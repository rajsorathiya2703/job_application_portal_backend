import mongoose from 'mongoose';
import { Application } from './application.model';
import { Job } from '../job/job.model';
import { Resume } from '../resume/resume.model';
import { JobSeekerProfile } from '../jobSeeker/jobSeekerProfile.model';
import { AppError } from '../../utils/apiError';
import { CreateApplicationInput, UpdateStatusInput } from './application.validation';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findSeekerProfile = async (userId: string) => {
  const profile = await JobSeekerProfile.findOne({ user: userId });
  if (!profile) {
    throw new AppError(404, 'Job seeker profile not found');
  }
  return profile;
};

// ─── Apply ────────────────────────────────────────────────────────────────────

export const apply = async (
  jobSeekerUserId: string,
  data: CreateApplicationInput
) => {
  // 1. Verify Job exists and is open
  const job = await Job.findById(data.jobId);
  if (!job) {
    throw new AppError(404, 'Job not found');
  }
  if (job.status !== 'open') {
    throw new AppError(400, 'This job is no longer accepting applications');
  }

  // 2. Verify Resume ownership
  const profile = await findSeekerProfile(jobSeekerUserId);
  const resume = await Resume.findOne({
    _id: data.resumeId,
    jobSeeker: profile._id,
  });
  if (!resume) {
    throw new AppError(403, 'Resume not found or does not belong to you');
  }

  // 3. Create Application
  try {
    const application = await Application.create({
      job: data.jobId,
      jobSeeker: jobSeekerUserId, // Storing raw User._id as per schema
      resume: data.resumeId,
      coverLetter: data.coverLetter,
      status: 'applied',
      statusHistory: [
        {
          status: 'applied',
          changedBy: jobSeekerUserId,
        },
      ],
    });
    return application;
  } catch (error: any) {
    // Catch Mongo duplicate-key error from compound index {job, jobSeeker}
    if (error.code === 11000) {
      throw new AppError(409, 'You have already applied to this job');
    }
    throw error;
  }
};

// ─── Get My Applications (Seeker) ─────────────────────────────────────────────

export const getMyApplications = async (
  jobSeekerUserId: string,
  pagination: PaginationOptions
): Promise<PaginatedResult<unknown>> => {
  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.max(1, Number(pagination.limit) || 10);
  const skip = (page - 1) * limit;

  const query = { jobSeeker: jobSeekerUserId };

  const [data, total] = await Promise.all([
    Application.find(query)
      .populate('job', 'title company location jobType')
      .populate('resume', 'fileName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(query),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── Get Applications for Job (Recruiter) ─────────────────────────────────────

export const getApplicationsForJob = async (
  recruiterUserId: string,
  jobId: string,
  pagination: PaginationOptions
): Promise<PaginatedResult<unknown>> => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(404, 'Job not found');
  }
  if (job.postedBy.toString() !== recruiterUserId) {
    throw new AppError(403, 'You do not have permission to view these applications');
  }

  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.max(1, Number(pagination.limit) || 10);
  const skip = (page - 1) * limit;

  const query = { job: jobId };

  const [data, total] = await Promise.all([
    Application.find(query)
      .populate('jobSeeker', 'email role') // Basic user info
      .populate('resume')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(query),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── Update Status (Recruiter) ────────────────────────────────────────────────

export const updateStatus = async (
  recruiterUserId: string,
  applicationId: string,
  newStatus: UpdateStatusInput['status']
) => {
  const application = await Application.findById(applicationId).populate<{ job: { postedBy: mongoose.Types.ObjectId } }>('job', 'postedBy');
  
  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  // Cast because lean/populate typing can be tricky; we verified it above.
  const jobPostedBy = application.job?.postedBy?.toString();

  if (jobPostedBy !== recruiterUserId) {
    throw new AppError(403, 'You do not have permission to update this application');
  }

  application.status = newStatus;
  application.statusHistory.push({
    status: newStatus,
    changedBy: new mongoose.Types.ObjectId(recruiterUserId),
    changedAt: new Date()
  });

  await application.save();
  return application;
};

// ─── Withdraw (Seeker) ────────────────────────────────────────────────────────

export const withdraw = async (jobSeekerUserId: string, applicationId: string) => {
  const application = await Application.findOne({
    _id: applicationId,
    jobSeeker: jobSeekerUserId,
  });

  if (!application) {
    throw new AppError(404, 'Application not found or does not belong to you');
  }

  if (application.status !== 'applied' && application.status !== 'under_review') {
    throw new AppError(
      400,
      `Cannot withdraw application with status '${application.status}'`
    );
  }

  application.status = 'withdrawn';
  application.statusHistory.push({
    status: 'withdrawn',
    changedBy: new mongoose.Types.ObjectId(jobSeekerUserId),
    changedAt: new Date()
  });

  await application.save();
  return application;
};
