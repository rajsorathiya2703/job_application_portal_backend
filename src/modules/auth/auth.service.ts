import bcrypt from 'bcryptjs';
import { User } from '../user/user.model';
import { JobSeekerProfile } from '../jobSeeker/jobSeekerProfile.model';
import { RefreshToken } from './refreshToken.model';
import { AppError } from '../../utils/apiError';
import { env } from '../../config/env';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken as verifyJWT,
  hashToken,
} from '../../utils/jwt.util';
import { RegisterInput, LoginInput } from './auth.validation';
import mongoose from 'mongoose';

const generateTokenPair = async (user: any, ip?: string) => {
  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  const rawRefreshToken = signRefreshToken({ id: user._id.toString() });

  const tokenHash = hashToken(rawRefreshToken);
  
  // Calculate expiry date for the DB record based on env (e.g. '7d')
  // We'll just assume 7 days here, but in a real app you might parse '7d' 
  // Let's use a standard 7 days for simplicity if we can't parse string.
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    createdByIp: ip,
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

export const register = async (input: RegisterInput, ip?: string) => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new AppError(409, 'Email already in use');
  }

  const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  // Note: Removed MongoDB Transactions (session.startTransaction) because they 
  // require a Replica Set and will fail on local standalone MongoDB deployments.
  // Instead, we manually handle the rollback if profile creation fails.

  const user = await User.create({
    email: input.email,
    password: hashedPassword,
    role: input.role,
    contactNumber: input.contactNumber,
  });

  try {
    if (user.role === 'job_seeker') {
      await JobSeekerProfile.create({
        user: user._id,
        skills: [],
        education: [],
        experience: [],
        projects: [],
      });
    }

    const tokens = await generateTokenPair(user, ip);

    return {
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    // Manual rollback: If profile creation fails, delete the user we just created
    await User.findByIdAndDelete(user._id);
    throw error;
  }
};

export const login = async (input: LoginInput, ip?: string) => {
  const user = await User.findOne({ email: input.email }).select('+password');
  
  if (!user || user.authProvider !== 'local' || !user.password) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Invalid credentials');
  }

  const tokens = await generateTokenPair(user, ip);

  return {
    ...tokens,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  };
};


export const refreshToken = async (rawToken: string, ip?: string) => {
  let decoded: { id: string };
  try {
    decoded = verifyJWT(rawToken);
  } catch (error) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const tokenHash = hashToken(rawToken);
  const record = await RefreshToken.findOne({ tokenHash });

  if (!record) {
    // Reuse detection
    await RefreshToken.updateMany({ user: decoded.id }, { revokedAt: new Date() });
    throw new AppError(401, 'Refresh token reuse detected. Please log in again.');
  }

  if (record.revokedAt || record.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token expired or revoked');
  }

  // Revoke old token
  record.revokedAt = new Date();
  record.replacedByToken = 'rotated';
  await record.save();

  // Issue new token
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError(401, 'User no longer exists');
  }

  const tokens = await generateTokenPair(user, ip);
  return tokens;
};

export const logout = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  const record = await RefreshToken.findOne({ tokenHash });

  if (record && !record.revokedAt) {
    record.revokedAt = new Date();
    await record.save();
  }
};
