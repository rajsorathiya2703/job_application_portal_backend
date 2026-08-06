import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as jobSeekerService from './jobSeeker.service';

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.getMyProfile(req.user!.id);
  return sendResponse(res, 200, 'Profile fetched successfully', profile);
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.updateMyProfile(req.user!.id, req.body);
  return sendResponse(res, 200, 'Profile updated successfully', profile);
});

// ─── Education ────────────────────────────────────────────────────────────────

export const addEducation = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.addEducation(req.user!.id, req.body);
  return sendResponse(res, 201, 'Education added successfully', profile);
});

export const updateEducation = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.updateEducation(
    req.user!.id,
    req.params['eduId'] as string,
    req.body
  );
  return sendResponse(res, 200, 'Education updated successfully', profile);
});

export const deleteEducation = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.deleteEducation(
    req.user!.id,
    req.params['eduId'] as string
  );
  return sendResponse(res, 200, 'Education deleted successfully', profile);
});

// ─── Experience ───────────────────────────────────────────────────────────────

export const addExperience = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.addExperience(req.user!.id, req.body);
  return sendResponse(res, 201, 'Experience added successfully', profile);
});

export const updateExperience = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.updateExperience(
    req.user!.id,
    req.params['expId'] as string,
    req.body
  );
  return sendResponse(res, 200, 'Experience updated successfully', profile);
});

export const deleteExperience = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.deleteExperience(
    req.user!.id,
    req.params['expId'] as string
  );
  return sendResponse(res, 200, 'Experience deleted successfully', profile);
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const addProject = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.addProject(req.user!.id, req.body);
  return sendResponse(res, 201, 'Project added successfully', profile);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.updateProject(
    req.user!.id,
    req.params['projectId'] as string,
    req.body
  );
  return sendResponse(res, 200, 'Project updated successfully', profile);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const profile = await jobSeekerService.deleteProject(
    req.user!.id,
    req.params['projectId'] as string
  );
  return sendResponse(res, 200, 'Project deleted successfully', profile);
});
