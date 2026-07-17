export const env = {
  port: Number(process.env.PORT) || 3005,
  serviceName: process.env.SERVICE_NAME ?? "application-service",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  natsUrl: process.env.NATS_URL ?? "nats://localhost:4222",
  gatewayUrl: process.env.GATEWAY_URL ?? "http://localhost:8080",
  interviewServiceUrl: process.env.INTERVIEW_SERVICE_URL ?? "http://localhost:3001",
  profileServiceUrl: process.env.PROFILE_SERVICE_URL ?? "http://localhost:3003",
  billingServiceUrl: process.env.BILLING_SERVICE_URL ?? "http://localhost:3007",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  jobServiceUrl: process.env.JOB_SERVICE_URL ?? "http://localhost:3004",
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY ?? "dev-internal-service-key",
} as const;

