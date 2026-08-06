import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as jobService from './job.service';
import { ListJobsFilters } from './job.service';

// ─── Create Job ───────────────────────────────────────────────────────────────

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.createJob(req.user!.id, req.body);
  return sendResponse(res, 201, 'Job created successfully', job);
});

// ─── Update Job ───────────────────────────────────────────────────────────────

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const jobId = String(req.params['id']);
  const job = await jobService.updateJob(req.user!.id, jobId, req.body);
  return sendResponse(res, 200, 'Job updated successfully', job);
});

// ─── Delete Job ───────────────────────────────────────────────────────────────

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const jobId = String(req.params['id']);
  await jobService.deleteJob(req.user!.id, jobId);
  return sendResponse(res, 200, 'Job deleted successfully');
});

// ─── Get Job by ID (public) ───────────────────────────────────────────────────

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const jobId = String(req.params['id']);
  const job = await jobService.getJobById(jobId);
  return sendResponse(res, 200, 'Job fetched successfully', job);
});

// ─── List Jobs (public) ───────────────────────────────────────────────────────

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const {
    jobType,
    workMode,
    tags,
    city,
    minExperience,
    maxExperience,
    search,
    page,
    limit,
  } = req.query as Record<string, string | string[]>;

  const filters: ListJobsFilters = {
    jobType: jobType as string | undefined,
    workMode: workMode as string | undefined,
    tags: tags as string | string[] | undefined,
    city: city as string | undefined,
    minExperience: minExperience as string | undefined,
    maxExperience: maxExperience as string | undefined,
    search: search as string | undefined,
  };

  const result = await jobService.listJobs(filters, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return sendResponse(res, 200, 'Jobs fetched successfully', result);
});

// ─── List My Jobs (recruiter) ─────────────────────────────────────────────────

export const listMyJobs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as Record<string, string>;

  const result = await jobService.listMyJobs(req.user!.id, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return sendResponse(res, 200, 'My jobs fetched successfully', result);
});
