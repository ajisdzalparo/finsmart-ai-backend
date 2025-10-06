"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.getCategoryById = getCategoryById;
exports.getCategoryByNameAndType = getCategoryByNameAndType;
exports.isCategoryUsedInTransactions = isCategoryUsedInTransactions;
exports.softDeleteCategory = softDeleteCategory;
exports.listDeletedCategories = listDeletedCategories;
exports.getDeletedCategoryById = getDeletedCategoryById;
exports.restoreCategory = restoreCategory;
const database_1 = require("../utils/database");
function listCategories(userId) {
    return database_1.prisma.category.findMany({
        where: {
            userId,
            isDeleted: false,
        },
        orderBy: { createdAt: "desc" },
    });
}
function createCategory(userId, input) {
    return database_1.prisma.category.create({ data: { ...input, userId: userId } });
}
function updateCategory(userId, categoryId, input) {
    return database_1.prisma.category.update({
        where: {
            id: categoryId,
            userId: userId,
        },
        data: input,
    });
}
function deleteCategory(userId, categoryId) {
    return database_1.prisma.category.delete({
        where: {
            id: categoryId,
            userId: userId,
        },
    });
}
function getCategoryById(userId, categoryId) {
    return database_1.prisma.category.findFirst({
        where: {
            id: categoryId,
            userId: userId,
            isDeleted: false,
        },
    });
}
function getCategoryByNameAndType(userId, name, type, excludeId) {
    return database_1.prisma.category.findFirst({
        where: {
            name,
            type,
            userId: userId,
            isDeleted: false,
            ...(excludeId && { id: { not: excludeId } }),
        },
    });
}
function isCategoryUsedInTransactions(categoryId) {
    return database_1.prisma.transaction
        .findFirst({
        where: {
            categoryId,
        },
    })
        .then((transaction) => !!transaction);
}
function softDeleteCategory(userId, categoryId) {
    return database_1.prisma.category.update({
        where: {
            id: categoryId,
            userId: userId,
        },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });
}
function listDeletedCategories(userId) {
    return database_1.prisma.category.findMany({
        where: {
            userId,
            isDeleted: true,
        },
        orderBy: { deletedAt: "desc" },
    });
}
function getDeletedCategoryById(userId, categoryId) {
    return database_1.prisma.category.findFirst({
        where: {
            id: categoryId,
            userId: userId,
            isDeleted: true,
        },
    });
}
function restoreCategory(userId, categoryId) {
    return database_1.prisma.category.update({
        where: {
            id: categoryId,
            userId: userId,
        },
        data: {
            isDeleted: false,
            deletedAt: null,
        },
    });
}
