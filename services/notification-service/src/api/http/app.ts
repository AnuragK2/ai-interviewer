import cors from "cors";
import express from "express";
import { notificationsRouter } from "./routes/notifications.routes";

export function createHttpApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "notification-service" });
  });

  app.use("/api/v1/notifications", notificationsRouter);

  return app;
}
