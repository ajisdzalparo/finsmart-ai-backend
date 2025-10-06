import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

dotenv.config();

const app = express();
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
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
