import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { buildRecommendations } from '../services/recommendations.service';

export async function getRecommendations(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const data = await buildRecommendations(userId);
  res.json(data);
}


