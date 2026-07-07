import type { AuthUser, UserRole } from "@ai-interviewer/api-types";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../config/env";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  companyId?: string;
};

const encoder = new TextEncoder();

function getSecretKey() {
  return encoder.encode(env.jwtSecret);
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    ...(payload.companyId ? { companyId: payload.companyId } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(env.jwtExpiresIn)
    .sign(getSecretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
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

export async function signOAuthState(payload: {
  provider: string;
  role: UserRole;
  nonce: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(getSecretKey());
}

export async function verifyOAuthState(token: string): Promise<{
  provider: string;
  role: UserRole;
  nonce: string;
}> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ["HS256"],
  });

  const provider = payload.provider;
  const role = payload.role;
  const nonce = payload.nonce;

  if (typeof provider !== "string" || typeof nonce !== "string" || typeof role !== "string") {
    throw new Error("Invalid OAuth state.");
  }

  if (role !== "CANDIDATE" && role !== "RECRUITER") {
    throw new Error("Invalid OAuth role.");
  }

  return { provider, role, nonce };
}

export function toAuthUser(
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: UserRole;
    companyId: string | null;
    company?: { id: string; name: string; slug: string } | null;
  },
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    companyId: user.companyId,
    company: user.company
      ? { id: user.company.id, name: user.company.name, slug: user.company.slug }
      : null,
  };
}
