import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as tagService from './tag.service';

// ─── Create Tag ───────────────────────────────────────────────────────────────

export const create = asyncHandler(async (req: Request, res: Response) => {
  const tag = await tagService.createTag(req.body);
  return sendResponse(res, 201, 'Tag created successfully', tag);
});

// ─── List Tags ────────────────────────────────────────────────────────────────

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { appliesOn } = req.query as { appliesOn?: 'job' | 'skill' };
  const tags = await tagService.getTags(appliesOn);
  return sendResponse(res, 200, 'Tags fetched successfully', tags);
});
