"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => (0, dashboard_controller_1.getDashboard)(req, res));
exports.default = router;
