import http from "node:http";
import { createHttpApp } from "./api/http/app";
import { env } from "./config/env";
import { bootstrapPlatform } from "./infrastructure/platform/bootstrap";

export async function startServer() {
  await bootstrapPlatform();

  const app = createHttpApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`${env.serviceName} running on port ${env.port}`);
    console.log(`Profile API available at http://localhost:${env.port}/api/v1/profiles`);
  });

  return server;
}
