import { Router } from "express";
import { listNotificationsForUser } from "../../../application/notifications/notification.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { requireAuth } from "../middleware/auth.middleware";

export const notificationsRouter = Router();

notificationsRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await listNotificationsForUser(req.auth!.sub);
    res.json(result);
  } catch (error) {
    console.error("[notifications]", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
