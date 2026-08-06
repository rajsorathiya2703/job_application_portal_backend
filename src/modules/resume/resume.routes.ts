import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { authorize } from '../../middlewares/authorize.middleware';
import { upload } from '../../config/multer';
import { AppError } from '../../utils/apiError';
import * as resumeController from './resume.controller';

const router = Router();

// ─── All resume routes require a logged-in job seeker ────────────────────────
router.use(authenticate, authorize('job_seeker'));

// ─── Multer error wrapper ─────────────────────────────────────────────────────
/**
 * Runs the configured multer middleware and converts multer-specific errors
 * (wrong file type, file too large) into AppErrors so the global error handler
 * returns consistent JSON responses instead of raw multer messages.
 */
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      // e.g. LIMIT_FILE_SIZE
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(400, 'File too large. Maximum allowed size is 5 MB.'));
      }
      return next(new AppError(400, `Upload error: ${err.message}`));
    }

    // fileFilter rejection — err is a plain Error with our custom message
    if (err instanceof Error) {
      return next(new AppError(400, err.message));
    }

    return next(new AppError(500, 'File upload failed'));
  });
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/resumes — upload a resume file
router.post('/', handleUpload, resumeController.create);

// GET /api/resumes — list all resumes for the current job seeker
router.get('/', resumeController.getMyResumes);

// PATCH /api/resumes/:id/default — mark a resume as default
router.patch('/:id/default', resumeController.setDefault);

// DELETE /api/resumes/:id — delete a resume (DB + disk)
router.delete('/:id', resumeController.deleteResume);

export const resumeRoutes = router;
