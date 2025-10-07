import { PrismaClient } from "@prisma/client";
import { createDefaultCategories } from "../src/utils/defaultCategories";

const prisma = new PrismaClient();

async function addDefaultCategoriesForExistingUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        categories: {
          select: {
            id: true,
          },
        },
      },
    });

    for (const user of users) {
      if (user.categories.length === 0) {
        try {
          await createDefaultCategories(user.id);
        } catch (error) {
          console.error(`❌ Failed to add default categories for user ${user.email}:`, error);
        }
      } else {
        console.log(`User ${user.email} already has ${user.categories.length} categories, skipping...`);
      }
    }
  } catch (error) {
    console.error("Error in addDefaultCategoriesForExistingUsers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaultCategoriesForExistingUsers();
