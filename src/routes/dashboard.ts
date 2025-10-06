import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getDashboard } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => getDashboard(req, res));

export default router;


