import { PrismaClient } from '@prisma/client';
import { createDefaultCategories } from '../src/utils/defaultCategories';

const prisma = new PrismaClient();

async function addDefaultCategoriesForExistingUsers() {
  try {
    console.log('Starting to add default categories for existing users...');
    
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

    console.log(`Found ${users.length} users`);

    for (const user of users) {
      if (user.categories.length === 0) {
        console.log(`Adding default categories for user: ${user.email}`);
        try {
          await createDefaultCategories(user.id);
          console.log(`✅ Successfully added default categories for user: ${user.email}`);
        } catch (error) {
          console.error(`❌ Failed to add default categories for user ${user.email}:`, error);
        }
      } else {
        console.log(`User ${user.email} already has ${user.categories.length} categories, skipping...`);
      }
    }

    console.log('Finished adding default categories for existing users');
  } catch (error) {
    console.error('Error in addDefaultCategoriesForExistingUsers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaultCategoriesForExistingUsers();
