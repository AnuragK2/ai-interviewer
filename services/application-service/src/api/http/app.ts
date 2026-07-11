import cors from "cors";
import express from "express";
import { applicationsRouter } from "./routes/applications.routes";

export function createHttpApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "application-service" });
  });

  app.use("/api/v1/applications", applicationsRouter);

  return app;
}

