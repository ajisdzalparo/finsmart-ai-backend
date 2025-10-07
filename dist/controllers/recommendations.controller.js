"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = getRecommendations;
const recommendations_service_1 = require("../services/recommendations.service");
const response_1 = require("../utils/response");
async function getRecommendations(req, res) {
    try {
        const userId = req.userId;
        const data = await (0, recommendations_service_1.buildRecommendations)(userId);
        return (0, response_1.successResponse)(res, data, "Recommendations retrieved successfully", 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, "Error getting recommendations", 500, error);
    }
}
