import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';

export const checkHealth = asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  return sendResponse(res, 200, 'Health check passed', healthData);
});
