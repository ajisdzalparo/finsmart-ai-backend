"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactions = listTransactions;
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
function createBatchItems(userId, batchId, items) {
    return database_1.prisma.$transaction(items.map((t) => database_1.prisma.transaction.create({
        data: {
            ...t,
            transactionDate: new Date(t.transactionDate),
            userId: userId,
            batchId,
        },
    })));
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
