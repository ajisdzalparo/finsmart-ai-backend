import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { postReport, getReports, getReport } from "../controllers/reports.controller";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => getReports(req, res));
router.get("/:id", requireAuth, async (req: AuthRequest, res) => getReport(req, res));
router.post("/", requireAuth, async (req: AuthRequest, res) => postReport(req, res));

export default router;
