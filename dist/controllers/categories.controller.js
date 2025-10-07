"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.getCategory = getCategory;
exports.postCategory = postCategory;
exports.putCategory = putCategory;
exports.deleteCategoryController = deleteCategoryController;
exports.getDeletedCategories = getDeletedCategories;
exports.restoreCategoryController = restoreCategoryController;
const zod_1 = require("zod");
const categories_service_1 = require("../services/categories.service");
const response_1 = require("../utils/response");
const schema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Nama kategori harus diisi").max(50, "Nama kategori maksimal 50 karakter"),
    type: zod_1.z.enum(["income", "expense", "transfer"], {
        message: "Tipe kategori harus berupa income, expense, atau transfer",
    }),
    color: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus berupa hex color (#RRGGBB)")
        .optional(),
    icon: zod_1.z.string().max(50, "Nama icon maksimal 50 karakter").optional(),
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Nama kategori harus diisi").max(50, "Nama kategori maksimal 50 karakter").optional(),
    type: zod_1.z
        .enum(["income", "expense", "transfer"], {
        message: "Tipe kategori harus berupa income, expense, atau transfer",
    })
        .optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus berupa hex color (#RRGGBB)")
        .optional(),
    icon: zod_1.z.string().max(50, "Nama icon maksimal 50 karakter").optional(),
});
async function getCategories(req, res) {
    const items = await (0, categories_service_1.listCategories)(req.userId);
    (0, response_1.successResponse)(res, items);
}
async function getCategory(req, res) {
    const { id } = req.params;
    const item = await (0, categories_service_1.getCategoryById)(req.userId, id);
    if (!item)
        return res.status(404).json({ error: "Category not found" });
    (0, response_1.successResponse)(res, item);
}
async function postCategory(req, res) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    // Check for duplicate category name
    const existingCategory = await (0, categories_service_1.getCategoryByNameAndType)(req.userId, parsed.data.name, parsed.data.type);
    if (existingCategory) {
        return (0, response_1.errorResponse)(res, "Kategori dengan nama dan tipe yang sama sudah ada", 409);
    }
    const item = await (0, categories_service_1.createCategory)(req.userId, parsed.data);
    (0, response_1.successResponse)(res, item, "Category created", 201);
}
async function putCategory(req, res) {
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const existingCategory = await (0, categories_service_1.getCategoryById)(req.userId, id);
    if (!existingCategory)
        return res.status(404).json({ error: "Category not found" });
    // Check for duplicate category name if name is being updated
    if (parsed.data.name) {
        // Use existing category type if type is not being updated
        const categoryType = parsed.data.type || existingCategory.type;
        const duplicateCategory = await (0, categories_service_1.getCategoryByNameAndType)(req.userId, parsed.data.name, categoryType, id);
        if (duplicateCategory) {
            (0, response_1.errorResponse)(res, "Kategori dengan nama dan tipe yang sama sudah ada", 409);
        }
    }
    const item = await (0, categories_service_1.updateCategory)(req.userId, id, parsed.data);
    (0, response_1.successResponse)(res, item);
}
async function deleteCategoryController(req, res) {
    const { id } = req.params;
    const existingCategory = await (0, categories_service_1.getCategoryById)(req.userId, id);
    if (!existingCategory)
        return res.status(404).json({ error: "Category not found" });
    // Check if category is being used in transactions
    const isCategoryInUse = await (0, categories_service_1.isCategoryUsedInTransactions)(id);
    if (isCategoryInUse) {
        (0, response_1.errorResponse)(res, "Kategori tidak dapat dihapus karena masih digunakan dalam transaksi", 409);
    }
    await (0, categories_service_1.softDeleteCategory)(req.userId, id);
    (0, response_1.successResponse)(res, null, "Category deleted", 200);
}
async function getDeletedCategories(req, res) {
    const items = await (0, categories_service_1.listDeletedCategories)(req.userId);
    (0, response_1.successResponse)(res, items);
}
async function restoreCategoryController(req, res) {
    const { id } = req.params;
    const deletedCategory = await (0, categories_service_1.getDeletedCategoryById)(req.userId, id);
    if (!deletedCategory)
        return res.status(404).json({ error: "Deleted category not found" });
    // Check if there's already a category with the same name and type
    const existingCategory = await (0, categories_service_1.getCategoryByNameAndType)(req.userId, deletedCategory.name, deletedCategory.type);
    if (existingCategory) {
        (0, response_1.errorResponse)(res, "Kategori dengan nama dan tipe yang sama sudah ada", 409);
    }
    const item = await (0, categories_service_1.restoreCategory)(req.userId, id);
    (0, response_1.successResponse)(res, item, "Category restored", 200);
}
