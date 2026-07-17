import cors from "cors";
import express, { type Request } from "express";
import { billingRouter, internalBillingRouter } from "./routes/billing.routes";
import { webhooksRouter } from "./routes/webhooks.routes";

export function createHttpApp() {
  const app = express();

  app.use(cors());

  // Capture raw body for Razorpay webhook signature verification
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: string }).rawBody = buf.toString("utf8");
      },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "billing-service" });
  });

  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/billing/webhooks", webhooksRouter);
  app.use("/api/v1/internal/billing", internalBillingRouter);

  return app;
}
