import {
  LoginRequestSchema,
  RegisterCandidateRequestSchema,
  RegisterRecruiterRequestSchema,
} from "@ai-interviewer/api-types";
import { Router } from "express";
import {
  AuthError,
  completeOAuthLogin,
  getCurrentUser,
  login,
  registerCandidate,
  registerRecruiter,
} from "../../../application/auth/auth.service";
import { signOAuthState, verifyOAuthState } from "../../../application/auth/jwt.service";
import {
  buildOAuthAuthorizationUrl,
  parseOAuthRole,
} from "../../../application/auth/oauth.service";
import { env, getConfiguredOAuthProviders, type OAuthProviderKey } from "../../../config/env";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

function isOAuthProviderKey(value: string): value is OAuthProviderKey {
  return value === "google" || value === "github";
}

authRouter.get("/providers", (_req, res) => {
  res.json({ providers: getConfiguredOAuthProviders() });
});

authRouter.post("/register/candidate", async (req, res) => {
  try {
    const body = RegisterCandidateRequestSchema.parse(req.body);
    const result = await registerCandidate(body);
    res.status(201).json(result);
  } catch (error) {
    handleAuthRouteError(res, error);
  }
});

authRouter.post("/register/recruiter", async (req, res) => {
  try {
    const body = RegisterRecruiterRequestSchema.parse(req.body);
    const result = await registerRecruiter(body);
    res.status(201).json(result);
  } catch (error) {
    handleAuthRouteError(res, error);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const body = LoginRequestSchema.parse(req.body);
    const result = await login(body);
    res.json(result);
  } catch (error) {
    handleAuthRouteError(res, error);
  }
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await getCurrentUser(req.auth!.sub);
    res.json({ user });
  } catch (error) {
    handleAuthRouteError(res, error);
  }
});

authRouter.get("/oauth/:provider", async (req, res) => {
  const provider = req.params.provider;
  if (!isOAuthProviderKey(provider)) {
    res.status(400).json({ error: "Unsupported OAuth provider." });
    return;
  }

  if (!getConfiguredOAuthProviders().includes(provider)) {
    res.status(503).json({ error: `${provider} OAuth is not configured.` });
    return;
  }

  try {
    const role = parseOAuthRole(req.query.role);
    const state = await signOAuthState({
      provider,
      role,
      nonce: crypto.randomUUID(),
    });

    const url = buildOAuthAuthorizationUrl(provider, state);
    res.redirect(url);
  } catch (error) {
    handleAuthRouteError(res, error);
  }
});

authRouter.get("/oauth/:provider/callback", async (req, res) => {
  const provider = req.params.provider;
  if (!isOAuthProviderKey(provider)) {
    res.redirect(`${env.frontendUrl}/auth/callback?error=unsupported_provider`);
    return;
  }

  const error = req.query.error;
  if (typeof error === "string") {
    res.redirect(`${env.frontendUrl}/auth/callback?error=${encodeURIComponent(error)}`);
    return;
  }

  const code = req.query.code;
  const state = req.query.state;

  if (typeof code !== "string" || typeof state !== "string") {
    res.redirect(`${env.frontendUrl}/auth/callback?error=missing_code`);
    return;
  }

  try {
    const parsedState = await verifyOAuthState(state);
    if (parsedState.provider !== provider) {
      throw new Error("OAuth provider mismatch.");
    }

    const result = await completeOAuthLogin(provider, code, parsedState.role);
    const redirectUrl = new URL("/auth/callback", env.frontendUrl);
    redirectUrl.searchParams.set("token", result.accessToken);
    redirectUrl.searchParams.set("role", result.user.role);
    res.redirect(redirectUrl.toString());
  } catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : "oauth_failed";
    res.redirect(`${env.frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
  }
});

function handleAuthRouteError(res: import("express").Response, error: unknown) {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error && typeof error === "object" && "issues" in error) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  console.error("[auth]", error);
  res.status(500).json({ error: "Internal server error." });
}
