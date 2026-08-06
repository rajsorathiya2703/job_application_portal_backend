import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as applicationService from './application.service';

// ─── Apply ────────────────────────────────────────────────────────────────────

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const application = await applicationService.apply(req.user!.id, req.body);
  return sendResponse(res, 201, 'Successfully applied to job', application);
});

// ─── Get My Applications ──────────────────────────────────────────────────────

export const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as Record<string, string>;
  const result = await applicationService.getMyApplications(req.user!.id, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  return sendResponse(res, 200, 'Applications fetched successfully', result);
});

// ─── Get Applications for Job ─────────────────────────────────────────────────

export const getApplicationsForJob = asyncHandler(async (req: Request, res: Response) => {
  const jobId = String(req.params['jobId']);
  const { page, limit } = req.query as Record<string, string>;
  const result = await applicationService.getApplicationsForJob(req.user!.id, jobId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  return sendResponse(res, 200, 'Applications fetched successfully', result);
});

// ─── Update Status ────────────────────────────────────────────────────────────

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const applicationId = String(req.params['id']);
  const application = await applicationService.updateStatus(
    req.user!.id,
    applicationId,
    req.body.status
  );
  return sendResponse(res, 200, 'Application status updated successfully', application);
});

// ─── Withdraw ─────────────────────────────────────────────────────────────────

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const applicationId = String(req.params['id']);
  const application = await applicationService.withdraw(req.user!.id, applicationId);
  return sendResponse(res, 200, 'Application withdrawn successfully', application);
});
