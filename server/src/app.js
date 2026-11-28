import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import eventRoutes from "./routes/eventRoutes.js";
import simulationRoutes from "./routes/simulationRoutes.js";
import twinRoutes from "./routes/twinRoutes.js";
import routingRoutes from "./routes/routingRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json({ limit: "8mb" }));

  app.get("/api/v1/health", (req, res) => {
    res.json({
      status: "ok",
      service: "namma-sandbox-server",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      time: new Date().toISOString(),
    });
  });

  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/simulations", simulationRoutes);
  app.use("/api/v1/twin", twinRoutes);
  app.use("/api/v1/routing", routingRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);
  app.use("/api/v1/ai", aiRoutes);
    app.use("/api/v1/auth", authRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}