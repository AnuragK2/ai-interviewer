import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from "./config/env";

export function createInterviewProxy() {
  return createProxyMiddleware({
    target: env.interviewServiceUrl,
    changeOrigin: true,
    ws: false,
    pathFilter: (pathname) => pathname.startsWith("/api"),
    on: {
      proxyReq(_proxyReq, req) {
        console.log(`[gateway] → ${req.method} ${req.url} → ${env.interviewServiceUrl}${req.url}`);
      },
      error(err, req, res) {
        console.error(`[gateway] proxy error ${req.method} ${req.url}:`, err.message);
        if (res && "writeHead" in res && typeof res.writeHead === "function") {
          (res as express.Response).status(502).json({ error: "Interview service unavailable." });
        }
      },
    },
  });
}

export function createGatewayApp() {
  const app = express();
  const interviewProxy = createInterviewProxy();

  app.use(cors());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "gateway" });
  });

  app.use(express.json());
  app.use(interviewProxy);

  return { app, interviewProxy };
}
