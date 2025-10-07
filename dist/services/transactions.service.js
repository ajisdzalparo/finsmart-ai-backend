"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactions = listTransactions;
exports.listTransactionsPaginated = listTransactionsPaginated;
exports.createQuickTransaction = createQuickTransaction;
exports.createBatch = createBatch;
exports.createBatchItems = createBatchItems;
exports.getTransactionById = getTransactionById;
exports.updateTransaction = updateTransaction;
exports.deleteTransaction = deleteTransaction;
exports.getTransactionsByCategory = getTransactionsByCategory;
exports.checkTransactionNameUnique = checkTransactionNameUnique;
const database_1 = require("../utils/database");
function listTransactions(userId) {
    return database_1.prisma.transaction.findMany({ where: { userId }, orderBy: { transactionDate: "desc" } });
}
async function listTransactionsPaginated(userId, page, limit, options) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;
    const whereClause = { userId };
    // Filter berdasarkan tipe kategori jika disediakan
    const type = options?.type && options.type !== "all" ? options.type : undefined;
    if (type) {
        whereClause.category = { ...(whereClause.category || {}), type };
    }
    // Pencarian dengan q pada description atau nama kategori (case-insensitive)
    const q = options?.q?.trim();
    if (q) {
        const orConditions = [{ description: { contains: q, mode: "insensitive" } }, { category: { name: { contains: q, mode: "insensitive" } } }];
        whereClause.OR = orConditions;
    }
    const [total, items] = await Promise.all([
        database_1.prisma.transaction.count({ where: whereClause }),
        database_1.prisma.transaction.findMany({
            where: whereClause,
            orderBy: { transactionDate: "desc" },
            skip,
            take: safeLimit,
            include: { category: true },
        }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return { items, total, page: safePage, limit: safeLimit, totalPages };
}
function createQuickTransaction(userId, input) {
    return database_1.prisma.transaction.create({
        data: {
            ...input,
            transactionDate: new Date(input.transactionDate),
            userId: userId,
        },
    });
}
function createBatch(userId, description) {
    return database_1.prisma.transactionBatch.create({ data: { description, userId: userId } });
}
async function createBatchItems(userId, batchId, items) {
    // Buat semua transaksi terlebih dahulu
    const created = await database_1.prisma.$transaction(items.map((t) => database_1.prisma.transaction.create({
        data: {
            amount: t.amount,
            currency: t.currency,
            description: t.description,
            transactionDate: new Date(t.transactionDate),
            categoryId: t.categoryId ?? null,
            templateId: t.templateId ?? null,
            userId: userId,
            batchId,
        },
    })));
    // Setelah transaksi dibuat, proses alokasi ke goals (jika ada)
    const allocationOps = [];
    items.forEach((t, idx) => {
        const allocs = t.goalAllocations || [];
        if (!allocs.length)
            return;
        // Validasi sederhana: amount alokasi tidak melampaui amount transaksi
        const totalAlloc = allocs.reduce((s, a) => s + (Number(a.amount) || 0), 0);
        if (totalAlloc > Number(t.amount)) {
            // Jika melebihi, batalkan seluruh batch dengan melempar error
            throw new Error("Total alokasi goal melebihi jumlah transaksi");
        }
        // Siapkan increment currentAmount per goal
        for (const a of allocs) {
            if (!a.goalId || !(Number(a.amount) > 0))
                continue;
            allocationOps.push(database_1.prisma.goal.update({
                where: { id: a.goalId, userId: userId },
                data: { currentAmount: { increment: Number(a.amount) } },
            }));
        }
    });
    if (allocationOps.length > 0) {
        await database_1.prisma.$transaction(allocationOps);
    }
    return created;
}
function getTransactionById(userId, transactionId) {
    return database_1.prisma.transaction.findFirst({
        where: {
            id: transactionId,
            userId: userId,
        },
        include: {
            category: true,
        },
    });
}
function updateTransaction(userId, transactionId, input) {
    return database_1.prisma.transaction.update({
        where: {
            id: transactionId,
            userId: userId,
        },
        data: {
            ...input,
            transactionDate: input.transactionDate ? new Date(input.transactionDate) : undefined,
        },
        include: {
            category: true,
        },
    });
}
function deleteTransaction(userId, transactionId) {
    return database_1.prisma.transaction.delete({
        where: {
            id: transactionId,
            userId: userId,
        },
    });
}
function getTransactionsByCategory(userId, categoryId) {
    return database_1.prisma.transaction.findMany({
        where: {
            userId,
            categoryId,
        },
        orderBy: { transactionDate: "desc" },
        include: {
            category: true,
        },
    });
}
async function checkTransactionNameUnique(userId, description, categoryId, excludeId) {
    const whereClause = {
        userId,
        description,
        categoryId,
    };
    // Jika ada excludeId (untuk update), exclude transaksi tersebut
    if (excludeId) {
        whereClause.id = { not: excludeId };
    }
    const existingTransaction = await database_1.prisma.transaction.findFirst({
        where: whereClause,
        include: {
            category: true,
        },
    });
    return existingTransaction;
}
