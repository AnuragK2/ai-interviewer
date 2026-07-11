import type { ApplicationStatus } from "@ai-interviewer/api-types";

export type ApplicationStatusFilter = "ALL" | "PENDING" | "REVIEWED" | "REJECTED" | "ACCEPTED";

export const applicationStatusFilterOptions: Array<{
  value: ApplicationStatusFilter;
  label: string;
  description: string;
}> = [
  { value: "ALL", label: "All", description: "Every application" },
  { value: "PENDING", label: "Pending", description: "Submitted and awaiting analysis" },
  { value: "REVIEWED", label: "Reviewed", description: "Fit analysis completed" },
  { value: "REJECTED", label: "Rejected", description: "Closed or not moving forward" },
  { value: "ACCEPTED", label: "Accepted", description: "Invited or progressing in interviews" },
];

const pendingStatuses = new Set<ApplicationStatus>(["SUBMITTED", "ANALYZING"]);
const reviewedStatuses = new Set<ApplicationStatus>(["ANALYZED"]);
const rejectedStatuses = new Set<ApplicationStatus>(["INTERVIEW_CANCELLED"]);
const acceptedStatuses = new Set<ApplicationStatus>([
  "INTERVIEW_INVITED",
  "INTERVIEW_PENDING",
  "INTERVIEW_IN_PROGRESS",
  "INTERVIEW_COMPLETED",
  "SELECTED",
]);

export function matchesApplicationStatusFilter(status: ApplicationStatus, filter: ApplicationStatusFilter) {
  switch (filter) {
    case "PENDING":
      return pendingStatuses.has(status);
    case "REVIEWED":
      return reviewedStatuses.has(status);
    case "REJECTED":
      return rejectedStatuses.has(status);
    case "ACCEPTED":
      return acceptedStatuses.has(status);
    case "ALL":
    default:
      return true;
  }
}

export function countApplicationsByFilter(
  statuses: ApplicationStatus[],
  filter: ApplicationStatusFilter,
) {
  return statuses.filter((status) => matchesApplicationStatusFilter(status, filter)).length;
}
