"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const activity_controller_1 = require("../controllers/activity.controller");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, async (req, res) => (0, activity_controller_1.getActivity)(req, res));
exports.default = router;
