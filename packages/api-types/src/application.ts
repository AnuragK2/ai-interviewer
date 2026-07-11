import { z } from "zod";

export type ApplicationStatus =
  | "SUBMITTED"
  | "ANALYZING"
  | "ANALYZED"
  | "INTERVIEW_INVITED"
  | "INTERVIEW_PENDING"
  | "INTERVIEW_IN_PROGRESS"
  | "INTERVIEW_COMPLETED"
  | "INTERVIEW_CANCELLED"
  | "SELECTED";

export type ApplicationResponse = {
  id: string;
  jobId: string;
  companyId: string;
  candidateUserId: string;
  candidateName: string | null;
  coverLetter: string | null;
  status: ApplicationStatus;

  fitScore: number | null;
  fitSummary: string | null;
  strengths: string[];
  concerns: string[];
  analyzedAt: string | null;

  interviewId: string | null;
  invitedAt: string | null;

  createdAt: string;
  updatedAt: string;
};

export type ApplicationListItem = ApplicationResponse & {
  jobTitle: string | null;
};

export type ApplyToJobRequest = {
  jobId: string;
  coverLetter?: string | null;
};

export type CandidateApplicationListResponse = {
  applications: ApplicationListItem[];
};

export type CandidateApplicationDetailResponse = {
  application: ApplicationResponse;
  jobTitle: string | null;
  canStartInterview: boolean;
};

export type InterviewAccessResponse = {
  application: ApplicationResponse;
  jobTitle: string | null;
  canStartInterview: boolean;
};

export type RecruiterApplicationListResponse = {
  applications: ApplicationResponse[];
};

export type RecruiterApplicationPacketResponse = {
  application: ApplicationResponse;
  jobSnapshot: unknown;
  candidateSnapshot: unknown;
};

export type RecruiterApplicationAction = "mark_reviewed" | "mark_pending" | "reject" | "select";

export type RecruiterApplicationDecisionRequest = {
  action: RecruiterApplicationAction;
};

export const RecruiterApplicationDecisionSchema = z.object({
  action: z.enum(["mark_reviewed", "mark_pending", "reject", "select"]),
});

export const ApplyToJobRequestSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().trim().min(1).max(8000).optional().nullable(),
});

export function canStartInterview(status: ApplicationStatus, interviewId: string | null): boolean {
  if (!interviewId) return false;
  return (
    status === "INTERVIEW_INVITED" ||
    status === "INTERVIEW_PENDING" ||
    status === "INTERVIEW_IN_PROGRESS"
  );
}
