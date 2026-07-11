export const env = {
  serviceName: process.env.SERVICE_NAME ?? "matching-service",
  databaseUrl: process.env.DATABASE_URL,
  natsUrl: process.env.NATS_URL ?? "nats://localhost:4222",
  openaiApiKey: process.env.OPENAI_API_KEY,
} as const;

