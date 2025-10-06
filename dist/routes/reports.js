"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reports_controller_1 = require("../controllers/reports.controller");
const router = (0, express_1.Router)();
router.post("/", auth_1.requireAuth, async (req, res) => (0, reports_controller_1.postReport)(req, res));
exports.default = router;
