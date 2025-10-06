import { Router } from "express";
import { register, login, me, completeProfile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.get("/me", requireAuth, me);
router.post("/login", login);
router.post("/complete-profile", requireAuth, completeProfile);

export default router;
