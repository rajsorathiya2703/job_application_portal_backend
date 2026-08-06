import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/authenticate.middleware';
import {
  registerSchema,
  loginSchema,
} from './auth.validation';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

export const authRoutes = router;
