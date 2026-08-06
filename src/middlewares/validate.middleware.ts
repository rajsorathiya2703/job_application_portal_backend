import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { AppError } from '../utils/apiError';

/**
 * Factory that returns an Express middleware that validates `req[source]`
 * against the given Zod schema.
 *
 * On success  → replaces `req[source]` with the parsed (typed + coerced) value.
 * On failure  → calls `next(new AppError(400, message))` with a human-readable
 *               summary of all field errors instead of a raw ZodError.
 */
export const validate =
  (schema: ZodType, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    // Default to empty object if req[source] is undefined (e.g. due to missing Content-Type header)
    const dataToValidate = req[source] ?? {};
    const result = schema.safeParse(dataToValidate);

    if (result.success) {
      // Replace with parsed/coerced data so downstream handlers get typed values
      (req as unknown as Record<string, unknown>)[source] = result.data;
      return next();
    }

    // Flatten ZodError into field-level messages
    const flat = result.error.flatten();

    // Build a readable array of "field: message" pairs
    const fieldMessages: string[] = [];

    // Top-level form errors (e.g. failed refinements at the root object level)
    for (const msg of flat.formErrors) {
      fieldMessages.push(msg);
    }

    // Per-field errors
    for (const [field, messages] of Object.entries(flat.fieldErrors)) {
      if (Array.isArray(messages)) {
        for (const msg of messages) {
          fieldMessages.push(`${field}: ${msg}`);
        }
      }
    }

    const humanReadableMessage =
      fieldMessages.length > 0
        ? fieldMessages.join('; ')
        : 'Validation failed';

    return next(new AppError(400, humanReadableMessage));
  };
