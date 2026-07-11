export const env = {
  port: Number(process.env.PORT) || 3006,
  serviceName: process.env.SERVICE_NAME ?? "notification-service",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  natsUrl: process.env.NATS_URL ?? "nats://localhost:4222",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? "AI Interviewer <noreply@example.com>",
} as const;
