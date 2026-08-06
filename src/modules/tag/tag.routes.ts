import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { authorize } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createTagSchema } from './tag.validation';
import * as tagController from './tag.controller';

const router = Router();

// GET /?appliesOn=job|skill — public, no auth required
router.get('/', tagController.list);

// POST / — authenticate + authorize('recruiter') → validate → create
router.post(
  '/',
  authenticate,
  authorize('recruiter'),
  validate(createTagSchema),
  tagController.create
);

export const tagRoutes = router;
