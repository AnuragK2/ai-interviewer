import type {
  CandidateProfileResponse,
  ResumeDownloadResponse,
  UpdateCandidateProfileRequest,
} from "@ai-interviewer/api-types";
import { BACKEND_URL } from "@/shared/api/config";
import { getAccessToken } from "@/shared/lib/auth-storage";

async function profileFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
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

export async function fetchMyProfile(): Promise<CandidateProfileResponse> {
  const data = await profileFetch<{ profile: CandidateProfileResponse }>("/api/v1/profiles/me");
  return data.profile;
}

export async function updateMyProfile(
  input: UpdateCandidateProfileRequest,
): Promise<CandidateProfileResponse> {
  const data = await profileFetch<{ profile: CandidateProfileResponse }>("/api/v1/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.profile;
}

export async function uploadResume(
  file: File,
  profile?: UpdateCandidateProfileRequest,
): Promise<CandidateProfileResponse> {
  const formData = new FormData();
  formData.append("resume", file);
  if (profile) {
    formData.append("profile", JSON.stringify(profile));
  }

  const data = await profileFetch<{ profile: CandidateProfileResponse }>("/api/v1/profiles/me/resume", {
    method: "POST",
    body: formData,
  });
  return data.profile;
}

export async function uploadProfilePhoto(file: File): Promise<CandidateProfileResponse> {
  const formData = new FormData();
  formData.append("photo", file);

  const data = await profileFetch<{ profile: CandidateProfileResponse }>("/api/v1/profiles/me/photo", {
    method: "POST",
    body: formData,
  });
  return data.profile;
}

export async function getResumeDownloadUrl(): Promise<ResumeDownloadResponse> {
  return profileFetch<ResumeDownloadResponse>("/api/v1/profiles/me/resume/download");
}

export async function enrichGithubProfile(): Promise<CandidateProfileResponse> {
  const data = await profileFetch<{ profile: CandidateProfileResponse }>("/api/v1/profiles/me/github/enrich", {
    method: "POST",
  });
  return data.profile;
}
