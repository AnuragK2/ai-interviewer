import type { NotificationListResponse, NotificationResponse } from "@ai-interviewer/api-types";
import { env } from "../../config/env";
import { prisma } from "../../infrastructure/db/prisma.client";

function toNotificationResponse(notification: {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationResponse {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    linkUrl: notification.linkUrl,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function listNotificationsForUser(userId: string): Promise<NotificationListResponse> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { notifications: notifications.map(toNotificationResponse) };
}

export async function createInterviewInviteNotification(input: {
  userId: string;
  applicationId: string;
  interviewId: string;
  recipientEmail?: string;
}) {
  const linkUrl = `${env.frontendUrl}/candidate/applications/${input.applicationId}`;
  const title = "You’ve been invited to interview";
  const body = `A recruiter invited you to complete an AI interview. Open your application analytics to start when you’re ready.`;

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: "interview.invited",
      title,
      body,
      linkUrl,
    },
  });

  await sendInviteEmail({
    to: input.recipientEmail,
    subject: title,
    html: `<p>${body}</p><p><a href="${linkUrl}">View application and start interview</a></p>`,
    text: `${body}\n\n${linkUrl}`,
  });

  return toNotificationResponse(notification);
}

async function sendInviteEmail(input: { to?: string; subject: string; html: string; text: string }) {
  if (!input.to) {
    console.log(`[notification-service] email skipped (no recipient): ${input.subject}`);
    return;
  }

  if (!env.resendApiKey) {
    console.log(`[notification-service] email (dev log) to=${input.to} subject=${input.subject}`);
    console.log(input.text);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[notification-service] email failed (${response.status}): ${text}`);
  }
}
