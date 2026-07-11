export const env = {
  port: Number(process.env.PORT) || 3005,
  serviceName: process.env.SERVICE_NAME ?? "application-service",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  natsUrl: process.env.NATS_URL ?? "nats://localhost:4222",
  gatewayUrl: process.env.GATEWAY_URL ?? "http://localhost:8080",
} as const;

