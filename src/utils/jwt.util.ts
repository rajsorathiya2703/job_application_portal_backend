import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from './apiError';

export interface AccessTokenPayload {
  id: string;
  role: string;
}

export interface RefreshTokenPayload {
  id: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (error) {
    throw new AppError(401, 'Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
};

/**
 * Hashes a token for secure storage.
 * Used for refresh tokens to prevent raw token storage in the DB.
 */
export const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};
