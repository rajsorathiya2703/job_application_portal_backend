import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as recruiterService from './recruiter.service';

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await recruiterService.getMyProfile(req.user!.id);
  return sendResponse(res, 200, 'Profile fetched successfully', profile);
});

export const updateDesignation = asyncHandler(async (req: Request, res: Response) => {
  const profile = await recruiterService.updateDesignation(
    req.user!.id,
    req.body.designation
  );
  return sendResponse(res, 200, 'Profile updated successfully', profile);
});

export const createOrUpdateCompany = asyncHandler(async (req: Request, res: Response) => {
  const profile = await recruiterService.createOrUpdateCompany(req.user!.id, req.body);
  return sendResponse(res, 200, 'Company saved successfully', profile);
});
