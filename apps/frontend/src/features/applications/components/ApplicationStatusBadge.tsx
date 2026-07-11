import type { ApplicationStatus } from "@ai-interviewer/api-types";
import {
  getApplicationStatusBadgeClasses,
  getApplicationStatusLabel,
} from "@/features/applications/lib/application-status-labels";

type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
};

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${getApplicationStatusBadgeClasses(status)}`}>
      {getApplicationStatusLabel(status)}
    </span>
  );
}
