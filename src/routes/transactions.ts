import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import {
  getTransactions,
  postBatchTransactions,
  postQuickTransaction,
  getTransaction,
  putTransaction,
  deleteTransactionController,
  getTransactionsByCategoryController,
  validateTransactionName,
} from "../controllers/transactions.controller";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => getTransactions(req, res));
router.get("/validate", requireAuth, async (req: AuthRequest, res) => validateTransactionName(req, res));
router.get("/:id", requireAuth, async (req: AuthRequest, res) => getTransaction(req, res));
router.get("/category/:categoryId", requireAuth, async (req: AuthRequest, res) => getTransactionsByCategoryController(req, res));
router.post("/quick", requireAuth, async (req: AuthRequest, res) => postQuickTransaction(req, res));
router.post("/batch", requireAuth, async (req: AuthRequest, res) => postBatchTransactions(req, res));
router.put("/:id", requireAuth, async (req: AuthRequest, res) => putTransaction(req, res));
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => deleteTransactionController(req, res));

export default router;
