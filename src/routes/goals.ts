import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getGoals, postGoal } from '../controllers/goals.controller';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => getGoals(req, res));

router.post('/', requireAuth, async (req: AuthRequest, res) => postGoal(req, res));

export default router;


