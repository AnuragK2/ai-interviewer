import http from "node:http";
import { createHttpApp } from "./api/http/app";
import { env } from "./config/env";
import { bootstrapPlatform } from "./infrastructure/platform/bootstrap";
import { attachInterviewWebSocketServer } from "./infrastructure/websocket/interview-ws.server";

export async function startServer() {
  await bootstrapPlatform();

  const app = createHttpApp();
  const server = http.createServer(app);

  attachInterviewWebSocketServer(server);

  server.listen(env.port, () => {
    console.log(`${env.serviceName} running on port ${env.port}`);
    console.log(`Interview WebSocket available at ws://localhost:${env.port}/api/v1/interview/ws`);
  });

  return server;
}
