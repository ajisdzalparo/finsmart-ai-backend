import { Router } from "express";
import { register, login, me, completeProfile, updateName, changePassword } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.get("/me", requireAuth, me);
router.post("/login", login);
router.post("/complete-profile", requireAuth, completeProfile);
router.post("/update-name", requireAuth, updateName);
router.post("/change-password", requireAuth, changePassword);

export default router;
