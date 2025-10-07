"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(res, data, message = "Success", statusCode = 200, pagination = null) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination: pagination ?? null,
    });
}
function errorResponse(res, message = "Error", statusCode = 500, error, pagination = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        error,
        pagination: pagination ?? null,
    });
}
