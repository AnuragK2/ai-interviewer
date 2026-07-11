import http from "node:http";
import { createTracingMiddleware, initObservability } from "@ai-interviewer/observability";
import { createHttpApp } from "./api/http/app";
import { startApplicationEventWorker } from "./application/events/application-events.worker";
import { env } from "./config/env";

initObservability(env.serviceName);

export async function startServer() {
  const app = createHttpApp();
  app.use(createTracingMiddleware(env.serviceName));
  const server = http.createServer(app);

  await startApplicationEventWorker();

  server.listen(env.port, () => {
    console.log(`${env.serviceName} running on port ${env.port}`);
    console.log(`Applications API available at http://localhost:${env.port}/api/v1/applications`);
  });

  return server;
}

