import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getGoals, postGoal, getGoal, putGoal, deleteGoalController, addMoneyToGoalController } from "../controllers/goals.controller";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => getGoals(req, res));
router.get("/:id", requireAuth, async (req: AuthRequest, res) => getGoal(req, res));
router.post("/", requireAuth, async (req: AuthRequest, res) => postGoal(req, res));
router.put("/:id", requireAuth, async (req: AuthRequest, res) => putGoal(req, res));
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => deleteGoalController(req, res));
router.post("/:id/add-money", requireAuth, async (req: AuthRequest, res) => addMoneyToGoalController(req, res));

export default router;
