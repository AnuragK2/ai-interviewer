import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env";

export type GatewayAuthContext = {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
};

export type AuthenticatedGatewayRequest = Request & {
  auth?: GatewayAuthContext;
};

const encoder = new TextEncoder();

export async function attachAuthContext(req: AuthenticatedGatewayRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const { payload } = await jwtVerify(header.slice("Bearer ".length), encoder.encode(env.jwtSecret), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub === "string" && typeof payload.email === "string" && typeof payload.role === "string") {
      req.auth = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        companyId: typeof payload.companyId === "string" ? payload.companyId : undefined,
      };

      req.headers["x-user-id"] = payload.sub;
      req.headers["x-user-email"] = payload.email;
      req.headers["x-user-role"] = payload.role;
      if (typeof payload.companyId === "string") {
        req.headers["x-company-id"] = payload.companyId;
      }
    }
  } catch {
    // Invalid tokens are ignored at the gateway; downstream services enforce auth.
  }

  next();
}

export function requireGatewayAuth(req: AuthenticatedGatewayRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
