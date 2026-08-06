import { z } from 'zod';

// ─── Update Recruiter Profile ─────────────────────────────────────────────────

export const updateRecruiterProfileSchema = z.object({
  designation: z.string().trim().optional(),
});

export type UpdateRecruiterProfileInput = z.infer<typeof updateRecruiterProfileSchema>;

// ─── Update Company ───────────────────────────────────────────────────────────

export const updateCompanySchema = z.object({
  name: z.string().trim().min(1, 'Company name cannot be empty').optional(),
  description: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),
  address: z.string().trim().optional(),
  contactNumber1: z.string().trim().optional(),
  contactNumber2: z.string().trim().optional(),
  logo: z.string().url('logo must be a valid URL').optional(),
  website: z.string().url('website must be a valid URL').optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
