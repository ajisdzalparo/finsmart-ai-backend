import { Request, Response } from "express";
import { z } from "zod";
import { createJwtToken, createUser, getUserByEmail, getUserById, verifyJwtToken, verifyPassword, updateUserProfile } from "../services/auth.service";
import { AuthRequest } from "../middleware/auth";
import { successResponse, errorResponse } from "../utils/response";
import { createDefaultCategories } from "../utils/defaultCategories";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
});

const profileCompletionSchema = z.object({
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
  incomeRange: z.string().min(1, "Please select your income range"),
  expenseCategories: z.array(z.string()).min(1, "Please select at least one expense category"),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return successResponse(res, { error: parsed.error.format() }, "Registration failed", 400);
  const { email, password, name } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) return errorResponse(res, "User already exists", 400);

  const user = await createUser(email, password, name);
  
  // Create default categories for new user
  try {
    await createDefaultCategories(user.id);
  } catch (error) {
    console.error("Error creating default categories:", error);
    // Don't fail registration if categories creation fails
  }
  
  return successResponse(res, { name: user.name, email: user.email }, "Registration successful", 201);
}

export async function login(req: Request, res: Response) {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) return successResponse(res, { error: parsed.error.format() }, "Registration failed", 400);
  const { email, password } = parsed.data;

  const user = await getUserByEmail(email);
  if (!user) return errorResponse(res, "User not found", 404);

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return errorResponse(res, "User not found", 404);

  const token = createJwtToken(user.id);
  return successResponse(res, { name: user.name, email: user.email, token }, "Login successful", 200);
}

export async function me(req: AuthRequest, res: Response) {
  const user = await getUserById(req.userId);
  if (!user) return errorResponse(res, "User not found", 404);

  return successResponse(
    res,
    {
      name: user.name,
      email: user.email,
      profileCompleted: user.profileCompleted,
      interests: user.interests,
      incomeRange: user.incomeRange,
      expenseCategories: user.expenseCategories,
    },
    "User details",
    200
  );
}

export async function completeProfile(req: AuthRequest, res: Response) {
  const parsed = profileCompletionSchema.safeParse(req.body);
  if (!parsed.success) return successResponse(res, { error: parsed.error.format() }, "Profile completion failed", 400);

  const { interests, incomeRange, expenseCategories } = parsed.data;

  try {
    const updatedUser = await updateUserProfile(req.userId, {
      interests,
      incomeRange,
      expenseCategories,
      profileCompleted: true,
    });

    // Create default categories if user doesn't have any
    try {
      await createDefaultCategories(req.userId);
    } catch (error) {
      console.error("Error creating default categories:", error);
      // Don't fail profile completion if categories creation fails
    }

    return successResponse(
      res,
      {
        name: updatedUser.name,
        email: updatedUser.email,
        profileCompleted: updatedUser.profileCompleted,
        interests: updatedUser.interests,
        incomeRange: updatedUser.incomeRange,
        expenseCategories: updatedUser.expenseCategories,
      },
      "Profile completed successfully",
      200
    );
  } catch (error) {
    console.error("Error completing profile:", error);
    return errorResponse(res, "Failed to complete profile", 500);
  }
}
