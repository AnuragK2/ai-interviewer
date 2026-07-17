import cors from "cors";
import express, { type Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { ClientRequest } from "node:http";
import { createTracingMiddleware, initObservability } from "@ai-interviewer/observability";
import { env } from "./config/env";
import { attachAuthContext } from "./middleware/auth.middleware";
import { createRateLimiter } from "./middleware/rate-limit.middleware";

initObservability("gateway");

function forwardParsedJsonBody(proxyReq: ClientRequest, req: Request) {
  const method = req.method?.toUpperCase();
  if (!method || !["POST", "PUT", "PATCH"].includes(method)) {
    return;
  }

  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json") || req.body === undefined) {
    return;
  }

  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader("Content-Type", "application/json");
  proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
}

function createServiceProxy(target: string, label: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: false,
    on: {
      proxyReq(proxyReq, req) {
        console.log(`[gateway] → ${req.method} ${req.url} → ${label}`);
        forwardParsedJsonBody(proxyReq, req as Request);
      },
      error(err, req, res) {
        console.error(`[gateway] ${label} proxy error ${req.method} ${req.url}:`, err.message);
        if (res && "writeHead" in res && typeof res.writeHead === "function") {
          (res as express.Response).status(502).json({ error: `${label} unavailable.` });
        }
      },
    },
  });
}

export function createProfileProxy() {
  return createServiceProxy(env.profileServiceUrl, "profile-service");
}

export function createJobProxy() {
  return createServiceProxy(env.jobServiceUrl, "job-service");
}

export function createInterviewProxy() {
  return createServiceProxy(env.interviewServiceUrl, "interview-service");
}

export function createIdentityProxy() {
  return createServiceProxy(env.identityServiceUrl, "identity-service");
}

export function createApplicationProxy() {
  return createServiceProxy(env.applicationServiceUrl, "application-service");
}

export function createNotificationProxy() {
  return createServiceProxy(env.notificationServiceUrl, "notification-service");
}

export function createBillingProxy() {
  return createServiceProxy(env.billingServiceUrl, "billing-service");
}

export function createGatewayApp() {
  const app = express();
  const identityProxy = createIdentityProxy();
  const profileProxy = createProfileProxy();
  const jobProxy = createJobProxy();
  const applicationProxy = createApplicationProxy();
  const notificationProxy = createNotificationProxy();
  const billingProxy = createBillingProxy();
  const interviewProxy = createInterviewProxy();

  const authRateLimit = createRateLimiter({ windowMs: 60_000, max: 20, keyPrefix: "auth" });
  const apiRateLimit = createRateLimiter({ windowMs: 60_000, max: 300, keyPrefix: "api" });
  const uploadRateLimit = createRateLimiter({ windowMs: 60_000, max: 30, keyPrefix: "upload" });

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(createTracingMiddleware("gateway"));
  app.use(attachAuthContext);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "gateway" });
  });

  app.use((req, res, next) => {
    const path = req.path;

    if (path.startsWith("/api/v1/auth")) {
      authRateLimit(req, res, () => identityProxy(req, res, next));
      return;
    }

    if (path.startsWith("/api/v1/companies")) {
      apiRateLimit(req, res, () => identityProxy(req, res, next));
      return;
    }

    if (path.startsWith("/api/v1/profiles")) {
      const run = () => profileProxy(req, res, next);
      if (req.method === "POST" && (path.includes("/resume") || path.includes("/photo"))) {
        uploadRateLimit(req, res, run);
        return;
      }
      apiRateLimit(req, res, run);
      return;
    }

    if (path.startsWith("/api/v1/jobs")) {
      apiRateLimit(req, res, () => jobProxy(req, res, next));
      return;
    }

    if (path.startsWith("/api/v1/applications")) {
      apiRateLimit(req, res, () => applicationProxy(req, res, next));
      return;
    }

    if (path.startsWith("/api/v1/notifications")) {
      apiRateLimit(req, res, () => notificationProxy(req, res, next));
      return;
    }

    if (path.startsWith("/api/v1/billing")) {
      apiRateLimit(req, res, () => billingProxy(req, res, next));
      return;
    }

    if (path.startsWith("/api")) {
      const run = () => interviewProxy(req, res, next);
      if (req.method === "POST" && (path.includes("/recording") || path.includes("/proctoring-snapshot"))) {
        uploadRateLimit(req, res, run);
        return;
      }
      apiRateLimit(req, res, run);
      return;
    }

    next();
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  return {
    app,
    identityProxy,
    profileProxy,
    jobProxy,
    applicationProxy,
    notificationProxy,
    billingProxy,
    interviewProxy,
  };
}
