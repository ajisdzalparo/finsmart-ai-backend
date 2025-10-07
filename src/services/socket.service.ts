import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { DeepseekAIService } from "./ai.service.deepseek";
import { GeminiAIService } from "./ai.service.gemini";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface AIRequest {
  type: "insights" | "recommendations" | "dashboard" | "overspend" | "goals" | "anomaly" | "subscriptions";
  model?: "deepseek" | "gemini";
  userId: string;
}

interface AIResponse {
  type: "insights" | "recommendations" | "dashboard" | "overspend" | "goals" | "anomaly" | "subscriptions";
  data: any[];
  status: "success" | "error";
  message?: string;
  model?: string;
}

export function setupSocketHandlers(io: Server) {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`🔌 User ${socket.userId} connected via Socket.IO`);

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Handle AI requests
    socket.on("ai:request", async (request: AIRequest) => {
      console.log(`🤖 AI request from user ${socket.userId}:`, request.type);

      try {
        if (!socket.userId) {
          throw new Error("User not authenticated");
        }

        const model = request.model || "deepseek";
        const useGemini = model === "gemini";

        let data: any[] = [];
        let aiModel = "";

        // Emit progress update
        socket.emit("ai:progress", {
          type: request.type,
          status: "processing",
          message: `Menggunakan ${useGemini ? "Gemini" : "DeepSeek"} AI...`,
          model: useGemini ? "gemini" : "deepseek",
        });

        switch (request.type) {
          case "insights":
          case "goals":
          case "anomaly":
            data = useGemini ? await GeminiAIService.previewFinancialInsights(socket.userId) : await DeepseekAIService.previewFinancialInsights(socket.userId);
            aiModel = useGemini ? "gemini" : "deepseek";
            break;

          case "recommendations":
          case "overspend":
            data = useGemini ? await GeminiAIService.previewRecommendations(socket.userId) : await DeepseekAIService.previewRecommendations(socket.userId);
            aiModel = useGemini ? "gemini" : "deepseek";
            break;

          case "dashboard":
          case "subscriptions":
            // For dashboard, we'll use the existing API structure
            const insights = await DeepseekAIService.previewFinancialInsights(socket.userId);
            const recommendations = await DeepseekAIService.previewRecommendations(socket.userId);
            data = [
              {
                insights,
                recommendations,
                statistics: {
                  totalInsights: insights.length,
                  totalRecommendations: recommendations.length,
                  unreadRecommendations: recommendations.length,
                },
              },
            ];
            aiModel = "deepseek";
            break;

          default:
            throw new Error(`Unknown AI request type: ${request.type}`);
        }

        // Emit success response
        const response: AIResponse = {
          type: request.type,
          data,
          status: "success",
          message: `Berhasil mendapatkan ${request.type} dari ${useGemini ? "Gemini" : "DeepSeek"} AI`,
          model: aiModel,
        };

        socket.emit("ai:response", response);
        console.log(`✅ AI response sent to user ${socket.userId}:`, response.type, `(${data.length} items)`);
      } catch (error: any) {
        console.error(`❌ AI request error for user ${socket.userId}:`, error.message);

        const errorResponse: AIResponse = {
          type: request.type,
          data: [],
          status: "error",
          message: error.message || "Terjadi kesalahan saat memproses permintaan AI",
        };

        socket.emit("ai:response", errorResponse);
      }
    });

    // Handle AI model switching
    socket.on("ai:switch-model", (model: "deepseek" | "gemini") => {
      console.log(`🔄 User ${socket.userId} switching to ${model} model`);
      socket.emit("ai:model-switched", { model });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 User ${socket.userId} disconnected from Socket.IO`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`❌ Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log("🔌 Socket.IO handlers setup complete");
}
