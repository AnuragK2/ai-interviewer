import type { NextFunction, Response } from "express";
import { verifyAccessToken } from "../../../application/auth/jwt.service";
import type { Request } from "express";

export type AuthenticatedRequest = Request & {
  auth?: Awaited<ReturnType<typeof verifyAccessToken>>;
};

export async function requireCandidateAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const auth = await verifyAccessToken(header.slice("Bearer ".length));
    if (auth.role !== "CANDIDATE") {
      res.status(403).json({ error: "Candidate access required." });
      return;
    }
    req.auth = auth;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
