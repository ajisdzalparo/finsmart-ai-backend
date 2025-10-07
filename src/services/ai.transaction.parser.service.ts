import { DeepseekAIService } from "./ai.service.deepseek";
import { GeminiAIService } from "./ai.service.gemini";
import { prisma } from "../utils/database";

interface ParsedTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  confidence: number;
  rawText: string;
}

interface ParsedResult {
  transactions: ParsedTransaction[];
  receiptTotal?: number;
  receiptDate?: string;
}

export class AITransactionParserService {
  static async parseTransactions(text: string, userId: string): Promise<ParsedResult> {
    try {
      console.log("🤖 Starting AI transaction parsing...");

      // Get user's categories for better parsing
      const categories = await prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, type: true },
      });

      // Try DeepSeek first, fallback to Gemini
      let parsedResult: ParsedResult = { transactions: [] };

      try {
        parsedResult = await this.parseWithDeepSeek(text, categories);
      } catch (error) {
        console.warn("DeepSeek parsing failed, trying Gemini:", error);
        parsedResult = await this.parseWithGemini(text, categories);
      }

      // If AI parsing fails, try rule-based parsing
      if (parsedResult.transactions.length === 0) {
        console.log("🔄 AI parsing failed, trying rule-based parsing...");
        const ruleBasedResult = this.parseWithRules(text, categories);
        parsedResult = ruleBasedResult;
      }

      console.log(`✅ Parsed ${parsedResult.transactions.length} transactions`);
      return parsedResult;
    } catch (error) {
      console.error("❌ Transaction parsing error:", error);
      return { transactions: [] };
    }
  }

  private static async parseWithDeepSeek(text: string, categories: any[]): Promise<ParsedResult> {
    // For now, skip AI parsing and use rule-based parsing
    // This can be enhanced later when AI services are properly configured
    console.log("🤖 DeepSeek parsing temporarily disabled, using rule-based parsing");
    const result = this.parseWithRules(text, categories);
    return result;
  }

  private static async parseWithGemini(text: string, categories: any[]): Promise<ParsedResult> {
    // For now, skip AI parsing and use rule-based parsing
    // This can be enhanced later when AI services are properly configured
    console.log("🤖 Gemini parsing temporarily disabled, using rule-based parsing");
    const result = this.parseWithRules(text, categories);
    return result;
  }

  private static parseWithRules(text: string, categories: any[]): ParsedResult {
    console.log("📋 Using rule-based parsing...");

    const transactions: ParsedTransaction[] = [];
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Find date in the text
    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g;
    let currentDate = new Date().toISOString().split("T")[0];

    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      try {
        const dateStr = dateMatch[0].replace(/[\/\-\.]/g, "/");
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          currentDate = parsedDate.toISOString().split("T")[0];
        }
      } catch (error) {
        // Use current date if parsing fails
      }
    }

    // Look for item lines that contain product names and prices
    // Multiple patterns to catch different receipt formats
    const patterns = [
      // Pattern 1: Indomaret format - Product name, quantity, unit price, total price
      /^(.+?)\s+(\d+)\s+(\d{1,3}(?:[.,]\d{3})*)\s+(\d{1,3}(?:[.,]\d{3})*)$/gm,
      // Pattern 2: Product name followed by price (simpler format)
      /^(.+?)\s+(\d{1,3}(?:[.,]\d{3})*)$/gm,
      // Pattern 3: Product name with price at the end
      /^(.+?)\s+(\d{1,3}(?:[.,]\d{3})*)\s*$/gm,
      // Pattern 4: More flexible pattern for product names with spaces
      /^([A-Za-z0-9\s\.\-]+?)\s+(\d{1,3}(?:[.,]\d{3})*)\s*$/gm,
    ];

    let allMatches: any[] = [];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      allMatches = allMatches.concat(matches);
    }

    // Remove duplicates based on the matched text
    const uniqueMatches = allMatches.filter((match, index, self) => index === self.findIndex((m) => m[0] === match[0]));

    console.log(`🔍 Found ${uniqueMatches.length} unique potential item lines`);

    for (const match of uniqueMatches) {
      let productName = "";
      let totalPrice = 0;

      if (match.length === 5) {
        // Pattern 1: Product name, quantity, unit price, total price
        productName = match[1].trim();
        const totalPriceStr = match[4].replace(/[.,]/g, "");
        totalPrice = parseInt(totalPriceStr);
      } else if (match.length === 3) {
        // Pattern 2 & 3: Product name, price
        productName = match[1].trim();
        const priceStr = match[2].replace(/[.,]/g, "");
        totalPrice = parseInt(priceStr);
      }

      // Skip if this looks like a header or summary line
      if (this.isHeaderOrSummaryLine(productName)) {
        continue;
      }

      // Skip if product name is too short or contains only numbers
      if (productName.length < 3 || /^\d+$/.test(productName)) {
        continue;
      }

      // Only process if total price is reasonable (between 1,000 and 1,000,000)
      if (totalPrice >= 1000 && totalPrice <= 1000000) {
        const transaction: ParsedTransaction = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description: productName,
          amount: totalPrice,
          date: currentDate,
          confidence: 0.85, // High confidence for structured receipt data
          rawText: match[0],
        };

        // Try to match category based on product name
        const matchedCategory = this.findMatchingCategory(productName, categories);
        if (matchedCategory) {
          transaction.category = matchedCategory.id;
        }

        transactions.push(transaction);
        console.log(`✅ Parsed item: ${productName} - Rp ${totalPrice.toLocaleString()}`);
      }
    }

    // Extract receipt total and discount information
    const receiptInfo = this.extractReceiptTotals(text);

    // If no structured items found, try to find total amount for single transaction
    if (transactions.length === 0) {
      const totalAmount = receiptInfo.netTotal || receiptInfo.grossTotal;

      if (totalAmount && totalAmount >= 1000 && totalAmount <= 10000000) {
        const transaction: ParsedTransaction = {
          id: `total_${Date.now()}`,
          description: "Pembelian di Toko",
          amount: totalAmount,
          date: currentDate,
          confidence: 0.7,
          rawText: `Total: ${totalAmount}`,
        };

        // Try to match category
        const matchedCategory = this.findMatchingCategory("pembelian", categories);
        if (matchedCategory) {
          transaction.category = matchedCategory.id;
        }

        transactions.push(transaction);
        console.log(`✅ Parsed total: Rp ${totalAmount.toLocaleString()}`);
      }
    }

    console.log(`📊 Total transactions parsed: ${transactions.length}`);

    // Return result with receipt information
    return {
      transactions,
      receiptTotal: receiptInfo.netTotal,
      receiptDate: currentDate,
    };
  }

  private static isHeaderOrSummaryLine(text: string): boolean {
    const headerKeywords = [
      "indomaret",
      "alfamart",
      "tokopedia",
      "shopee",
      "lazada",
      "total",
      "jumlah",
      "harga jual",
      "voucher",
      "diskon",
      "tunai",
      "kembali",
      "ppn",
      "dpp",
      "terima kasih",
      "layanan konsumen",
      "sms",
      "call",
      "email",
      "npwp",
      "alamat",
      "telp",
      "fax",
      "website",
      "tanggal",
      "jam",
    ];

    const lowerText = text.toLowerCase();
    return headerKeywords.some((keyword) => lowerText.includes(keyword));
  }

  private static findMatchingCategory(productName: string, categories: any[]): any {
    const lowerProductName = productName.toLowerCase();

    // Food and beverage keywords
    const foodKeywords = ["indomi", "sedap", "mie", "nasi", "goreng", "soto", "kari", "ayam", "bawang", "rica", "baso"];
    const beverageKeywords = ["teh", "kopi", "susu", "jus", "air", "minuman"];
    const householdKeywords = ["rins", "detergen", "sabun", "shampo", "pasta gigi", "tissue"];

    if (foodKeywords.some((keyword) => lowerProductName.includes(keyword))) {
      return categories.find((cat) => cat.name.toLowerCase().includes("makanan") || cat.name.toLowerCase().includes("food"));
    }

    if (beverageKeywords.some((keyword) => lowerProductName.includes(keyword))) {
      return categories.find((cat) => cat.name.toLowerCase().includes("minuman") || cat.name.toLowerCase().includes("beverage"));
    }

    if (householdKeywords.some((keyword) => lowerProductName.includes(keyword))) {
      return categories.find((cat) => cat.name.toLowerCase().includes("rumah tangga") || cat.name.toLowerCase().includes("household"));
    }

    // Default to first expense category
    return categories.find((cat) => cat.type === "expense");
  }

  private static extractReceiptTotals(text: string): {
    grossTotal?: number;
    discount?: number;
    netTotal?: number;
  } {
    const result: { grossTotal?: number; discount?: number; netTotal?: number } = {};

    // Pattern untuk harga jual (gross total)
    const grossPatterns = [/harga\s+jual\s*:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi, /gross\s*:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi, /subtotal\s*:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi];

    for (const pattern of grossPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.grossTotal = parseInt(match[0].replace(/[^\d]/g, ""));
        break;
      }
    }

    // Pattern untuk diskon
    const discountPatterns = [/voucher[^:]*:?\s*\(?(\d{1,3}(?:[.,]\d{3})*)\)?/gi, /diskon[^:]*:?\s*\(?(\d{1,3}(?:[.,]\d{3})*)\)?/gi, /discount[^:]*:?\s*\(?(\d{1,3}(?:[.,]\d{3})*)\)?/gi, /anda\s+hemat[^:]*:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi];

    for (const pattern of discountPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.discount = parseInt(match[0].replace(/[^\d]/g, ""));
        break;
      }
    }

    // Pattern untuk total akhir (net total)
    const netPatterns = [/total\s*:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi, /jumlah\s*:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi, /net\s*:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi];

    for (const pattern of netPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.netTotal = parseInt(match[0].replace(/[^\d]/g, ""));
        break;
      }
    }

    // Jika tidak ada net total tapi ada gross total dan diskon, hitung manual
    if (!result.netTotal && result.grossTotal && result.discount) {
      result.netTotal = result.grossTotal - result.discount;
    }

    console.log("📊 Receipt totals extracted:", result);
    return result;
  }
}
