"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const recommendations_controller_1 = require("../controllers/recommendations.controller");
const router = (0, express_1.Router)();
// Generate simple heuristic recommendations from last 30 days of expenses
router.get("/", auth_1.requireAuth, async (req, res) => (0, recommendations_controller_1.getRecommendations)(req, res));
exports.default = router;
