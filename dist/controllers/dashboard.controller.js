"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
const dashboard_service_1 = require("../services/dashboard.service");
const response_1 = require("../utils/response");
async function getDashboard(req, res) {
    try {
        const userId = req.userId;
        const data = await (0, dashboard_service_1.getDashboardData)(userId);
        return (0, response_1.successResponse)(res, data, "Success", 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, "Error getting dashboard data", 500, error);
    }
}
