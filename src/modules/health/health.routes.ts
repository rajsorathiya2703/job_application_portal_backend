import { Router } from 'express';
import { checkHealth } from './health.controller';

const router = Router();

router.get('/', checkHealth);

export const healthRoutes = router;
