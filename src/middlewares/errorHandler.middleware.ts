import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/apiError';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new AppError(statusCode, message, false, err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};
