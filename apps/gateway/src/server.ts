import http from "node:http";
import { createGatewayApp } from "./app";
import { env } from "./config/env";
import { attachInterviewWsRelay } from "./ws-relay";

export function startGateway() {
  const { app } = createGatewayApp();
  const server = http.createServer(app);

  attachInterviewWsRelay(server);

  server.on("error", (err) => {
    console.error("[gateway] server error:", err.message);
  });

  server.listen(env.port, () => {
    console.log(`[gateway] API gateway running on port ${env.port}`);
    console.log(`[gateway] Proxying /api/v1/auth/*, /api/v1/companies/* → ${env.identityServiceUrl}`);
    console.log(`[gateway] Proxying other /api/* → ${env.interviewServiceUrl}`);
    console.log(`[gateway] WebSocket /api/v1/interview/ws → interview-service (message relay)`);
  });

  return server;
}
