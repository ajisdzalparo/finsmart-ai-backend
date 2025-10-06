import { Request, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { createTrajectory, listUserTrajectories, TrajectoryInput } from "../services/trajectories.service";

const trajectorySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function getTrajectories(req: AuthRequest, res: Response) {
  const items = await listUserTrajectories(req.userId);
  res.json(items);
}

export async function postTrajectory(req: AuthRequest, res: Response) {
  const parsed = trajectorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try {
    const created = await createTrajectory(req.userId, parsed.data as TrajectoryInput);
    res.status(201).json(created);
  } catch (err: any) {
    const status = err?.status ?? 500;
    res.status(status).json({ error: err?.message ?? "Internal Server Error" });
  }
}
