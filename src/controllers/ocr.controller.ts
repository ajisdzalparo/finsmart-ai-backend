import { Request, Response } from "express";
import { successResponse, errorResponse } from "../utils/response";
import { requireAuth } from "../middleware/auth";
import { OCRService } from "../services/ocr.service";
import { AITransactionParserService } from "../services/ai.transaction.parser.service";

export class OCRController {
  static async extractTransactions(req: any, res: Response) {
    try {
      if (!req.file) {
        return errorResponse(res, "No file uploaded", 400);
      }

      const userId = req.userId;
      const file = req.file;

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "text/plain"];
      if (!allowedTypes.includes(file.mimetype)) {
        return errorResponse(res, "File type not supported. Please upload JPG, PNG, or TXT files.", 400);
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return errorResponse(res, "File size too large. Maximum size is 10MB.", 400);
      }

      let extractedText = "";

      if (file.mimetype.startsWith("image/")) {
        // Extract text from image using OCR
        extractedText = await OCRService.extractTextFromImage(file.buffer);
      } else if (file.mimetype === "text/plain") {
        // Read text from file using OCR service method
        extractedText = await OCRService.extractTextFromTextFile(file.buffer);
      }

      if (!extractedText.trim()) {
        return errorResponse(res, "No text found in the uploaded file", 400);
      }

      // Parse transactions using AI
      const parseResult = await AITransactionParserService.parseTransactions(extractedText, userId);

      return successResponse(
        res,
        {
          transactions: parseResult.transactions,
          receiptTotal: parseResult.receiptTotal,
          receiptDate: parseResult.receiptDate,
          rawText: extractedText,
          fileInfo: {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
          },
        },
        "Transactions extracted successfully"
      );
    } catch (error) {
      console.error("OCR extraction error:", error);
      return errorResponse(res, "Failed to extract transactions from file", 500);
    }
  }

  static async validateTransaction(req: any, res: Response) {
    try {
      const { text, userId } = req.body;

      if (!text || !userId) {
        return errorResponse(res, "Text and userId are required", 400);
      }

      const parseResult = await AITransactionParserService.parseTransactions(text, userId);

      return successResponse(
        res,
        {
          transactions: parseResult.transactions,
          receiptTotal: parseResult.receiptTotal,
          receiptDate: parseResult.receiptDate,
          rawText: text,
        },
        "Transactions validated successfully"
      );
    } catch (error) {
      console.error("Transaction validation error:", error);
      return errorResponse(res, "Failed to validate transactions", 500);
    }
  }
}
