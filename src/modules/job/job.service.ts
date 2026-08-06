import mongoose from 'mongoose';
import { Job } from './job.model';
import { RecruiterProfile } from '../recruiter/recruiterProfile.model';
import { AppError } from '../../utils/apiError';
import { CreateJobInput, UpdateJobInput } from './job.validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Create Job ───────────────────────────────────────────────────────────────

export const createJob = async (
  recruiterUserId: string,
  data: CreateJobInput
) => {
  // Look up recruiter profile to get their company — never trust company from body
  const profile = await RecruiterProfile.findOne({ user: recruiterUserId });

  if (!profile || !profile.company) {
    throw new AppError(
      400,
      'Please complete your company profile before posting a job.'
    );
  }

  const job = await Job.create({
    ...data,
    company: profile.company,
    postedBy: recruiterUserId,
  });

  return job;
};

// ─── Update Job ───────────────────────────────────────────────────────────────

export const updateJob = async (
  recruiterUserId: string,
  jobId: string,
  data: UpdateJobInput
) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError(404, 'Job not found');
  }

  // Ownership check — service layer, not just controller
  if (job.postedBy.toString() !== recruiterUserId) {
    throw new AppError(403, 'You do not have permission to edit this job');
  }

  const updatedJob = await Job.findByIdAndUpdate(
    jobId,
    { $set: data },
    { new: true, runValidators: true }
  )
    .populate('company')
    .populate('tags');

  return updatedJob;
};

// ─── Delete Job ───────────────────────────────────────────────────────────────

export const deleteJob = async (
  recruiterUserId: string,
  jobId: string
) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError(404, 'Job not found');
  }

  // Ownership check — service layer, not just controller
  if (job.postedBy.toString() !== recruiterUserId) {
    throw new AppError(403, 'You do not have permission to delete this job');
  }

  await Job.findByIdAndDelete(jobId);
};

// ─── Get Job by ID (public) ───────────────────────────────────────────────────

export const getJobById = async (jobId: string) => {
  const job = await Job.findById(jobId).populate('company').populate('tags');

  if (!job) {
    throw new AppError(404, 'Job not found');
  }

  return job;
};

// ─── List Jobs (public) ───────────────────────────────────────────────────────

export interface ListJobsFilters {
  jobType?: string;
  workMode?: string;
  tags?: string | string[];
  city?: string;
  minExperience?: string;
  maxExperience?: string;
  search?: string;
}

export const listJobs = async (
  filters: ListJobsFilters,
  pagination: PaginationOptions
): Promise<PaginatedResult<unknown>> => {
  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.max(1, Number(pagination.limit) || 10);
  const skip = (page - 1) * limit;

  // Always restrict public listing to 'open' jobs only
  const query: Record<string, unknown> = { status: 'open' };

  // Exact match filters
  if (filters.jobType) query.jobType = filters.jobType;
  if (filters.workMode) query.workMode = filters.workMode;

  // Tags: match any of the provided tag IDs
  if (filters.tags) {
    const tagIds = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
    query.tags = { $in: tagIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  // City: case-insensitive partial match OR isRemote=true
  if (filters.city) {
    query.$or = [
      { 'location.city': { $regex: filters.city, $options: 'i' } },
      { 'location.isRemote': true },
    ];
  }

  // Experience overlap: find jobs whose [min,max] range overlaps with [minExp, maxExp]
  // A job's range [job.min, job.max] overlaps with [A, B] when job.min <= B AND job.max >= A
  if (filters.minExperience !== undefined || filters.maxExperience !== undefined) {
    const minExp = filters.minExperience !== undefined ? Number(filters.minExperience) : 0;
    const maxExp = filters.maxExperience !== undefined ? Number(filters.maxExperience) : Infinity;

    if (!isNaN(minExp)) {
      query['totalExperience.max'] = { $gte: minExp };
    }
    if (isFinite(maxExp) && !isNaN(maxExp)) {
      query['totalExperience.min'] = { $lte: maxExp };
    }
  }

  // Title search: case-insensitive partial match
  if (filters.search) {
    query.title = { $regex: filters.search, $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Job.find(query)
      .populate('company')
      .populate('tags')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(query),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── List My Jobs (recruiter, all statuses) ───────────────────────────────────

export const listMyJobs = async (
  recruiterUserId: string,
  pagination: PaginationOptions
): Promise<PaginatedResult<unknown>> => {
  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.max(1, Number(pagination.limit) || 10);
  const skip = (page - 1) * limit;

  // Recruiter sees ALL their own jobs regardless of status
  const query = { postedBy: recruiterUserId };

  const [data, total] = await Promise.all([
    Job.find(query)
      .populate('company')
      .populate('tags')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(query),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
