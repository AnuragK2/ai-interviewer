import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../../application/auth/jwt.service";

export type AuthenticatedRequest = Request & {
  auth?: Awaited<ReturnType<typeof verifyAccessToken>>;
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    req.auth = await verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
