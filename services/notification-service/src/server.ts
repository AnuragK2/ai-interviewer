import http from "node:http";
import { createHttpApp } from "./api/http/app";
import { startNotificationWorker } from "./worker";
import { env } from "./config/env";

export async function startServer() {
  const app = createHttpApp();
  const server = http.createServer(app);

  await startNotificationWorker();

  server.listen(env.port, () => {
    console.log(`${env.serviceName} running on port ${env.port}`);
    console.log(`Notifications API available at http://localhost:${env.port}/api/v1/notifications`);
  });

  return server;
}
