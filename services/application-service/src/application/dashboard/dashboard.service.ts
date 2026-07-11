import type {
  ApplicationStatus,
  CandidateDashboardResponse,
  CandidateProfileResponse,
  JobResponse,
  ListJobsResponse,
  RecruiterDashboardResponse,
  RecommendedJobsResponse,
} from "@ai-interviewer/api-types";
import { prisma } from "../../infrastructure/db/prisma.client";
import { env } from "../../config/env";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstream request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

function extractJobTitle(jobSnapshot: unknown): string | null {
  if (!jobSnapshot || typeof jobSnapshot !== "object") return null;
  const title = (jobSnapshot as { title?: unknown }).title;
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

const PIPELINE_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  ANALYZING: "Analyzing",
  ANALYZED: "Awaiting review",
  INTERVIEW_INVITED: "Interview invited",
  INTERVIEW_PENDING: "Interview pending",
  INTERVIEW_IN_PROGRESS: "Interview in progress",
  INTERVIEW_COMPLETED: "Interview completed",
  INTERVIEW_CANCELLED: "Interview cancelled",
};

const PIPELINE_ORDER: ApplicationStatus[] = [
  "SUBMITTED",
  "ANALYZING",
  "ANALYZED",
  "INTERVIEW_INVITED",
  "INTERVIEW_PENDING",
  "INTERVIEW_IN_PROGRESS",
  "INTERVIEW_COMPLETED",
  "INTERVIEW_CANCELLED",
];

function daysUntil(isoDate: string) {
  const target = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (24 * 60 * 60 * 1000));
}

export async function getCandidateDashboard(
  candidateUserId: string,
  accessToken: string,
): Promise<CandidateDashboardResponse> {
  const apps = await prisma.application.findMany({
    where: { candidateUserId },
    orderBy: { updatedAt: "desc" },
  });

  const statusCounts = new Map<ApplicationStatus, number>();
  let pendingInterviews = 0;

  for (const app of apps) {
    const status = app.status as ApplicationStatus;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

    if (status === "INTERVIEW_INVITED" || status === "INTERVIEW_PENDING") {
      pendingInterviews += 1;
    }
  }

  const recentApplications = apps.slice(0, 5).map((app) => ({
    id: app.id,
    jobId: app.jobId,
    jobTitle: extractJobTitle(app.jobSnapshot),
    status: app.status as ApplicationStatus,
    fitScore: app.fitScore,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }));

  let profileCompleteness: number | null = null;
  try {
    const profile = await fetchJson<{ profile: CandidateProfileResponse }>(`${env.gatewayUrl}/api/v1/profiles/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    profileCompleteness = profile.profile.profileCompleteness;
  } catch {
    profileCompleteness = null;
  }

  let topRecommendedJobs: RecommendedJobsResponse["jobs"] = [];
  try {
    const recommended = await fetchJson<RecommendedJobsResponse>(
      `${env.gatewayUrl}/api/v1/jobs/_candidate/recommended`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    topRecommendedJobs = recommended.jobs.filter((job) => job.isRecommended && !job.hasApplied).slice(0, 5);
  } catch {
    topRecommendedJobs = [];
  }

  return {
    totalApplications: apps.length,
    applicationsByStatus: PIPELINE_ORDER.filter((status) => (statusCounts.get(status) ?? 0) > 0).map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    })),
    pendingInterviews,
    profileCompleteness,
    recentApplications,
    topRecommendedJobs,
  };
}

export async function getRecruiterDashboard(
  companyId: string,
  accessToken: string,
): Promise<RecruiterDashboardResponse> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const apps = await prisma.application.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  const newApplicantsLast7Days = apps.filter((app) => app.createdAt >= sevenDaysAgo).length;
  const awaitingReviewCount = apps.filter((app) => app.status === "ANALYZED").length;
  const awaitingInterviewFeedbackCount = apps.filter((app) => app.status === "INTERVIEW_COMPLETED").length;

  const funnelCounts = new Map<ApplicationStatus, number>();
  for (const app of apps) {
    const status = app.status as ApplicationStatus;
    funnelCounts.set(status, (funnelCounts.get(status) ?? 0) + 1);
  }

  const pipelineFunnel = PIPELINE_ORDER.filter((status) => (funnelCounts.get(status) ?? 0) > 0).map((status) => ({
    status,
    label: PIPELINE_LABELS[status] ?? status,
    count: funnelCounts.get(status) ?? 0,
  }));

  const jobsResponse = await fetchJson<ListJobsResponse>(`${env.gatewayUrl}/api/v1/jobs/_recruiter/mine`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const openJobs = jobsResponse.jobs.filter((job) => job.status === "OPEN" && !job.isExpired);
  const expiringJobs = openJobs
    .filter((job): job is JobResponse & { expiresAt: string } => Boolean(job.expiresAt))
    .map((job) => ({
      id: job.id,
      title: job.title,
      expiresAt: job.expiresAt,
      daysRemaining: daysUntil(job.expiresAt),
    }))
    .filter((job) => job.daysRemaining >= 0 && job.daysRemaining <= 14)
    .sort((left, right) => left.daysRemaining - right.daysRemaining);

  return {
    openJobsCount: openJobs.length,
    newApplicantsLast7Days,
    awaitingReviewCount,
    awaitingInterviewFeedbackCount,
    pipelineFunnel,
    expiringJobs,
  };
}
