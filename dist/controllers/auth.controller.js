"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
exports.completeProfile = completeProfile;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const defaultCategories_1 = require("../utils/defaultCategories");
const authSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string(),
});
const profileCompletionSchema = zod_1.z.object({
    interests: zod_1.z.array(zod_1.z.string()).min(1, "Please select at least one interest"),
    incomeRange: zod_1.z.string().min(1, "Please select your income range"),
    expenseCategories: zod_1.z.array(zod_1.z.string()).min(1, "Please select at least one expense category"),
});
async function register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.successResponse)(res, { error: parsed.error.format() }, "Registration failed", 400);
    const { email, password, name } = parsed.data;
    const existing = await (0, auth_service_1.getUserByEmail)(email);
    if (existing)
        return (0, response_1.errorResponse)(res, "User already exists", 400);
    const user = await (0, auth_service_1.createUser)(email, password, name);
    // Create default categories for new user
    try {
        await (0, defaultCategories_1.createDefaultCategories)(user.id);
    }
    catch (error) {
        console.error("Error creating default categories:", error);
        // Don't fail registration if categories creation fails
    }
    return (0, response_1.successResponse)(res, { name: user.name, email: user.email }, "Registration successful", 201);
}
async function login(req, res) {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.successResponse)(res, { error: parsed.error.format() }, "Registration failed", 400);
    const { email, password } = parsed.data;
    const user = await (0, auth_service_1.getUserByEmail)(email);
    if (!user)
        return (0, response_1.errorResponse)(res, "User not found", 404);
    const ok = await (0, auth_service_1.verifyPassword)(password, user.passwordHash);
    if (!ok)
        return (0, response_1.errorResponse)(res, "User not found", 404);
    const token = (0, auth_service_1.createJwtToken)(user.id);
    return (0, response_1.successResponse)(res, { name: user.name, email: user.email, token }, "Login successful", 200);
}
async function me(req, res) {
    const user = await (0, auth_service_1.getUserById)(req.userId);
    if (!user)
        return (0, response_1.errorResponse)(res, "User not found", 404);
    return (0, response_1.successResponse)(res, {
        name: user.name,
        email: user.email,
        profileCompleted: user.profileCompleted,
        interests: user.interests,
        incomeRange: user.incomeRange,
        expenseCategories: user.expenseCategories,
    }, "User details", 200);
}
async function completeProfile(req, res) {
    const parsed = profileCompletionSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.successResponse)(res, { error: parsed.error.format() }, "Profile completion failed", 400);
    const { interests, incomeRange, expenseCategories } = parsed.data;
    try {
        const updatedUser = await (0, auth_service_1.updateUserProfile)(req.userId, {
            interests,
            incomeRange,
            expenseCategories,
            profileCompleted: true,
        });
        // Create default categories if user doesn't have any
        try {
            await (0, defaultCategories_1.createDefaultCategories)(req.userId);
        }
        catch (error) {
            console.error("Error creating default categories:", error);
            // Don't fail profile completion if categories creation fails
        }
        return (0, response_1.successResponse)(res, {
            name: updatedUser.name,
            email: updatedUser.email,
            profileCompleted: updatedUser.profileCompleted,
            interests: updatedUser.interests,
            incomeRange: updatedUser.incomeRange,
            expenseCategories: updatedUser.expenseCategories,
        }, "Profile completed successfully", 200);
    }
    catch (error) {
        console.error("Error completing profile:", error);
        return (0, response_1.errorResponse)(res, "Failed to complete profile", 500);
    }
}
