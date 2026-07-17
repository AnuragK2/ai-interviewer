import http from "node:http";
import { createHttpApp } from "./api/http/app";
import { ensurePlansSeeded } from "./application/billing/billing.service";
import { env } from "./config/env";

export async function startServer() {
  await ensurePlansSeeded().catch((error) => {
    console.warn("[billing-service] plan seed skipped (DB may be unavailable):", error.message);
  });

  const app = createHttpApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`${env.serviceName} running on port ${env.port}`);
    console.log(`Billing API available at http://localhost:${env.port}/api/v1/billing`);
  });

  return server;
}
