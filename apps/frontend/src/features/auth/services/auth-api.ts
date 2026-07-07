import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  OAuthProviderKey,
  OAuthProvidersResponse,
  RegisterCandidateRequest,
  RegisterRecruiterRequest,
} from "@ai-interviewer/api-types";
import { BACKEND_URL } from "@/shared/api/config";
import { getAccessToken } from "@/shared/lib/auth-storage";

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export function getOAuthStartUrl(provider: OAuthProviderKey, role: "CANDIDATE" | "RECRUITER"): string {
  const params = new URLSearchParams({ role });
  return `${BACKEND_URL}/api/v1/auth/oauth/${provider}?${params.toString()}`;
}

export async function fetchOAuthProviders(): Promise<OAuthProviderKey[]> {
  const data = await authFetch<OAuthProvidersResponse>("/api/v1/auth/providers");
  return data.providers;
}

export async function registerCandidate(input: RegisterCandidateRequest): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/v1/auth/register/candidate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function registerRecruiter(input: RegisterRecruiterRequest): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/v1/auth/register/recruiter", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function login(input: LoginRequest): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const data = await authFetch<{ user: AuthUser }>("/api/v1/auth/me");
  return data.user;
}

export async function logout(): Promise<void> {
  // Token is client-side only for now.
}
