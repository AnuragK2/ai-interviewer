import cors from "cors";
import express from "express";
import { interviewMediaRouter } from "./routes/interview-media.routes";
import { interviewResultsRouter } from "./routes/interview-results.routes";
import { interviewsRouter } from "./routes/interviews.routes";

export function createHttpApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "interview-service" });
  });

  app.use("/api/v1/interviews", interviewsRouter);
  app.use("/api/v1/interview", interviewMediaRouter);
  app.use("/api/v1/interview", interviewResultsRouter);

  return app;
}
