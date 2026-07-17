import { Router, type Request, type Response } from "express";
import { BillingError, handleRazorpayWebhook } from "../../../application/billing/billing.service";

export const webhooksRouter = Router();

webhooksRouter.post("/razorpay", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody =
      typeof (req as Request & { rawBody?: string }).rawBody === "string"
        ? (req as Request & { rawBody?: string }).rawBody!
        : JSON.stringify(req.body);

    const result = await handleRazorpayWebhook(
      rawBody,
      typeof signature === "string" ? signature : undefined,
      req.body,
    );
    res.json(result);
  } catch (error) {
    if (error instanceof BillingError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("[billing-webhook]", error);
    res.status(500).json({ error: "Webhook processing failed." });
  }
});
