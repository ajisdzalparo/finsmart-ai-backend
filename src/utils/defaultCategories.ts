import { prisma } from '../utils/database';

const defaultCategories = [
  // Income Categories
  { name: 'Gaji', type: 'income', color: '#22c55e', icon: '💰' },
  { name: 'Freelance', type: 'income', color: '#3b82f6', icon: '💻' },
  { name: 'Investasi', type: 'income', color: '#8b5cf6', icon: '📈' },
  { name: 'Bonus', type: 'income', color: '#f59e0b', icon: '🎁' },
  
  // Expense Categories
  { name: 'Makanan', type: 'expense', color: '#ef4444', icon: '🍔' },
  { name: 'Transportasi', type: 'expense', color: '#06b6d4', icon: '🚗' },
  { name: 'Belanja', type: 'expense', color: '#ec4899', icon: '🛒' },
  { name: 'Hiburan', type: 'expense', color: '#10b981', icon: '🎬' },
  { name: 'Kesehatan', type: 'expense', color: '#f97316', icon: '🏥' },
  { name: 'Pendidikan', type: 'expense', color: '#6366f1', icon: '📚' },
  { name: 'Tagihan', type: 'expense', color: '#84cc16', icon: '⚡' },
  { name: 'Fashion', type: 'expense', color: '#f43f5e', icon: '👕' },
  
  // Transfer Categories
  { name: 'Tabungan', type: 'transfer', color: '#64748b', icon: '🏦' },
  { name: 'Investasi', type: 'transfer', color: '#7c3aed', icon: '📊' },
];

export async function createDefaultCategories(userId: string) {
  try {
    // Check if user already has categories
    const existingCategories = await prisma.category.findMany({
      where: { userId },
    });

    if (existingCategories.length > 0) {
      console.log('User already has categories, skipping default creation');
      return;
    }

    // Create default categories for the user
    const categories = await prisma.category.createMany({
      data: defaultCategories.map(category => ({
        ...category,
        userId,
      })),
    });

    console.log(`Created ${categories.count} default categories for user ${userId}`);
    return categories;
  } catch (error) {
    console.error('Error creating default categories:', error);
    throw error;
  }
}
