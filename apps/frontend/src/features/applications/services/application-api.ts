import type {
  ApplicationListItem,
  ApplicationResponse,
  ApplyToJobRequest,
  CandidateApplicationDetailResponse,
  CandidateApplicationListResponse,
  CandidateDashboardResponse,
  InterviewAccessResponse,
  RecruiterApplicationListResponse,
  RecruiterApplicationPacketResponse,
  RecruiterDashboardResponse,
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

export async function listMyApplications(): Promise<ApplicationListItem[]> {
  const data = await applicationFetch<CandidateApplicationListResponse>("/api/v1/applications/me");
  return data.applications;
}

export async function getCandidateDashboard(): Promise<CandidateDashboardResponse> {
  return applicationFetch<CandidateDashboardResponse>("/api/v1/applications/me/dashboard");
}

export async function getRecruiterDashboard(): Promise<RecruiterDashboardResponse> {
  return applicationFetch<RecruiterDashboardResponse>("/api/v1/applications/_recruiter/dashboard");
}

export async function listRecruiterAuditLogs(limit = 50) {
  return applicationFetch<import("@ai-interviewer/api-types").TenantAuditLogListResponse>(
    `/api/v1/applications/_recruiter/audit-logs?limit=${limit}`,
  );
}

export async function getCandidateApplication(applicationId: string): Promise<CandidateApplicationDetailResponse> {
  return applicationFetch<CandidateApplicationDetailResponse>(`/api/v1/applications/${applicationId}`);
}

export async function getInterviewAccess(interviewId: string): Promise<InterviewAccessResponse> {
  return applicationFetch<InterviewAccessResponse>(`/api/v1/applications/me/by-interview/${interviewId}`);
}

export async function markInterviewPending(applicationId: string): Promise<ApplicationResponse> {
  const data = await applicationFetch<{ application: ApplicationResponse }>(
    `/api/v1/applications/${applicationId}/start-interview`,
    { method: "POST" },
  );
  return data.application;
}

export async function inviteToInterview(applicationId: string): Promise<ApplicationResponse> {
  const data = await applicationFetch<{ application: ApplicationResponse }>(
    `/api/v1/applications/_recruiter/${applicationId}/invite`,
    { method: "POST" },
  );
  return data.application;
}

export async function listApplicantsForJob(jobId: string): Promise<ApplicationResponse[]> {
  const data = await applicationFetch<RecruiterApplicationListResponse>(`/api/v1/applications/_recruiter/job/${jobId}`);
  return data.applications;
}

export async function getRecruiterApplicationPacket(applicationId: string): Promise<RecruiterApplicationPacketResponse> {
  return applicationFetch<RecruiterApplicationPacketResponse>(`/api/v1/applications/_recruiter/${applicationId}`);
}
