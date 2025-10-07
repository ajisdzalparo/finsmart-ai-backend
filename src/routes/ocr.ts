import { Router } from "express";
import { OCRController } from "../controllers/ocr.controller";
import { requireAuth } from "../middleware/auth";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and text files
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "text/plain"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported. Please upload JPG, PNG, or TXT files."));
    }
  },
});

// OCR routes
router.post("/ocr-extract", requireAuth, upload.single("file"), OCRController.extractTransactions);
router.post("/ocr-validate", requireAuth, OCRController.validateTransaction);

export default router;
