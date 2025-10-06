"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const goals_controller_1 = require("../controllers/goals.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => (0, goals_controller_1.getGoals)(req, res));
router.post('/', auth_1.requireAuth, async (req, res) => (0, goals_controller_1.postGoal)(req, res));
exports.default = router;
