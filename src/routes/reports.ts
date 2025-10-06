import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { postReport } from "../controllers/reports.controller";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => postReport(req, res));

export default router;
