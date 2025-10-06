import { prisma } from "../utils/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createDefaultCategories } from "../utils/defaultCategories";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function createUser(email: string, password: string, name: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { email, passwordHash, name } });
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createJwtToken(userId: string): string {
  const secret = process.env.JWT_SECRET || "";
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

export function verifyJwtToken(token: string) {
  const secret = process.env.JWT_SECRET || "";
  try {
    const payload = jwt.verify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: {
    interests?: string[];
    incomeRange?: string;
    expenseCategories?: string[];
    profileCompleted?: boolean;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data: profileData,
  });
}
