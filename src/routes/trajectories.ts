import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getTrajectories, postTrajectory } from "../controllers/trajectories.controller";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => getTrajectories(req, res));

router.post("/", requireAuth, async (req: AuthRequest, res) => postTrajectory(req, res));

export default router;
