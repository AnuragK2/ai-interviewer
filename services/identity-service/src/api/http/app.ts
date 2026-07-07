import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes";
import { companiesRouter } from "./routes/companies.routes";

export function createHttpApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "identity-service" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/companies", companiesRouter);

  return app;
}
