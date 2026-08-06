import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { authorize } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createApplicationSchema, updateStatusSchema } from './application.validation';
import * as applicationController from './application.controller';

const router = Router();

router.use(authenticate);

// ─── Static / Specific Routes First ───────────────────────────────────────────

// Seeker: Get their own applications
router.get(
  '/me',
  authorize('job_seeker'),
  applicationController.getMyApplications
);

// Recruiter: Get applications for a specific job they posted
router.get(
  '/job/:jobId',
  authorize('recruiter'),
  applicationController.getApplicationsForJob
);

// ─── Root Route ───────────────────────────────────────────────────────────────

// Seeker: Apply to a job
router.post(
  '/',
  authorize('job_seeker'),
  validate(createApplicationSchema),
  applicationController.apply
);

// ─── Dynamic / ID-based Routes Last ───────────────────────────────────────────

// Recruiter: Update application status
router.patch(
  '/:id/status',
  authorize('recruiter'),
  validate(updateStatusSchema),
  applicationController.updateStatus
);

// Seeker: Withdraw application
router.patch(
  '/:id/withdraw',
  authorize('job_seeker'),
  applicationController.withdraw
);

export const applicationRoutes = router;
