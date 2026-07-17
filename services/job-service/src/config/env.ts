export const env = {
  port: Number(process.env.PORT) || 3004,
  serviceName: process.env.SERVICE_NAME ?? "job-service",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  gatewayUrl: process.env.GATEWAY_URL ?? "http://localhost:8080",
  applicationServiceUrl: process.env.APPLICATION_SERVICE_URL ?? "http://localhost:3005",
  billingServiceUrl: process.env.BILLING_SERVICE_URL ?? "http://localhost:3007",
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY ?? "dev-internal-service-key",
  openaiApiKey: process.env.OPENAI_API_KEY,
} as const;

