import { z } from "zod";

export type CreateInterviewFromApplicationRequest = {
  applicationId: string;
  jobSnapshot: unknown;
  candidateSnapshot: unknown;
  fitScore?: number | null;
  fitSummary?: string | null;
  strengths?: string[];
  concerns?: string[];
};

export type CreateInterviewFromApplicationResponse = {
  interview: {
    id: string;
    status: string;
    applicationId: string;
    createdAt: string;
  };
};

export const CreateInterviewFromApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  jobSnapshot: z.unknown(),
  candidateSnapshot: z.unknown(),
  fitScore: z.number().int().min(0).max(100).optional().nullable(),
  fitSummary: z.string().trim().optional().nullable(),
  strengths: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
});

export type NotificationResponse = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: NotificationResponse[];
};
