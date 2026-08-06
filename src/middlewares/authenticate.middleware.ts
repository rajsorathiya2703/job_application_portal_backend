import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { AppError } from '../utils/apiError';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      role: payload.role,
    };
    next();
  } catch (error) {
    return next(new AppError(401, 'Invalid or expired token'));
  }
};
