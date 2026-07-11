import type { ApplicationStatus } from "@ai-interviewer/api-types";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Application submitted",
  ANALYZING: "Under review",
  ANALYZED: "Review complete",
  INTERVIEW_INVITED: "Interview invited",
  INTERVIEW_PENDING: "Ready for interview",
  INTERVIEW_IN_PROGRESS: "Interview in progress",
  INTERVIEW_COMPLETED: "Interview complete",
  INTERVIEW_CANCELLED: "Closed",
  SELECTED: "Selected",
};

export const APPLICATION_PIPELINE_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Applied",
  ANALYZING: "Under review",
  ANALYZED: "Reviewed",
  INTERVIEW_INVITED: "Invited",
  INTERVIEW_PENDING: "Ready",
  INTERVIEW_IN_PROGRESS: "Interviewing",
  INTERVIEW_COMPLETED: "Complete",
  INTERVIEW_CANCELLED: "Closed",
  SELECTED: "Selected",
};

export function getApplicationStatusLabel(status: ApplicationStatus) {
  return APPLICATION_STATUS_LABELS[status] ?? "In progress";
}

export function getApplicationPipelineLabel(status: ApplicationStatus) {
  return APPLICATION_PIPELINE_LABELS[status] ?? getApplicationStatusLabel(status);
}

export function getApplicationStatusBadgeClasses(status: ApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-slate-500/30 bg-slate-500/10 text-slate-200";
    case "ANALYZED":
    case "INTERVIEW_COMPLETED":
    case "SELECTED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "ANALYZING":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
    case "INTERVIEW_INVITED":
    case "INTERVIEW_PENDING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "INTERVIEW_IN_PROGRESS":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "INTERVIEW_CANCELLED":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    default:
      return "border-border bg-muted/20 text-muted-foreground";
  }
}
