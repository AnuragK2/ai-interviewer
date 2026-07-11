import type { ApplicationStatus } from "./application";
import type { RecommendedJobResponse } from "./job";

export type ApplicationStatusCount = {
  status: ApplicationStatus;
  count: number;
};

export type CandidateDashboardApplicationSummary = {
  id: string;
  jobId: string;
  jobTitle: string | null;
  status: ApplicationStatus;
  fitScore: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateDashboardResponse = {
  totalApplications: number;
  applicationsByStatus: ApplicationStatusCount[];
  pendingInterviews: number;
  profileCompleteness: number | null;
  recentApplications: CandidateDashboardApplicationSummary[];
  topRecommendedJobs: RecommendedJobResponse[];
};

export type RecruiterDashboardApplicationSummary = {
  id: string;
  jobId: string;
  jobTitle: string | null;
  candidateName: string | null;
  status: ApplicationStatus;
  fitScore: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RecruiterPipelineStage = {
  status: string;
  label: string;
  count: number;
};

export type RecruiterExpiringJobAlert = {
  id: string;
  title: string;
  expiresAt: string;
  daysRemaining: number;
};

export type RecruiterDashboardResponse = {
  openJobsCount: number;
  newApplicantsLast7Days: number;
  awaitingReviewCount: number;
  awaitingInterviewFeedbackCount: number;
  applicationsByStatus: ApplicationStatusCount[];
  recentApplications: RecruiterDashboardApplicationSummary[];
  pipelineFunnel: RecruiterPipelineStage[];
  expiringJobs: RecruiterExpiringJobAlert[];
};
