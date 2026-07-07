export const env = {
  port: Number(process.env.PORT) || 3002,
  serviceName: process.env.SERVICE_NAME ?? "identity-service",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  oauthCallbackBaseUrl:
    process.env.OAUTH_CALLBACK_BASE_URL ?? "http://localhost:8080/api/v1/auth/oauth",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  natsUrl: process.env.NATS_URL ?? "nats://localhost:4222",
} as const;

export type OAuthProviderKey = "google" | "github";

export function isOAuthProviderConfigured(provider: OAuthProviderKey): boolean {
  switch (provider) {
    case "google":
      return Boolean(env.googleClientId && env.googleClientSecret);
    case "github":
      return Boolean(env.githubClientId && env.githubClientSecret);
  }
}

export function getConfiguredOAuthProviders(): OAuthProviderKey[] {
  return (["google", "github"] as const).filter(isOAuthProviderConfigured);
}
