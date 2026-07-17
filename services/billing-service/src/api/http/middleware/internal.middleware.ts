import type { Request, Response, NextFunction } from "express";
import { env } from "../../../config/env";

export function requireInternalServiceKey(req: Request, res: Response, next: NextFunction) {
  const serviceKey = req.headers["x-internal-service-key"];
  if (!serviceKey || serviceKey !== env.internalServiceKey) {
    res.status(401).json({ error: "Unauthorized internal request." });
    return;
  }
  next();
}
