import { Router } from "express";
import {
  BillingError,
  cancelSubscription,
  createCheckout,
  ensureFreeSubscription,
  getBillingMe,
  getEntitlement,
  listPlans,
  recordInterviewInvite,
  verifyCheckout,
} from "../../../application/billing/billing.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { requireRecruiterAuth } from "../middleware/auth.middleware";
import { requireInternalServiceKey } from "../middleware/internal.middleware";

export const billingRouter = Router();
export const internalBillingRouter = Router();

billingRouter.get("/plans", requireRecruiterAuth, async (_req, res) => {
  try {
    const plans = await listPlans();
    res.json({ plans });
  } catch (error) {
    handleBillingError(res, error);
  }
});

billingRouter.get("/me", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const openJobs = Number(req.query.openJobs ?? 0);
    const me = await getBillingMe(req.auth!.companyId!, Number.isFinite(openJobs) ? openJobs : 0);
    res.json(me);
  } catch (error) {
    handleBillingError(res, error);
  }
});

billingRouter.post("/checkout", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const planId = typeof req.body?.planId === "string" ? req.body.planId : null;
    if (!planId) {
      res.status(400).json({ error: "planId is required." });
      return;
    }
    const checkout = await createCheckout(req.auth!.companyId!, planId);
    res.status(201).json(checkout);
  } catch (error) {
    handleBillingError(res, error);
  }
});

billingRouter.post("/verify", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body ?? {};
    if (
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_subscription_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      res.status(400).json({ error: "Invalid verification payload." });
      return;
    }
    const subscription = await verifyCheckout(req.auth!.companyId!, {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });
    res.json({ subscription });
  } catch (error) {
    handleBillingError(res, error);
  }
});

billingRouter.post("/cancel", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const subscription = await cancelSubscription(req.auth!.companyId!);
    res.json(subscription);
  } catch (error) {
    handleBillingError(res, error);
  }
});

internalBillingRouter.post("/ensure-free", requireInternalServiceKey, async (req, res) => {
  try {
    const companyId = typeof req.body?.companyId === "string" ? req.body.companyId : null;
    if (!companyId) {
      res.status(400).json({ error: "companyId is required." });
      return;
    }
    const subscription = await ensureFreeSubscription(companyId);
    res.status(201).json(subscription);
  } catch (error) {
    handleBillingError(res, error);
  }
});

internalBillingRouter.get("/entitlement/:companyId", requireInternalServiceKey, async (req, res) => {
  try {
    const companyId = typeof req.params.companyId === "string" ? req.params.companyId : null;
    if (!companyId) {
      res.status(400).json({ error: "Invalid company id." });
      return;
    }
    const openJobs = Number(req.query.openJobs ?? 0);
    const entitlement = await getEntitlement(companyId, Number.isFinite(openJobs) ? openJobs : 0);
    res.json(entitlement);
  } catch (error) {
    handleBillingError(res, error);
  }
});

internalBillingRouter.post("/usage/interview-invite", requireInternalServiceKey, async (req, res) => {
  try {
    const companyId = typeof req.body?.companyId === "string" ? req.body.companyId : null;
    if (!companyId) {
      res.status(400).json({ error: "companyId is required." });
      return;
    }
    const subscription = await recordInterviewInvite(companyId);
    res.json(subscription);
  } catch (error) {
    handleBillingError(res, error);
  }
});

function handleBillingError(res: import("express").Response, error: unknown) {
  if (error instanceof BillingError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
    return;
  }
  console.error("[billing]", error);
  res.status(500).json({ error: "Internal server error." });
}
