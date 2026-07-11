import { z } from "zod";

export type InterviewSummary = {
  id: string;
  status: string;
  score: number;
  createdAt: string;
};

export type InterviewResultMessage = {
  id: string;
  participant: "User" | "Assistant";
  message: string;
  createdAt: string;
};

export type InterviewResultsResponse = {
  interview: InterviewSummary & { updatedAt: string };
  candidate: {
    name: string | null;
    githubUsername: string | null;
  };
  stats: {
    userMessages: number;
    assistantMessages: number;
    durationMinutes: number;
  };
  messages: InterviewResultMessage[];
};

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

export type InterviewReportDimensions = {
  communication: number;
  technicalDepth: number;
  roleFit: number;
  clarity: number;
};

export type InterviewReportResponse = {
  narrative: string;
  recommendation: string;
  strengths: string[];
  gaps: string[];
  dimensions: InterviewReportDimensions;
  generatedAt: string;
};

export type InterviewMediaAssetResponse = {
  id: string;
  type: "SNAPSHOT" | "RECORDING";
  mimeType: string;
  signal: string | null;
  capturedAt: string;
  url: string;
};

export type InterviewFeedbackResponse = {
  interview: {
    id: string;
    status: string;
    score: number;
    endReason: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
    applicationId: string | null;
  };
  results: InterviewResultsResponse | null;
  report: InterviewReportResponse | null;
  media: InterviewMediaAssetResponse[];
};
