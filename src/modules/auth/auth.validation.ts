import { z } from 'zod';

// ─── Register ────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  role: z.enum(['job_seeker', 'recruiter'], {
    message: "role must be 'job_seeker' or 'recruiter'",
  }),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  contactNumber: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;


// ─── Refresh Token (body-based) ───────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
