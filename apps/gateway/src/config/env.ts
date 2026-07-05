export const env = {
  port: Number(process.env.PORT) || 8080,
  interviewServiceUrl: process.env.INTERVIEW_SERVICE_URL ?? "http://localhost:3001",
} as const;
