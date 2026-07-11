import { z } from "zod";

export type ApplicationStatus = "SUBMITTED" | "ANALYZING" | "ANALYZED";

export type ApplicationResponse = {
  id: string;
  jobId: string;
  companyId: string;
  candidateUserId: string;
  coverLetter: string | null;
  status: ApplicationStatus;

  fitScore: number | null;
  fitSummary: string | null;
  strengths: string[];
  concerns: string[];
  analyzedAt: string | null;

  createdAt: string;
  updatedAt: string;
};

export type ApplyToJobRequest = {
  jobId: string;
  coverLetter?: string | null;
};

export type CandidateApplicationListResponse = {
  applications: ApplicationResponse[];
};

export type RecruiterApplicationListResponse = {
  applications: ApplicationResponse[];
};

export type RecruiterApplicationPacketResponse = {
  application: ApplicationResponse;
  jobSnapshot: unknown;
  candidateSnapshot: unknown;
};

export const ApplyToJobRequestSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().trim().min(1).max(8000).optional().nullable(),
});

