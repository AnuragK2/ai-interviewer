import type {
  CandidateApplicationListResponse,
  CandidateProfileResponse,
  RecommendedJobResponse,
  RecommendedJobsResponse,
} from "@ai-interviewer/api-types";
import { analyzeFit } from "@ai-interviewer/matching-service/analyze";
import { env } from "../../config/env";
import { listJobsPublic } from "./job.service";

const RECOMMENDED_MATCH_THRESHOLD = 55;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstream request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export async function listRecommendedJobsForCandidate(accessToken: string): Promise<RecommendedJobsResponse> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [profileResponse, applicationsResponse, jobsResponse] = await Promise.all([
    fetchJson<{ profile: CandidateProfileResponse }>(`${env.gatewayUrl}/api/v1/profiles/me`, { headers }),
    fetchJson<CandidateApplicationListResponse>(`${env.gatewayUrl}/api/v1/applications/me`, { headers }),
    listJobsPublic({ status: "OPEN" }),
  ]);

  const appliedJobIds = new Set(applicationsResponse.applications.map((application) => application.jobId));
  const openJobs = jobsResponse.jobs.filter((job) => !job.isExpired);

  const scored: RecommendedJobResponse[] = openJobs.map((job) => {
    const match = analyzeFit(job, profileResponse.profile);
    const hasApplied = appliedJobIds.has(job.id);

    return {
      ...job,
      matchScore: match.fitScore,
      matchSummary: match.fitSummary,
      isRecommended: !hasApplied && match.fitScore >= RECOMMENDED_MATCH_THRESHOLD,
      hasApplied,
    };
  });

  scored.sort((left, right) => right.matchScore - left.matchScore);

  return { jobs: scored };
}
