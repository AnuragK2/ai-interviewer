export const env = {
  port: Number(process.env.PORT) || 8080,
  interviewServiceUrl: process.env.INTERVIEW_SERVICE_URL ?? "http://localhost:3001",
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL ?? "http://localhost:3002",
  profileServiceUrl: process.env.PROFILE_SERVICE_URL ?? "http://localhost:3003",
  jobServiceUrl: process.env.JOB_SERVICE_URL ?? "http://localhost:3004",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
} as const;
