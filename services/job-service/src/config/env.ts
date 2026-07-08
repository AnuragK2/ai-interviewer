export const env = {
  port: Number(process.env.PORT) || 3004,
  serviceName: process.env.SERVICE_NAME ?? "job-service",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
} as const;

