import type {
  InterviewCancelledEvent,
  InterviewCompletedEvent,
  InterviewStartedEvent,
} from "@ai-interviewer/api-types";
import { EventSubjects } from "@ai-interviewer/api-types";
import { closeEventBus, createPrismaIdempotencyStore, getEventBus } from "@ai-interviewer/event-bus";
import { syncApplicationStatusByInterviewId } from "../applications/application.service";
import { env } from "../../config/env";
import { prisma } from "../../infrastructure/db/prisma.client";

const CONSUMER_NAME = `${env.serviceName}-interview-lifecycle`;

export async function startApplicationEventWorker() {
  const bus = await getEventBus({ servers: env.natsUrl, name: `${env.serviceName}-events` });
  const idempotency = createPrismaIdempotencyStore(prisma, CONSUMER_NAME);

  await bus.subscribe<InterviewStartedEvent>(
    EventSubjects.INTERVIEW_STARTED,
    async (event) => {
      if (!event.applicationId && event.interviewId) {
        const app = await prisma.application.findFirst({ where: { interviewId: event.interviewId } });
        if (!app) return;
        await syncApplicationStatusByInterviewId(event.interviewId, "INTERVIEW_IN_PROGRESS");
        return;
      }

      if (event.applicationId) {
        const app = await prisma.application.findUnique({ where: { id: event.applicationId } });
        if (!app?.interviewId) return;
        await syncApplicationStatusByInterviewId(app.interviewId, "INTERVIEW_IN_PROGRESS");
      }
    },
    { consumerName: CONSUMER_NAME, idempotency },
  );

  await bus.subscribe<InterviewCompletedEvent>(
    EventSubjects.INTERVIEW_COMPLETED,
    async (event) => {
      await syncApplicationStatusByInterviewId(event.interviewId, "INTERVIEW_COMPLETED");
    },
    { consumerName: CONSUMER_NAME, idempotency },
  );

  await bus.subscribe<InterviewCancelledEvent>(
    EventSubjects.INTERVIEW_CANCELLED,
    async (event) => {
      await syncApplicationStatusByInterviewId(event.interviewId, "INTERVIEW_CANCELLED");
    },
    { consumerName: CONSUMER_NAME, idempotency },
  );

  console.log(`${env.serviceName} subscribed to interview lifecycle events (idempotent)`);

  const shutdown = async () => {
    await closeEventBus();
    await prisma.$disconnect();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
