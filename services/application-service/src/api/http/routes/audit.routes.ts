import { Router } from "express";
import { recordTenantAudit } from "../../../application/audit/audit.service";
import { env } from "../../../config/env";

export const internalRouter = Router();

internalRouter.post("/tenant-audit", async (req, res) => {
  const serviceKey = req.headers["x-internal-service-key"];
  if (!serviceKey || serviceKey !== env.internalServiceKey) {
    res.status(401).json({ error: "Unauthorized internal request." });
    return;
  }

  try {
    const log = await recordTenantAudit(req.body);
    res.status(201).json({ log });
  } catch (error) {
    console.error("[internal-audit]", error);
    res.status(400).json({ error: "Failed to record audit log." });
  }
});
