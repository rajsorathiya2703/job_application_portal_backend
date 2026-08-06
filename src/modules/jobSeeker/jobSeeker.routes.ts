import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { authorize } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  updateProfileSchema,
  educationSchema,
  experienceSchema,
  projectSchema,
} from './jobSeeker.validation';
import * as jobSeekerController from './jobSeeker.controller';

const router = Router();

// All routes require authentication and job_seeker role
router.use(authenticate, authorize('job_seeker'));

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get('/me', jobSeekerController.getMyProfile);
router.put('/me', validate(updateProfileSchema), jobSeekerController.updateMyProfile);

// ─── Education ────────────────────────────────────────────────────────────────
router.post('/me/education', validate(educationSchema), jobSeekerController.addEducation);
router.put('/me/education/:eduId', validate(educationSchema), jobSeekerController.updateEducation);
router.delete('/me/education/:eduId', jobSeekerController.deleteEducation);

// ─── Experience ───────────────────────────────────────────────────────────────
router.post('/me/experience', validate(experienceSchema), jobSeekerController.addExperience);
router.put('/me/experience/:expId', validate(experienceSchema), jobSeekerController.updateExperience);
router.delete('/me/experience/:expId', jobSeekerController.deleteExperience);

// ─── Projects ─────────────────────────────────────────────────────────────────
router.post('/me/projects', validate(projectSchema), jobSeekerController.addProject);
router.put('/me/projects/:projectId', validate(projectSchema), jobSeekerController.updateProject);
router.delete('/me/projects/:projectId', jobSeekerController.deleteProject);

export const jobSeekerRoutes = router;
