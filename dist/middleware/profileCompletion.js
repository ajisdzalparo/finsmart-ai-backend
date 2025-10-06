"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireProfileCompletion = requireProfileCompletion;
exports.checkProfileCompletion = checkProfileCompletion;
const auth_service_1 = require("../services/auth.service");
async function requireProfileCompletion(req, res, next) {
    try {
        const user = await (0, auth_service_1.getUserById)(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (!user.profileCompleted) {
            return res.status(200).json({
                requiresProfileCompletion: true,
                message: "Please complete your profile to continue",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    interests: user.interests,
                    incomeRange: user.incomeRange,
                    expenseCategories: user.expenseCategories,
                },
            });
        }
        next();
    }
    catch (error) {
        console.error("Error in requireProfileCompletion middleware:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function checkProfileCompletion(req, res, next) {
    try {
        const user = await (0, auth_service_1.getUserById)(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        req.user = {
            ...req.user,
            profileCompleted: user.profileCompleted,
            interests: user.interests,
            incomeRange: user.incomeRange,
            expenseCategories: user.expenseCategories,
        };
        next();
    }
    catch (error) {
        console.error("Error in checkProfileCompletion middleware:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
