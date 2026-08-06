import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/apiError';
import * as resumeService from './resume.service';

// ─── Upload / Create ──────────────────────────────────────────────────────────

export const create = asyncHandler(async (req: Request, res: Response) => {
  // Multer runs before this handler; req.file is populated if upload succeeded.
  // If no file is present (e.g. field name mismatch), surface a clear 400 error.
  if (!req.file) {
    throw new AppError(400, 'Resume file is required');
  }

  const resume = await resumeService.createResume(req.user!.id, req.file);
  return sendResponse(res, 201, 'Resume uploaded successfully', resume);
});

// ─── List my resumes ──────────────────────────────────────────────────────────

export const getMyResumes = asyncHandler(
  async (req: Request, res: Response) => {
    const resumes = await resumeService.getMyResumes(req.user!.id);
    return sendResponse(res, 200, 'Resumes fetched successfully', resumes);
  }
);

// ─── Set default ──────────────────────────────────────────────────────────────

export const setDefault = asyncHandler(async (req: Request, res: Response) => {
  const resumeId = String(req.params['id']);
  const resume = await resumeService.setDefaultResume(req.user!.id, resumeId);
  return sendResponse(res, 200, 'Default resume updated successfully', resume);
});

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteResume = asyncHandler(
  async (req: Request, res: Response) => {
    const resumeId = String(req.params['id']);
    await resumeService.deleteResume(req.user!.id, resumeId);
    return sendResponse(res, 200, 'Resume deleted successfully');
  }
);
