import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getTemplates, postTemplate } from '../controllers/templates.controller';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => getTemplates(req, res));

router.post('/', requireAuth, async (req: AuthRequest, res) => postTemplate(req, res));

export default router;


