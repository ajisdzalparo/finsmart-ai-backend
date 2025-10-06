import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import {
  TransactionInput,
  createBatch,
  createBatchItems,
  createQuickTransaction,
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionsByCategory,
  checkTransactionNameUnique,
} from "../services/transactions.service";
import { successResponse } from "../utils/response";

const baseSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  transactionDate: z.string(),
  categoryId: z.string().optional(),
  templateId: z.string().optional(),
});

export async function getTransactions(req: AuthRequest, res: Response) {
  const items = await listTransactions(req.userId);
  successResponse(res, items);
}

export async function postQuickTransaction(req: AuthRequest, res: Response) {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const { description, categoryId } = parsed.data;

  // Validasi nama transaksi unik berdasarkan kategori
  if (description && categoryId) {
    const existingTransaction = await checkTransactionNameUnique(req.userId, description, categoryId);
    if (existingTransaction) {
      return res.status(400).json({
        error: "Nama transaksi sudah ada untuk kategori ini",
        details: `Transaksi dengan nama "${description}" sudah ada untuk kategori "${existingTransaction.category?.name}"`,
      });
    }
  }

  const item = await createQuickTransaction(req.userId, parsed.data as TransactionInput);
  successResponse(res, item, "Transaction created", 201);
}

const batchSchema = z.object({
  description: z.string().optional(),
  items: z.array(baseSchema),
});

export async function postBatchTransactions(req: AuthRequest, res: Response) {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const { description, items } = parsed.data;

  // Validasi nama transaksi unik untuk setiap item dalam batch
  for (const item of items) {
    if (item.description && item.categoryId) {
      const existingTransaction = await checkTransactionNameUnique(req.userId, item.description, item.categoryId);
      if (existingTransaction) {
        return res.status(400).json({
          error: "Nama transaksi sudah ada untuk kategori ini",
          details: `Transaksi dengan nama "${item.description}" sudah ada untuk kategori "${existingTransaction.category?.name}"`,
        });
      }
    }
  }

  const batch = await createBatch(req.userId, description);
  const created = await createBatchItems(req.userId, batch.id, items as TransactionInput[]);
  successResponse(res, { batch, items: created }, "Batch transactions created", 201);
}

export async function getTransaction(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const item = await getTransactionById(req.userId, id);
  if (!item) return res.status(404).json({ error: "Transaction not found" });
  successResponse(res, item);
}

export async function putTransaction(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const parsed = baseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const existingTransaction = await getTransactionById(req.userId, id);
  if (!existingTransaction) return res.status(404).json({ error: "Transaction not found" });

  const { description, categoryId } = parsed.data;

  // Validasi nama transaksi unik berdasarkan kategori (untuk update)
  if (description && categoryId) {
    const duplicateTransaction = await checkTransactionNameUnique(req.userId, description, categoryId, id);
    if (duplicateTransaction) {
      return res.status(400).json({
        error: "Nama transaksi sudah ada untuk kategori ini",
        details: `Transaksi dengan nama "${description}" sudah ada untuk kategori "${duplicateTransaction.category?.name}"`,
      });
    }
  }

  const item = await updateTransaction(req.userId, id, parsed.data);
  successResponse(res, item);
}

export async function deleteTransactionController(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const existingTransaction = await getTransactionById(req.userId, id);
  if (!existingTransaction) return res.status(404).json({ error: "Transaction not found" });

  await deleteTransaction(req.userId, id);
  successResponse(res, null, "Transaction deleted", 204);
}

export async function getTransactionsByCategoryController(req: AuthRequest, res: Response) {
  const { categoryId } = req.params;
  const items = await getTransactionsByCategory(req.userId, categoryId);
  successResponse(res, items);
}

export async function validateTransactionName(req: AuthRequest, res: Response) {
  const { description, categoryId } = req.query;

  if (!description || !categoryId) {
    return res.status(400).json({ error: "Description and categoryId are required" });
  }

  const existingTransaction = await checkTransactionNameUnique(req.userId, description as string, categoryId as string);

  if (existingTransaction) {
    return res.status(200).json({
      isValid: false,
      message: `Nama transaksi "${description}" sudah ada untuk kategori "${existingTransaction.category?.name}"`,
    });
  }

  return res.status(200).json({ isValid: true });
}
