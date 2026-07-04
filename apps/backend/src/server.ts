import http from "node:http";
import { createHttpApp } from "./api/http/app";
import { env } from "./config/env";
import { attachInterviewWebSocketServer } from "./infrastructure/websocket/interview-ws.server";

export function startServer() {
  const app = createHttpApp();
  const server = http.createServer(app);

  attachInterviewWebSocketServer(server);

  server.listen(env.port, () => {
    console.log(`Backend running on port ${env.port}`);
    console.log(`Interview WebSocket available at ws://localhost:${env.port}/api/v1/interview/ws`);
  });

  return server;
}
