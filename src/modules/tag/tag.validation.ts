import { z } from 'zod';

// ─── Create Tag ───────────────────────────────────────────────────────────────

export const createTagSchema = z.object({
  title: z.string().trim().min(1, 'Tag title is required'),
  appliesOn: z.enum(['job', 'skill'], {
    message: "appliesOn must be one of: job, skill",
  }),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
