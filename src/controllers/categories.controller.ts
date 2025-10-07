import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import {
  CategoryInput,
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getCategoryByNameAndType,
  isCategoryUsedInTransactions,
  softDeleteCategory,
  listDeletedCategories,
  restoreCategory,
  getDeletedCategoryById,
} from "../services/categories.service";
import { errorResponse, successResponse } from "../utils/response";

const schema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi").max(50, "Nama kategori maksimal 50 karakter"),
  type: z.enum(["income", "expense", "transfer"], {
    message: "Tipe kategori harus berupa income, expense, atau transfer",
  }),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus berupa hex color (#RRGGBB)")
    .optional(),
  icon: z.string().max(50, "Nama icon maksimal 50 karakter").optional(),
});

const updateSchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi").max(50, "Nama kategori maksimal 50 karakter").optional(),
  type: z
    .enum(["income", "expense", "transfer"], {
      message: "Tipe kategori harus berupa income, expense, atau transfer",
    })
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus berupa hex color (#RRGGBB)")
    .optional(),
  icon: z.string().max(50, "Nama icon maksimal 50 karakter").optional(),
});

export async function getCategories(req: AuthRequest, res: Response) {
  const items = await listCategories(req.userId);
  successResponse(res, items);
}

export async function getCategory(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const item = await getCategoryById(req.userId, id);
  if (!item) return res.status(404).json({ error: "Category not found" });
  successResponse(res, item);
}

export async function postCategory(req: AuthRequest, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  // Check for duplicate category name
  const existingCategory = await getCategoryByNameAndType(req.userId, parsed.data.name, parsed.data.type);
  if (existingCategory) {
    return errorResponse(res, "Kategori dengan nama dan tipe yang sama sudah ada", 409);
  }

  const item = await createCategory(req.userId, parsed.data as CategoryInput);
  successResponse(res, item, "Category created", 201);
}

export async function putCategory(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const existingCategory = await getCategoryById(req.userId, id);
  if (!existingCategory) return res.status(404).json({ error: "Category not found" });

  // Check for duplicate category name if name is being updated
  if (parsed.data.name) {
    // Use existing category type if type is not being updated
    const categoryType = parsed.data.type || existingCategory.type;
    const duplicateCategory = await getCategoryByNameAndType(req.userId, parsed.data.name, categoryType, id);
    if (duplicateCategory) {
      errorResponse(res, "Kategori dengan nama dan tipe yang sama sudah ada", 409);
    }
  }

  const item = await updateCategory(req.userId, id, parsed.data);
  successResponse(res, item);
}

export async function deleteCategoryController(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const existingCategory = await getCategoryById(req.userId, id);
  if (!existingCategory) return res.status(404).json({ error: "Category not found" });

  // Check if category is being used in transactions
  const isCategoryInUse = await isCategoryUsedInTransactions(id);
  if (isCategoryInUse) {
    errorResponse(res, "Kategori tidak dapat dihapus karena masih digunakan dalam transaksi", 409);
  }

  await softDeleteCategory(req.userId, id);
  successResponse(res, null, "Category deleted", 200);
}

export async function getDeletedCategories(req: AuthRequest, res: Response) {
  const items = await listDeletedCategories(req.userId);
  successResponse(res, items);
}

export async function restoreCategoryController(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const deletedCategory = await getDeletedCategoryById(req.userId, id);
  if (!deletedCategory) return res.status(404).json({ error: "Deleted category not found" });

  // Check if there's already a category with the same name and type
  const existingCategory = await getCategoryByNameAndType(req.userId, deletedCategory.name, deletedCategory.type);
  if (existingCategory) {
    errorResponse(res, "Kategori dengan nama dan tipe yang sama sudah ada", 409);
  }

  const item = await restoreCategory(req.userId, id);
  successResponse(res, item, "Category restored", 200);
}
