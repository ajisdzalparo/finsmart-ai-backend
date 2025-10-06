import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { listActivity } from '../services/activity.service';

export async function getActivity(req: AuthRequest, res: Response) {
  const items = await listActivity(req.userId);
  res.json(items);
}


