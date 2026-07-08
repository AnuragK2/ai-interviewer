import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../../application/auth/jwt.service";

export type AuthenticatedRequest = Request & {
  auth?: Awaited<ReturnType<typeof verifyAccessToken>>;
};

export async function requireRecruiterAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const auth = await verifyAccessToken(header.slice("Bearer ".length));
    if (auth.role !== "RECRUITER") {
      res.status(403).json({ error: "Recruiter access required." });
      return;
    }
    if (!auth.companyId) {
      res.status(403).json({ error: "Company context required." });
      return;
    }
    req.auth = auth;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

