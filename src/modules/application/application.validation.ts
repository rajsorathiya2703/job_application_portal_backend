import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.validation';

// ─── Create Application ───────────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  jobId: objectIdSchema,
  resumeId: objectIdSchema,
  coverLetter: z.string().trim().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

// ─── Update Status ────────────────────────────────────────────────────────────

export const updateStatusSchema = z.object({
  status: z.enum(
    ['applied', 'under_review', 'shortlisted', 'rejected', 'hired', 'withdrawn'],
    {
      message:
        "status must be one of: applied, under_review, shortlisted, rejected, hired, withdrawn",
    }
  ),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
