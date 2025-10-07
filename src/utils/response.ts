import { Response } from "express";

export function successResponse(res: Response, data: any, message = "Success", statusCode = 200, pagination: any = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: pagination ?? null,
  });
}

export function errorResponse(res: Response, message = "Error", statusCode = 500, error?: any, pagination: any = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
    pagination: pagination ?? null,
  });
}
