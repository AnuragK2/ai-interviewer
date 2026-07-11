import type {
  ApplicationResponse,
  ApplyToJobRequest,
  CandidateApplicationListResponse,
  RecruiterApplicationListResponse,
} from "@ai-interviewer/api-types";
import { createPlatformEvent, EventSubjects } from "@ai-interviewer/api-types";
import { getEventBus } from "@ai-interviewer/event-bus";
import { prisma } from "../../infrastructure/db/prisma.client";
import { env } from "../../config/env";

export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new ApplicationError(`Upstream request failed (${res.status}): ${text}`, 502);
  }
  return (await res.json()) as T;
}

function toApplicationResponse(app: {
  id: string;
  jobId: string;
  companyId: string;
  candidateUserId: string;
  coverLetter: string | null;
  status: string;
  fitScore: number | null;
  fitSummary: string | null;
  strengths: string[];
  concerns: string[];
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ApplicationResponse {
  return {
    id: app.id,
    jobId: app.jobId,
    companyId: app.companyId,
    candidateUserId: app.candidateUserId,
    coverLetter: app.coverLetter,
    status: app.status as ApplicationResponse["status"],
    fitScore: app.fitScore,
    fitSummary: app.fitSummary,
    strengths: app.strengths,
    concerns: app.concerns,
    analyzedAt: app.analyzedAt ? app.analyzedAt.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export async function applyToJob(
  input: ApplyToJobRequest,
  ctx: { candidateUserId: string; accessToken: string },
): Promise<ApplicationResponse> {
  // Snapshot job (public endpoint)
  const jobResponse = await fetchJson<{ job: unknown }>(`${env.gatewayUrl}/api/v1/jobs/${input.jobId}`);

  // Snapshot candidate profile (candidate-scoped endpoint, must forward auth)
  const profileResponse = await fetchJson<{ profile: unknown }>(`${env.gatewayUrl}/api/v1/profiles/me`, {
    headers: {
      Authorization: `Bearer ${ctx.accessToken}`,
    },
  });

  // Attempt to discover companyId from job response
  const jobAny = jobResponse.job as any;
  const companyId = typeof jobAny?.companyId === "string" ? jobAny.companyId : null;
  if (!companyId) {
    throw new ApplicationError("Job is missing company context.", 400);
  }

  const existing = await prisma.application.findUnique({
    where: {
      jobId_candidateUserId: {
        jobId: input.jobId,
        candidateUserId: ctx.candidateUserId,
      },
    },
  });

  if (existing) {
    throw new ApplicationError("You have already applied to this job.", 409);
  }

  const created = await prisma.application.create({
    data: {
      jobId: input.jobId,
      companyId,
      candidateUserId: ctx.candidateUserId,
      coverLetter: input.coverLetter?.trim() || null,
      status: "ANALYZING",
      jobSnapshot: jobResponse.job as any,
      candidateSnapshot: profileResponse.profile as any,
    },
  });

  const bus = await getEventBus({ servers: env.natsUrl, name: env.serviceName });
  await bus.publish(
    EventSubjects.APPLICATION_CREATED,
    createPlatformEvent<"application.created">({
      type: "application.created",
      correlationId: created.id,
      tenantId: created.companyId,
      applicationId: created.id,
      jobId: created.jobId,
      candidateUserId: created.candidateUserId,
    }),
  );

  return toApplicationResponse(created);
}

export async function listCandidateApplications(candidateUserId: string): Promise<CandidateApplicationListResponse> {
  const apps = await prisma.application.findMany({
    where: { candidateUserId },
    orderBy: { createdAt: "desc" },
  });

  return { applications: apps.map(toApplicationResponse) };
}

export async function listRecruiterApplicationsForJob(
  jobId: string,
  ctx: { companyId: string },
): Promise<RecruiterApplicationListResponse> {
  const apps = await prisma.application.findMany({
    where: {
      jobId,
      companyId: ctx.companyId,
    },
    orderBy: { createdAt: "desc" },
  });

  return { applications: apps.map(toApplicationResponse) };
}

export async function getRecruiterApplicationPacket(
  applicationId: string,
  ctx: { companyId: string },
): Promise<{ application: ApplicationResponse; jobSnapshot: unknown; candidateSnapshot: unknown }> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!app || app.companyId !== ctx.companyId) {
    throw new ApplicationError("Application not found.", 404);
  }

  return {
    application: toApplicationResponse(app),
    jobSnapshot: app.jobSnapshot as any,
    candidateSnapshot: app.candidateSnapshot as any,
  };
}

export async function setAnalysis(
  applicationId: string,
  input: { fitScore: number; fitSummary: string; strengths: string[]; concerns: string[] },
): Promise<ApplicationResponse> {
  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "ANALYZED",
      fitScore: input.fitScore,
      fitSummary: input.fitSummary,
      strengths: input.strengths,
      concerns: input.concerns,
      analyzedAt: new Date(),
    },
  });

  return toApplicationResponse(updated);
}

