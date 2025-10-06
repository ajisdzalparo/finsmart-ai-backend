"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const insights_controller_1 = require("../controllers/insights.controller");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, async (req, res) => (0, insights_controller_1.getInsights)(req, res));
router.post("/", auth_1.requireAuth, async (req, res) => (0, insights_controller_1.postInsight)(req, res));
exports.default = router;
