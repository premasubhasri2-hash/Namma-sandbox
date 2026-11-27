import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/v1/health", (req, res) => {
    res.json({
      status: "ok",
      service: "namma-sandbox-server",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      time: new Date().toISOString(),
    });
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}