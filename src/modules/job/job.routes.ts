import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { authorize } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createJobSchema, updateJobSchema } from './job.validation';
import * as jobController from './job.controller';

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// GET /api/jobs — public listing (always status=open only)
router.get('/', jobController.listJobs);

// GET /api/jobs/:id — public single job
router.get('/:id', jobController.getJobById);

// ─── Recruiter-only Routes ────────────────────────────────────────────────────

// GET /api/jobs/recruiter/mine — recruiter sees all their own jobs (all statuses)
// IMPORTANT: This specific route must be defined BEFORE /:id to avoid Express
// treating "recruiter" as a dynamic :id segment.
router.get(
  '/recruiter/mine',
  authenticate,
  authorize('recruiter'),
  jobController.listMyJobs
);

// POST /api/jobs — create a job
router.post(
  '/',
  authenticate,
  authorize('recruiter'),
  validate(createJobSchema),
  jobController.createJob
);

// PUT /api/jobs/:id — update a job (ownership verified in service)
router.put(
  '/:id',
  authenticate,
  authorize('recruiter'),
  validate(updateJobSchema),
  jobController.updateJob
);

// DELETE /api/jobs/:id — delete a job (ownership verified in service)
router.delete(
  '/:id',
  authenticate,
  authorize('recruiter'),
  jobController.deleteJob
);

export const jobRoutes = router;
