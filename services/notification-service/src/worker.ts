import type { ApplicationInvitedEvent, InterviewCompletedEvent } from "@ai-interviewer/api-types";
import { EventSubjects } from "@ai-interviewer/api-types";
import { closeEventBus, createPrismaIdempotencyStore, getEventBus } from "@ai-interviewer/event-bus";
import { createInterviewInviteNotification, createInterviewCompletedNotification } from "./application/notifications/notification.service";
import { env } from "./config/env";
import { prisma } from "./infrastructure/db/prisma.client";

const INVITE_CONSUMER = `${env.serviceName}-application-invited`;
const COMPLETED_CONSUMER = `${env.serviceName}-interview-completed`;

export async function startNotificationWorker() {
  const bus = await getEventBus({ servers: env.natsUrl, name: env.serviceName });

  await bus.subscribe<ApplicationInvitedEvent>(
    EventSubjects.APPLICATION_INVITED,
    async (event) => {
      await createInterviewInviteNotification({
        userId: event.candidateUserId,
        applicationId: event.applicationId,
        interviewId: event.interviewId,
      });
      console.log(`[notification-service] invite notification created for application ${event.applicationId}`);
    },
    {
      consumerName: INVITE_CONSUMER,
      idempotency: createPrismaIdempotencyStore(prisma, INVITE_CONSUMER),
    },
  );

  console.log(`${env.serviceName} subscribed to ${EventSubjects.APPLICATION_INVITED}`);

  await bus.subscribe<InterviewCompletedEvent>(
    EventSubjects.INTERVIEW_COMPLETED,
    async (event) => {
      await createInterviewCompletedNotification({
        userId: event.candidateUserId,
        applicationId: event.applicationId,
        interviewId: event.interviewId,
        score: event.score,
      });
    },
    {
      consumerName: COMPLETED_CONSUMER,
      idempotency: createPrismaIdempotencyStore(prisma, COMPLETED_CONSUMER),
    },
  );

  console.log(`${env.serviceName} subscribed to ${EventSubjects.INTERVIEW_COMPLETED}`);

  const shutdown = async () => {
    await closeEventBus();
    await prisma.$disconnect();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
