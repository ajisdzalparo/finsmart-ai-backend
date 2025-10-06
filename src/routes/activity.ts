import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getActivity } from "../controllers/activity.controller";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => getActivity(req, res));

export default router;
