import type {
  ApplicationResponse,
  ApplyToJobRequest,
  CandidateApplicationListResponse,
  RecruiterApplicationListResponse,
  RecruiterApplicationPacketResponse,
} from "@ai-interviewer/api-types";
import { BACKEND_URL } from "@/shared/api/config";
import { getAccessToken } from "@/shared/lib/auth-storage";

async function applicationFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export async function applyToJob(input: ApplyToJobRequest): Promise<ApplicationResponse> {
  const data = await applicationFetch<{ application: ApplicationResponse }>("/api/v1/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.application;
}

export async function listMyApplications(): Promise<ApplicationResponse[]> {
  const data = await applicationFetch<CandidateApplicationListResponse>("/api/v1/applications/me");
  return data.applications;
}

export async function listApplicantsForJob(jobId: string): Promise<ApplicationResponse[]> {
  const data = await applicationFetch<RecruiterApplicationListResponse>(`/api/v1/applications/_recruiter/job/${jobId}`);
  return data.applications;
}

export async function getRecruiterApplicationPacket(applicationId: string): Promise<RecruiterApplicationPacketResponse> {
  return applicationFetch<RecruiterApplicationPacketResponse>(`/api/v1/applications/_recruiter/${applicationId}`);
}

