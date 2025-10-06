"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const templates_controller_1 = require("../controllers/templates.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => (0, templates_controller_1.getTemplates)(req, res));
router.post('/', auth_1.requireAuth, async (req, res) => (0, templates_controller_1.postTemplate)(req, res));
exports.default = router;
