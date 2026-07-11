import { EventSubjects, createPlatformEvent, type ApplicationCreatedEvent } from "@ai-interviewer/api-types";
import { closeEventBus, getEventBus } from "@ai-interviewer/event-bus";
import { prisma } from "./infrastructure/db/prisma.client";
import { env } from "./config/env";
import { analyzeFit } from "./application/matching/match-analyzer";

async function analyzeApplication(applicationId: string) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) {
    console.warn(`[matching-service] application ${applicationId} not found`);
    return;
  }

  if (app.status === "ANALYZED") return;

  const result = analyzeFit(app.jobSnapshot as unknown, app.candidateSnapshot as unknown, {
    coverLetter: app.coverLetter,
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "ANALYZED",
      fitScore: result.fitScore,
      fitSummary: result.fitSummary,
      strengths: result.strengths,
      concerns: result.concerns,
      analyzedAt: new Date(),
    },
  });

  const bus = await getEventBus({ servers: env.natsUrl, name: env.serviceName });
  await bus.publish(
    EventSubjects.PROFILE_ANALYZED,
    createPlatformEvent<"profile.analyzed">({
      type: "profile.analyzed",
      correlationId: applicationId,
      applicationId,
      fitScore: result.fitScore,
      tenantId: app.companyId,
    }),
  );

  console.log(`[matching-service] analyzed application ${applicationId} (fitScore=${result.fitScore})`);
}

async function catchUpPendingApplications() {
  const pending = await prisma.application.findMany({
    where: { status: "ANALYZING" },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) return;

  console.log(`[matching-service] catching up on ${pending.length} pending application(s)`);
  for (const app of pending) {
    try {
      await analyzeApplication(app.id);
    } catch (error) {
      console.error(`[matching-service] catch-up failed for ${app.id}:`, error);
    }
  }
}

export async function startWorker() {
  const bus = await getEventBus({ servers: env.natsUrl, name: env.serviceName });
  await bus.subscribe<ApplicationCreatedEvent>(EventSubjects.APPLICATION_CREATED, async (event) => {
    try {
      await analyzeApplication(event.applicationId);
    } catch (error) {
      console.error(`[matching-service] handler failed for ${event.applicationId}:`, error);
    }
  });

  await catchUpPendingApplications();

  console.log(`${env.serviceName} subscribed to ${EventSubjects.APPLICATION_CREATED}`);

  const shutdown = async () => {
    await closeEventBus();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

