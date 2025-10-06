import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getReminders, postReminder } from '../controllers/reminders.controller';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => getReminders(req, res));

router.post('/', requireAuth, async (req: AuthRequest, res) => postReminder(req, res));

export default router;


