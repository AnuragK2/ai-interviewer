import cors from "cors";
import express from "express";
import { profileRouter } from "./routes/profile.routes";

export function createHttpApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "profile-service" });
  });

  app.use("/api/v1/profiles", profileRouter);

  return app;
}
