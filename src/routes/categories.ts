import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { getCategories, getCategory, postCategory, putCategory, deleteCategoryController, getDeletedCategories, restoreCategoryController } from "../controllers/categories.controller";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => getCategories(req, res));
router.get("/deleted", requireAuth, async (req: AuthRequest, res) => getDeletedCategories(req, res));
router.get("/:id", requireAuth, async (req: AuthRequest, res) => getCategory(req, res));
router.post("/", requireAuth, async (req: AuthRequest, res) => postCategory(req, res));
router.put("/:id", requireAuth, async (req: AuthRequest, res) => putCategory(req, res));
router.put("/:id/restore", requireAuth, async (req: AuthRequest, res) => restoreCategoryController(req, res));
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => deleteCategoryController(req, res));

export default router;
