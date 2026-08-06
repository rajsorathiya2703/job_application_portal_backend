import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.validation';

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

const experienceRangeSchema = z
  .object({
    min: z.number({ message: 'min must be a number' }).min(0).optional(),
    max: z.number({ message: 'max must be a number' }).min(0).optional(),
  })
  .optional();

const locationSchema = z
  .object({
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    isRemote: z.boolean().optional(),
  })
  .optional();

// ─── Create Job ───────────────────────────────────────────────────────────────
// `company` and `postedBy` are derived from req.user in the controller — not part of the body schema.

const createJobBaseSchema = z
  .object({
    title: z.string().trim().min(1, 'Job title is required'),
    description: z.string().trim().min(1, 'Job description is required'),
    totalExperience: experienceRangeSchema,
    relevantExperience: experienceRangeSchema,
    jobType: z.enum(['full_time', 'part_time', 'internship', 'contract'], {
      message: "jobType must be one of: full_time, part_time, internship, contract",
    }),
    workMode: z.enum(['onsite', 'remote', 'hybrid'], {
      message: "workMode must be one of: onsite, remote, hybrid",
    }),
    tags: z.array(objectIdSchema).optional(),
    location: locationSchema,
    openPositions: z.number({ message: 'openPositions must be a number' }).int().min(1).default(1),
    status: z
      .enum(['open', 'closed', 'draft'], {
        message: "status must be one of: open, closed, draft",
      })
      .default('open'),
    applicationDeadline: z.coerce
      .date({ message: 'applicationDeadline must be a valid date' })
      .optional(),
  });

export const createJobSchema = createJobBaseSchema
  .refine(
    (data) => {
      const te = data.totalExperience;
      if (te?.min !== undefined && te?.max !== undefined) {
        return te.min <= te.max;
      }
      return true;
    },
    {
      message: 'totalExperience.min must be less than or equal to totalExperience.max',
      path: ['totalExperience', 'min'],
    }
  );

export type CreateJobInput = z.infer<typeof createJobSchema>;

// ─── Update Job ───────────────────────────────────────────────────────────────

export const updateJobSchema = createJobBaseSchema.partial();

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
