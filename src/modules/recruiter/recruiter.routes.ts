import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { authorize } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  updateRecruiterProfileSchema,
  updateCompanySchema,
} from './recruiter.validation';
import * as recruiterController from './recruiter.controller';

const router = Router();

// All routes require authentication and recruiter role
router.use(authenticate, authorize('recruiter'));

router.get('/me', recruiterController.getMyProfile);
router.put('/me', validate(updateRecruiterProfileSchema), recruiterController.updateDesignation);
router.put('/me/company', validate(updateCompanySchema), recruiterController.createOrUpdateCompany);

export const recruiterRoutes = router;
