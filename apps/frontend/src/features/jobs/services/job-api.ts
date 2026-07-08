import type { CreateJobRequest, JobResponse, ListJobsResponse, UpdateJobRequest } from "@ai-interviewer/api-types";
import { BACKEND_URL } from "@/shared/api/config";
import { getAccessToken } from "@/shared/lib/auth-storage";

async function jobFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

export async function listPublicJobs(): Promise<JobResponse[]> {
  const data = await jobFetch<ListJobsResponse>("/api/v1/jobs?status=OPEN");
  return data.jobs;
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const data = await jobFetch<{ job: JobResponse }>(`/api/v1/jobs/${jobId}`);
  return data.job;
}

export async function listRecruiterJobs(): Promise<JobResponse[]> {
  const data = await jobFetch<ListJobsResponse>("/api/v1/jobs/_recruiter/mine");
  return data.jobs;
}

export async function createJob(input: CreateJobRequest): Promise<JobResponse> {
  const data = await jobFetch<{ job: JobResponse }>("/api/v1/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.job;
}

export async function updateJob(jobId: string, input: UpdateJobRequest): Promise<JobResponse> {
  const data = await jobFetch<{ job: JobResponse }>(`/api/v1/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.job;
}

