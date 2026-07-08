import cors from "cors";
import express from "express";
import { jobsRouter } from "./routes/jobs.routes";

export function createHttpApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "job-service" });
  });

  app.use("/api/v1/jobs", jobsRouter);

  return app;
}

