import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import eventRoutes from "./routes/event.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import analyticsAdvancedRoutes from "./routes/analyticsAdvanced.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/analytics-plus", analyticsAdvancedRoutes);

app.use("/dashboard", express.static(path.resolve("public/dashboard")));

app.use(errorMiddleware);

export default app;