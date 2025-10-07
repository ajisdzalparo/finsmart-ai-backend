import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import authRouter from "./routes/auth";
import profilesRouter from "./routes/profiles";
import trajectoriesRouter from "./routes/trajectories";
import insightsRouter from "./routes/insights";
import recommendationsRouter from "./routes/recommendations";
import transactionsRouter from "./routes/transactions";
import categoriesRouter from "./routes/categories";
import templatesRouter from "./routes/templates";
import goalsRouter from "./routes/goals";
import remindersRouter from "./routes/reminders";
import dashboardRouter from "./routes/dashboard";
import reportsRouter from "./routes/reports";
import activityRouter from "./routes/activity";
import aiRouter from "./routes/ai";
import aiSchedulerRouter from "./routes/ai.scheduler";
import ocrRouter from "./routes/ocr";
import { setupSocketHandlers } from "./services/socket.service";
import { AISchedulerService } from "./services/ai.scheduler.service";

dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/trajectories", trajectoriesRouter);
app.use("/insights", insightsRouter);
app.use("/recommendations", recommendationsRouter);
app.use("/transactions", transactionsRouter);
app.use("/categories", categoriesRouter);
app.use("/templates", templatesRouter);
app.use("/goals", goalsRouter);
app.use("/reminders", remindersRouter);
app.use("/dashboard", dashboardRouter);
app.use("/reports", reportsRouter);
app.use("/activity", activityRouter);
app.use("/ai", aiRouter);
app.use("/ai-scheduler", aiSchedulerRouter);
app.use("/transactions", ocrRouter);

setupSocketHandlers(io);

AISchedulerService.initialize();

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
