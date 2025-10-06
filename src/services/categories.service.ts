import { prisma } from "../utils/database";

export type CategoryInput = {
  name: string;
  type: string;
  color?: string;
  icon?: string;
};

export function listCategories(userId: string | undefined) {
  return prisma.category.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function createCategory(userId: string | undefined, input: CategoryInput) {
  return prisma.category.create({ data: { ...input, userId: userId! } });
}

export function updateCategory(userId: string | undefined, categoryId: string, input: Partial<CategoryInput>) {
  return prisma.category.update({
    where: {
      id: categoryId,
      userId: userId!,
    },
    data: input,
  });
}

export function deleteCategory(userId: string | undefined, categoryId: string) {
  return prisma.category.delete({
    where: {
      id: categoryId,
      userId: userId!,
    },
  });
}

export function getCategoryById(userId: string | undefined, categoryId: string) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: userId!,
      isDeleted: false,
    },
  });
}

export function getCategoryByNameAndType(userId: string | undefined, name: string, type: string, excludeId?: string) {
  return prisma.category.findFirst({
    where: {
      name,
      type,
      userId: userId!,
      isDeleted: false,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
}

export function isCategoryUsedInTransactions(categoryId: string) {
  return prisma.transaction
    .findFirst({
      where: {
        categoryId,
      },
    })
    .then((transaction) => !!transaction);
}

export function softDeleteCategory(userId: string | undefined, categoryId: string) {
  return prisma.category.update({
    where: {
      id: categoryId,
      userId: userId!,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

export function listDeletedCategories(userId: string | undefined) {
  return prisma.category.findMany({
    where: {
      userId,
      isDeleted: true,
    },
    orderBy: { deletedAt: "desc" },
  });
}

export function getDeletedCategoryById(userId: string | undefined, categoryId: string) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: userId!,
      isDeleted: true,
    },
  });
}

export function restoreCategory(userId: string | undefined, categoryId: string) {
  return prisma.category.update({
    where: {
      id: categoryId,
      userId: userId!,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}
