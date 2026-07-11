import type { JobStatus } from "@ai-interviewer/api-types";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
};

export function getJobStatusLabel(status: JobStatus | string | null | undefined) {
  if (!status) return "Unknown";
  return JOB_STATUS_LABELS[status as JobStatus] ?? status;
}
