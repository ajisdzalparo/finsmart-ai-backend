import { Response } from "express";

export function successResponse(res: Response, data: any, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res: Response, message = "Error", statusCode = 500, error?: any) {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
}
