import type {
  ApplicationResponse,
  ApplyToJobRequest,
  CandidateApplicationDetailResponse,
  CandidateApplicationListResponse,
  CreateInterviewFromApplicationResponse,
  InterviewAccessResponse,
  RecruiterApplicationAction,
  RecruiterApplicationListResponse,
} from "@ai-interviewer/api-types";
import { canStartInterview, createApplicationInvitedEvent, createPlatformEvent, EventSubjects } from "@ai-interviewer/api-types";
import { getEventBus } from "@ai-interviewer/event-bus";
import { recordTenantAudit } from "../audit/audit.service";
import { prisma } from "../../infrastructure/db/prisma.client";
import {
  assertRecruiterWritable,
  recordInterviewInviteUsage,
} from "../../infrastructure/billing/billing-client";
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

function extractCandidateName(candidateSnapshot: unknown): string | null {
  if (!candidateSnapshot || typeof candidateSnapshot !== "object") return null;

  const snapshot = candidateSnapshot as { name?: unknown; parsedResume?: { name?: unknown } };
  if (typeof snapshot.name === "string" && snapshot.name.trim()) return snapshot.name.trim();
  if (typeof snapshot.parsedResume?.name === "string" && snapshot.parsedResume.name.trim()) {
    return snapshot.parsedResume.name.trim();
  }

  return null;
}

function toApplicationResponse(
  app: {
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
    interviewId: string | null;
    invitedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  candidateSnapshot?: unknown,
): ApplicationResponse {
  return {
    id: app.id,
    jobId: app.jobId,
    companyId: app.companyId,
    candidateUserId: app.candidateUserId,
    candidateName: candidateSnapshot !== undefined ? extractCandidateName(candidateSnapshot) : null,
    coverLetter: app.coverLetter,
    status: app.status as ApplicationResponse["status"],
    fitScore: app.fitScore,
    fitSummary: app.fitSummary,
    strengths: app.strengths,
    concerns: app.concerns,
    analyzedAt: app.analyzedAt ? app.analyzedAt.toISOString() : null,
    interviewId: app.interviewId,
    invitedAt: app.invitedAt ? app.invitedAt.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

function extractJobTitle(jobSnapshot: unknown): string | null {
  if (!jobSnapshot || typeof jobSnapshot !== "object") return null;
  const title = (jobSnapshot as { title?: unknown }).title;
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

function toCandidateDetail(app: {
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
  interviewId: string | null;
  invitedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  jobSnapshot: unknown;
  candidateSnapshot: unknown;
}): CandidateApplicationDetailResponse {
  const application = toApplicationResponse(app, app.candidateSnapshot);
  return {
    application,
    jobTitle: extractJobTitle(app.jobSnapshot),
    canStartInterview: canStartInterview(application.status, application.interviewId),
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

  return toApplicationResponse(created, created.candidateSnapshot);
}

export async function listCandidateApplications(candidateUserId: string): Promise<CandidateApplicationListResponse> {
  const apps = await prisma.application.findMany({
    where: { candidateUserId },
    orderBy: { createdAt: "desc" },
  });

  return {
    applications: apps.map((app) => ({
      ...toApplicationResponse(app, app.candidateSnapshot),
      jobTitle: extractJobTitle(app.jobSnapshot),
    })),
  };
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

  return { applications: apps.map((app) => toApplicationResponse(app, app.candidateSnapshot)) };
}

export async function getRecruiterApplicationPacket(
  applicationId: string,
  ctx: { companyId: string; actorUserId: string; actorEmail?: string },
): Promise<{ application: ApplicationResponse; jobSnapshot: unknown; candidateSnapshot: unknown }> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!app || app.companyId !== ctx.companyId) {
    throw new ApplicationError("Application not found.", 404);
  }

  void recordTenantAudit({
    companyId: ctx.companyId,
    actorUserId: ctx.actorUserId,
    actorEmail: ctx.actorEmail ?? null,
    action: "application.packet.view",
    resourceType: "application",
    resourceId: applicationId,
    metadata: { jobId: app.jobId, status: app.status },
  }).catch((error) => console.error("[audit] packet view failed:", error));

  return {
    application: toApplicationResponse(app, app.candidateSnapshot),
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

  return toApplicationResponse(updated, updated.candidateSnapshot);
}

export async function getCandidateApplication(
  applicationId: string,
  candidateUserId: string,
): Promise<CandidateApplicationDetailResponse> {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.candidateUserId !== candidateUserId) {
    throw new ApplicationError("Application not found.", 404);
  }

  return toCandidateDetail(app);
}

export async function getInterviewAccess(
  interviewId: string,
  candidateUserId: string,
): Promise<InterviewAccessResponse> {
  const app = await prisma.application.findFirst({
    where: {
      interviewId,
      candidateUserId,
    },
  });

  if (!app) {
    throw new ApplicationError("Interview access not found.", 404);
  }

  const detail = toCandidateDetail(app);
  return {
    application: detail.application,
    jobTitle: detail.jobTitle,
    canStartInterview: detail.canStartInterview,
  };
}

export async function inviteToInterview(
  applicationId: string,
  ctx: { companyId: string; actorUserId: string; actorEmail?: string },
): Promise<ApplicationResponse> {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.companyId !== ctx.companyId) {
    throw new ApplicationError("Application not found.", 404);
  }

  if (app.status !== "ANALYZED") {
    throw new ApplicationError("Application must be analyzed before inviting to interview.", 400);
  }

  if (app.interviewId) {
    throw new ApplicationError("This application has already been invited to interview.", 409);
  }

  await assertRecruiterWritable(ctx.companyId, undefined, "invite");

  const interviewResponse = await fetchJson<CreateInterviewFromApplicationResponse>(
    `${env.interviewServiceUrl}/api/v1/interviews/from-application`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: app.id,
        jobSnapshot: app.jobSnapshot,
        candidateSnapshot: app.candidateSnapshot,
        fitScore: app.fitScore,
        fitSummary: app.fitSummary,
        strengths: app.strengths,
        concerns: app.concerns,
      }),
    },
  );

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "INTERVIEW_INVITED",
      interviewId: interviewResponse.interview.id,
      invitedAt: new Date(),
    },
  });

  await recordInterviewInviteUsage(ctx.companyId);

  const bus = await getEventBus({ servers: env.natsUrl, name: env.serviceName });
  await bus.publish(
    EventSubjects.APPLICATION_INVITED,
    createApplicationInvitedEvent({
      correlationId: updated.id,
      tenantId: updated.companyId,
      applicationId: updated.id,
      interviewId: updated.interviewId!,
      candidateUserId: updated.candidateUserId,
    }),
  );

  void recordTenantAudit({
    companyId: ctx.companyId,
    actorUserId: ctx.actorUserId,
    actorEmail: ctx.actorEmail ?? null,
    action: "application.invite",
    resourceType: "application",
    resourceId: updated.id,
    metadata: { interviewId: updated.interviewId, jobId: updated.jobId },
  }).catch((error) => console.error("[audit] invite failed:", error));

  return toApplicationResponse(updated, updated.candidateSnapshot);
}

export async function markInterviewPending(applicationId: string, candidateUserId: string): Promise<ApplicationResponse> {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.candidateUserId !== candidateUserId) {
    throw new ApplicationError("Application not found.", 404);
  }

  if (app.status !== "INTERVIEW_INVITED") {
    throw new ApplicationError("Interview is not ready to start.", 400);
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: "INTERVIEW_PENDING" },
  });

  return toApplicationResponse(updated, updated.candidateSnapshot);
}

export async function updateRecruiterApplicationDecision(
  applicationId: string,
  action: RecruiterApplicationAction,
  ctx: { companyId: string; actorUserId: string; actorEmail?: string },
): Promise<ApplicationResponse> {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.companyId !== ctx.companyId) {
    throw new ApplicationError("Application not found.", 404);
  }

  await assertRecruiterWritable(ctx.companyId, undefined, "write");

  let nextStatus = app.status;

  switch (action) {
    case "reject":
      if (app.status === "INTERVIEW_IN_PROGRESS") {
        throw new ApplicationError("Cannot reject a candidate while their interview is in progress.", 400);
      }
      if (app.status === "INTERVIEW_CANCELLED") {
        return toApplicationResponse(app, app.candidateSnapshot);
      }
      nextStatus = "INTERVIEW_CANCELLED";
      break;
    case "mark_reviewed":
      if (app.status === "SUBMITTED" || app.status === "ANALYZING") {
        if (app.fitScore === null) {
          throw new ApplicationError("Fit analysis is not ready yet.", 400);
        }
        nextStatus = "ANALYZED";
      } else if (app.status === "ANALYZED") {
        return toApplicationResponse(app, app.candidateSnapshot);
      } else {
        throw new ApplicationError("This application has already moved past review.", 400);
      }
      break;
    case "mark_pending":
      if (app.status === "INTERVIEW_CANCELLED" || app.status === "SELECTED") {
        throw new ApplicationError("This application cannot be marked as pending.", 400);
      }
      if (app.status === "INTERVIEW_IN_PROGRESS" || app.status === "INTERVIEW_COMPLETED") {
        throw new ApplicationError("Interview-stage applications cannot be marked as pending.", 400);
      }
      if (app.status === "INTERVIEW_INVITED" || app.status === "INTERVIEW_PENDING") {
        throw new ApplicationError("Withdraw the interview invite before marking as pending.", 400);
      }
      if (app.status === "ANALYZED") {
        return toApplicationResponse(app, app.candidateSnapshot);
      }
      nextStatus = "ANALYZING";
      break;
    case "select":
      if (app.status !== "INTERVIEW_COMPLETED") {
        throw new ApplicationError("Select candidate only after the interview is completed.", 400);
      }
      nextStatus = "SELECTED";
      break;
    default:
      throw new ApplicationError("Unsupported recruiter action.", 400);
  }

  const updated =
    nextStatus === app.status
      ? app
      : await prisma.application.update({
          where: { id: applicationId },
          data: { status: nextStatus },
        });

  void recordTenantAudit({
    companyId: ctx.companyId,
    actorUserId: ctx.actorUserId,
    actorEmail: ctx.actorEmail ?? null,
    action: `application.${action}`,
    resourceType: "application",
    resourceId: updated.id,
    metadata: { previousStatus: app.status, nextStatus: updated.status, jobId: updated.jobId },
  }).catch((error) => console.error("[audit] decision failed:", error));

  return toApplicationResponse(updated, updated.candidateSnapshot);
}

export async function getRecruiterApplicationResumeDownload(
  applicationId: string,
  ctx: { companyId: string; actorUserId: string; actorEmail?: string },
): Promise<{ url: string; fileName: string }> {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.companyId !== ctx.companyId) {
    throw new ApplicationError("Application not found.", 404);
  }

  const download = await fetchJson<{ url: string; fileName: string }>(
    `${env.profileServiceUrl}/api/v1/internal/candidates/${app.candidateUserId}/resume/download`,
    {
      headers: {
        "x-internal-service-key": env.internalServiceKey,
      },
    },
  );

  void recordTenantAudit({
    companyId: ctx.companyId,
    actorUserId: ctx.actorUserId,
    actorEmail: ctx.actorEmail ?? null,
    action: "application.resume.download",
    resourceType: "application",
    resourceId: app.id,
    metadata: { candidateUserId: app.candidateUserId, jobId: app.jobId },
  }).catch((error) => console.error("[audit] resume download failed:", error));

  return download;
}

export async function syncApplicationStatusByInterviewId(
  interviewId: string,
  status: ApplicationResponse["status"],
): Promise<void> {
  const app = await prisma.application.findFirst({ where: { interviewId } });
  if (!app) return;

  await prisma.application.update({
    where: { id: app.id },
    data: { status },
  });
}

