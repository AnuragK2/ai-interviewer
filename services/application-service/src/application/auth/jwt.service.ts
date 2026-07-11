import { jwtVerify } from "jose";
import { env } from "../../config/env";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: "CANDIDATE" | "RECRUITER";
  companyId?: string;
};

const encoder = new TextEncoder();

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, encoder.encode(env.jwtSecret), {
    algorithms: ["HS256"],
  });

  const sub = payload.sub;
  const email = payload.email;
  const role = payload.role;

  if (typeof sub !== "string" || typeof email !== "string" || typeof role !== "string") {
    throw new Error("Invalid token payload.");
  }

  if (role !== "CANDIDATE" && role !== "RECRUITER") {
    throw new Error("Invalid token role.");
  }

  return {
    sub,
    email,
    role,
    companyId: typeof payload.companyId === "string" ? payload.companyId : undefined,
  };
}

