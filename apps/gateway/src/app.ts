import cors from "cors";
import express, { type Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { ClientRequest } from "node:http";
import { env } from "./config/env";
import { attachAuthContext } from "./middleware/auth.middleware";

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

export function createInterviewProxy() {
  return createServiceProxy(env.interviewServiceUrl, "interview-service");
}

export function createIdentityProxy() {
  return createServiceProxy(env.identityServiceUrl, "identity-service");
}

export function createGatewayApp() {
  const app = express();
  const identityProxy = createIdentityProxy();
  const interviewProxy = createInterviewProxy();

  app.use(cors());
  app.use(express.json());
  app.use(attachAuthContext);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "gateway" });
  });

  app.use((req, res, next) => {
    const path = req.path;
    if (path.startsWith("/api/v1/auth") || path.startsWith("/api/v1/companies")) {
      identityProxy(req, res, next);
      return;
    }

    if (path.startsWith("/api")) {
      interviewProxy(req, res, next);
      return;
    }

    next();
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  return { app, identityProxy, interviewProxy };
}
