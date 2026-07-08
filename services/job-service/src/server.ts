import http from "node:http";
import { createHttpApp } from "./api/http/app";
import { env } from "./config/env";

export async function startServer() {
  const app = createHttpApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`${env.serviceName} running on port ${env.port}`);
    console.log(`Jobs API available at http://localhost:${env.port}/api/v1/jobs`);
  });

  return server;
}

