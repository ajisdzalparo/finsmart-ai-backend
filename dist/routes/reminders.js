"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reminders_controller_1 = require("../controllers/reminders.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => (0, reminders_controller_1.getReminders)(req, res));
router.post('/', auth_1.requireAuth, async (req, res) => (0, reminders_controller_1.postReminder)(req, res));
exports.default = router;
