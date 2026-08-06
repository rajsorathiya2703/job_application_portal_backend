import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as authService from './auth.service';
import { AppError } from '../../utils/apiError';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, req.ip);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendResponse(res, 201, 'User registered successfully', {
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, req.ip);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendResponse(res, 200, 'Login successful', {
    accessToken: result.accessToken,
    user: result.user,
  });
});


export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies.refreshToken;
  if (!rawToken) {
    throw new AppError(401, 'No refresh token provided');
  }

  const result = await authService.refreshToken(rawToken, req.ip);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendResponse(res, 200, 'Token refreshed successfully', {
    accessToken: result.accessToken,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies.refreshToken;
  if (rawToken) {
    await authService.logout(rawToken);
  }

  res.clearCookie('refreshToken');
  
  return sendResponse(res, 200, 'Logged out successfully');
});
