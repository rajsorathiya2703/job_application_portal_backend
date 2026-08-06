import { z } from 'zod';

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Education ───────────────────────────────────────────────────────────────

export const educationSchema = z
  .object({
    universityName: z.string().trim().min(1, 'University name is required'),
    courseName: z.string().trim().min(1, 'Course name is required'),
    startYear: z.number({ message: 'startYear must be a number' }).int().optional(),
    endYear: z.number({ message: 'endYear must be a number' }).int().optional(),
    percentage: z
      .number({ message: 'percentage must be a number' })
      .min(0)
      .max(100)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startYear !== undefined && data.endYear !== undefined) {
        return data.startYear <= data.endYear;
      }
      return true;
    },
    { message: 'startYear must be less than or equal to endYear', path: ['startYear'] }
  );

export type EducationInput = z.infer<typeof educationSchema>;

// ─── Experience ───────────────────────────────────────────────────────────────

export const experienceSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  startDate: z.coerce.date({ message: 'startDate must be a valid date' }).optional(),
  endDate: z.coerce.date({ message: 'endDate must be a valid date' }).optional(),
  field: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

// ─── Project ──────────────────────────────────────────────────────────────────

export const projectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required'),
  description: z.string().trim().optional(),
  techStack: z
    .array(z.string().trim().min(1))
    .default([]),
  startDate: z.coerce.date({ message: 'startDate must be a valid date' }).optional(),
  endDate: z.coerce.date({ message: 'endDate must be a valid date' }).optional(),
  link: z.string().url('link must be a valid URL').optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
