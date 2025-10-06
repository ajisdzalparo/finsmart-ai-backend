import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getProfiles, postProfile } from '../controllers/profiles.controller';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => getProfiles(req, res));

router.post('/', requireAuth, async (req: AuthRequest, res) => postProfile(req, res));

export default router;


