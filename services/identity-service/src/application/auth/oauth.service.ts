import type { OAuthProvider, UserRole } from "@ai-interviewer/api-types";
import axios from "axios";
import { env, type OAuthProviderKey } from "../../config/env";

export type OAuthProfile = {
  providerAccountId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string | undefined;
  clientSecret: string | undefined;
};

const providerConfigs: Record<OAuthProviderKey, ProviderConfig> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "profile"],
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["read:user", "user:email"],
    clientId: env.githubClientId,
    clientSecret: env.githubClientSecret,
  },
};

export function oauthProviderKeyToEnum(provider: OAuthProviderKey): OAuthProvider {
  switch (provider) {
    case "google":
      return "GOOGLE";
    case "github":
      return "GITHUB";
  }
}

export function oauthProviderEnumToKey(provider: OAuthProvider): OAuthProviderKey {
  switch (provider) {
    case "GOOGLE":
      return "google";
    case "GITHUB":
      return "github";
  }
}

export function buildOAuthAuthorizationUrl(provider: OAuthProviderKey, state: string): string {
  const config = providerConfigs[provider];
  if (!config.clientId) {
    throw new Error(`${provider} OAuth is not configured.`);
  }

  const redirectUri = `${env.oauthCallbackBaseUrl}/${provider}/callback`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });

  if (provider === "google") {
    params.set("access_type", "online");
    params.set("prompt", "select_account");
  }

  return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeOAuthCode(
  provider: OAuthProviderKey,
  code: string,
): Promise<OAuthProfile> {
  const config = providerConfigs[provider];
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider} OAuth is not configured.`);
  }

  const redirectUri = `${env.oauthCallbackBaseUrl}/${provider}/callback`;

  const tokenResponse = await axios.post(
    config.tokenUrl,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const accessToken = tokenResponse.data.access_token as string | undefined;
  if (!accessToken) {
    throw new Error("OAuth token exchange failed.");
  }

  switch (provider) {
    case "google":
      return fetchGoogleProfile(accessToken);
    case "github":
      return fetchGitHubProfile(accessToken);
  }
}

async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const { data } = await axios.get("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const email = data.email as string | undefined;
  if (!email) {
    throw new Error("Google account has no email.");
  }

  return {
    providerAccountId: String(data.sub),
    email,
    name: typeof data.name === "string" ? data.name : null,
    avatarUrl: typeof data.picture === "string" ? data.picture : null,
  };
}

async function fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  const [{ data: user }, { data: emails }] = await Promise.all([
    axios.get("https://api.github.com/user", { headers }),
    axios.get<Array<{ email: string; primary: boolean; verified: boolean }>>(
      "https://api.github.com/user/emails",
      { headers },
    ),
  ]);

  const primaryEmail =
    emails.find((entry) => entry.primary && entry.verified)?.email ??
    emails.find((entry) => entry.verified)?.email ??
    emails[0]?.email;

  if (!primaryEmail) {
    throw new Error("GitHub account has no verified email.");
  }

  return {
    providerAccountId: String(user.id),
    email: primaryEmail,
    name: typeof user.name === "string" ? user.name : (user.login as string | undefined) ?? null,
    avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
  };
}

export function parseOAuthRole(value: unknown): UserRole {
  return value === "RECRUITER" ? "RECRUITER" : "CANDIDATE";
}
