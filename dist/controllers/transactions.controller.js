"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
exports.postQuickTransaction = postQuickTransaction;
exports.postBatchTransactions = postBatchTransactions;
exports.getTransaction = getTransaction;
exports.putTransaction = putTransaction;
exports.deleteTransactionController = deleteTransactionController;
exports.getTransactionsByCategoryController = getTransactionsByCategoryController;
exports.validateTransactionName = validateTransactionName;
const zod_1 = require("zod");
const transactions_service_1 = require("../services/transactions.service");
const response_1 = require("../utils/response");
const baseSchema = zod_1.z.object({
    amount: zod_1.z.number(),
    currency: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    transactionDate: zod_1.z.string(),
    categoryId: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
});
async function getTransactions(req, res) {
    const items = await (0, transactions_service_1.listTransactions)(req.userId);
    (0, response_1.successResponse)(res, items);
}
async function postQuickTransaction(req, res) {
    const parsed = baseSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const { description, categoryId } = parsed.data;
    // Validasi nama transaksi unik berdasarkan kategori
    if (description && categoryId) {
        const existingTransaction = await (0, transactions_service_1.checkTransactionNameUnique)(req.userId, description, categoryId);
        if (existingTransaction) {
            return res.status(400).json({
                error: "Nama transaksi sudah ada untuk kategori ini",
                details: `Transaksi dengan nama "${description}" sudah ada untuk kategori "${existingTransaction.category?.name}"`,
            });
        }
    }
    const item = await (0, transactions_service_1.createQuickTransaction)(req.userId, parsed.data);
    (0, response_1.successResponse)(res, item, "Transaction created", 201);
}
const batchSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    items: zod_1.z.array(baseSchema),
});
async function postBatchTransactions(req, res) {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const { description, items } = parsed.data;
    // Validasi nama transaksi unik untuk setiap item dalam batch
    for (const item of items) {
        if (item.description && item.categoryId) {
            const existingTransaction = await (0, transactions_service_1.checkTransactionNameUnique)(req.userId, item.description, item.categoryId);
            if (existingTransaction) {
                return res.status(400).json({
                    error: "Nama transaksi sudah ada untuk kategori ini",
                    details: `Transaksi dengan nama "${item.description}" sudah ada untuk kategori "${existingTransaction.category?.name}"`,
                });
            }
        }
    }
    const batch = await (0, transactions_service_1.createBatch)(req.userId, description);
    const created = await (0, transactions_service_1.createBatchItems)(req.userId, batch.id, items);
    (0, response_1.successResponse)(res, { batch, items: created }, "Batch transactions created", 201);
}
async function getTransaction(req, res) {
    const { id } = req.params;
    const item = await (0, transactions_service_1.getTransactionById)(req.userId, id);
    if (!item)
        return res.status(404).json({ error: "Transaction not found" });
    (0, response_1.successResponse)(res, item);
}
async function putTransaction(req, res) {
    const { id } = req.params;
    const parsed = baseSchema.partial().safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const existingTransaction = await (0, transactions_service_1.getTransactionById)(req.userId, id);
    if (!existingTransaction)
        return res.status(404).json({ error: "Transaction not found" });
    const { description, categoryId } = parsed.data;
    // Validasi nama transaksi unik berdasarkan kategori (untuk update)
    if (description && categoryId) {
        const duplicateTransaction = await (0, transactions_service_1.checkTransactionNameUnique)(req.userId, description, categoryId, id);
        if (duplicateTransaction) {
            return res.status(400).json({
                error: "Nama transaksi sudah ada untuk kategori ini",
                details: `Transaksi dengan nama "${description}" sudah ada untuk kategori "${duplicateTransaction.category?.name}"`,
            });
        }
    }
    const item = await (0, transactions_service_1.updateTransaction)(req.userId, id, parsed.data);
    (0, response_1.successResponse)(res, item);
}
async function deleteTransactionController(req, res) {
    const { id } = req.params;
    const existingTransaction = await (0, transactions_service_1.getTransactionById)(req.userId, id);
    if (!existingTransaction)
        return res.status(404).json({ error: "Transaction not found" });
    await (0, transactions_service_1.deleteTransaction)(req.userId, id);
    (0, response_1.successResponse)(res, null, "Transaction deleted", 204);
}
async function getTransactionsByCategoryController(req, res) {
    const { categoryId } = req.params;
    const items = await (0, transactions_service_1.getTransactionsByCategory)(req.userId, categoryId);
    (0, response_1.successResponse)(res, items);
}
async function validateTransactionName(req, res) {
    const { description, categoryId } = req.query;
    if (!description || !categoryId) {
        return res.status(400).json({ error: "Description and categoryId are required" });
    }
    const existingTransaction = await (0, transactions_service_1.checkTransactionNameUnique)(req.userId, description, categoryId);
    if (existingTransaction) {
        return res.status(200).json({
            isValid: false,
            message: `Nama transaksi "${description}" sudah ada untuk kategori "${existingTransaction.category?.name}"`,
        });
    }
    return res.status(200).json({ isValid: true });
}
