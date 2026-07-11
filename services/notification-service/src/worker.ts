import type { ApplicationInvitedEvent, InterviewCompletedEvent } from "@ai-interviewer/api-types";
import { EventSubjects } from "@ai-interviewer/api-types";
import { closeEventBus, getEventBus } from "@ai-interviewer/event-bus";
import { createInterviewInviteNotification, createInterviewCompletedNotification } from "./application/notifications/notification.service";
import { env } from "./config/env";
import { prisma } from "./infrastructure/db/prisma.client";

export async function startNotificationWorker() {
  const bus = await getEventBus({ servers: env.natsUrl, name: env.serviceName });

  await bus.subscribe<ApplicationInvitedEvent>(EventSubjects.APPLICATION_INVITED, async (event) => {
    try {
      await createInterviewInviteNotification({
        userId: event.candidateUserId,
        applicationId: event.applicationId,
        interviewId: event.interviewId,
      });
      console.log(`[notification-service] invite notification created for application ${event.applicationId}`);
    } catch (error) {
      console.error(`[notification-service] failed to handle invite for ${event.applicationId}:`, error);
    }
  });

  console.log(`${env.serviceName} subscribed to ${EventSubjects.APPLICATION_INVITED}`);

  await bus.subscribe<InterviewCompletedEvent>(EventSubjects.INTERVIEW_COMPLETED, async (event) => {
    try {
      await createInterviewCompletedNotification({
        userId: event.candidateUserId,
        applicationId: event.applicationId,
        interviewId: event.interviewId,
        score: event.score,
      });
    } catch (error) {
      console.error(`[notification-service] failed to handle interview.completed for ${event.interviewId}:`, error);
    }
  });

  console.log(`${env.serviceName} subscribed to ${EventSubjects.INTERVIEW_COMPLETED}`);

  const shutdown = async () => {
    await closeEventBus();
    await prisma.$disconnect();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
