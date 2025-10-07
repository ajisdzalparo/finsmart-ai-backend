"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const auth_1 = __importDefault(require("./routes/auth"));
const profiles_1 = __importDefault(require("./routes/profiles"));
const trajectories_1 = __importDefault(require("./routes/trajectories"));
const insights_1 = __importDefault(require("./routes/insights"));
const recommendations_1 = __importDefault(require("./routes/recommendations"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const categories_1 = __importDefault(require("./routes/categories"));
const templates_1 = __importDefault(require("./routes/templates"));
const goals_1 = __importDefault(require("./routes/goals"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const reports_1 = __importDefault(require("./routes/reports"));
const activity_1 = __importDefault(require("./routes/activity"));
const ai_1 = __importDefault(require("./routes/ai"));
const ai_scheduler_1 = __importDefault(require("./routes/ai.scheduler"));
const ocr_1 = __importDefault(require("./routes/ocr"));
const socket_service_1 = require("./services/socket.service");
const ai_scheduler_service_1 = require("./services/ai.scheduler.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Socket.IO setup
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/auth", auth_1.default);
app.use("/profiles", profiles_1.default);
app.use("/trajectories", trajectories_1.default);
app.use("/insights", insights_1.default);
app.use("/recommendations", recommendations_1.default);
app.use("/transactions", transactions_1.default);
app.use("/categories", categories_1.default);
app.use("/templates", templates_1.default);
app.use("/goals", goals_1.default);
app.use("/reminders", reminders_1.default);
app.use("/dashboard", dashboard_1.default);
app.use("/reports", reports_1.default);
app.use("/activity", activity_1.default);
app.use("/ai", ai_1.default);
app.use("/ai-scheduler", ai_scheduler_1.default);
app.use("/transactions", ocr_1.default);
(0, socket_service_1.setupSocketHandlers)(io);
ai_scheduler_service_1.AISchedulerService.initialize();
const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
