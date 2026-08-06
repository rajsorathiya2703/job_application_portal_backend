import { Response } from 'express';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};
