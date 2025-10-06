"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = getRecommendations;
const recommendations_service_1 = require("../services/recommendations.service");
async function getRecommendations(req, res) {
    const userId = req.userId;
    const data = await (0, recommendations_service_1.buildRecommendations)(userId);
    res.json(data);
}
