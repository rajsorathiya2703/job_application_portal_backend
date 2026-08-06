import { z } from 'zod';

/**
 * Shared Zod refinement helper for validating MongoDB ObjectId strings.
 * Reuse this everywhere an *Id field is expected instead of duplicating the regex.
 *
 * Usage:
 *   jobId: objectIdSchema
 *   resumeId: objectIdSchema
 */
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export const objectIdSchema = z
  .string({ message: 'Must be a string' })
  .refine((val) => OBJECT_ID_REGEX.test(val), {
    message: 'Must be a valid MongoDB ObjectId (24-character hex string)',
  });

export type ObjectId = z.infer<typeof objectIdSchema>;
