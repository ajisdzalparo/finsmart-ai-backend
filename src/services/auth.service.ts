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

export async function updateUserName(userId: string, name: string) {
  return prisma.user.update({ where: { id: userId }, data: { name } });
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const ok = await verifyPassword(currentPassword, (user as any).passwordHash);
  if (!ok) throw new Error("Invalid current password");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return true;
}
