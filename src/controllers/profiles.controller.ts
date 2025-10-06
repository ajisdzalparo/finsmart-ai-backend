import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createProfile, listProfiles } from '../services/profiles.service';

const profileSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0).optional(),
});

export async function getProfiles(req: AuthRequest, res: Response) {
  const profiles = await listProfiles(req.userId);
  res.json(profiles);
}

export async function postProfile(req: AuthRequest, res: Response) {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const profile = await createProfile(req.userId, parsed.data);
  res.status(201).json(profile);
}


