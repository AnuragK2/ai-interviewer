import type { ApplicationStatus } from "@ai-interviewer/api-types";
import { getApplicationPipelineLabel } from "@/features/applications/lib/application-status-labels";

const PIPELINE_STEPS: ApplicationStatus[] = [
  "SUBMITTED",
  "ANALYZING",
  "ANALYZED",
  "INTERVIEW_INVITED",
  "INTERVIEW_PENDING",
  "INTERVIEW_IN_PROGRESS",
  "INTERVIEW_COMPLETED",
];

function stepIndex(status: ApplicationStatus): number {
  const index = PIPELINE_STEPS.indexOf(status);
  if (index >= 0) return index;
  if (status === "INTERVIEW_CANCELLED") return PIPELINE_STEPS.indexOf("INTERVIEW_IN_PROGRESS");
  return 0;
}

type ApplicationPipelineProps = {
  status: ApplicationStatus;
};

export function ApplicationPipeline({ status }: ApplicationPipelineProps) {
  if (status === "INTERVIEW_CANCELLED") {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          This application is closed and is no longer moving forward.
        </p>
        <ol className="grid gap-3 sm:grid-cols-7">
          {PIPELINE_STEPS.map((step) => (
            <li
              key={step}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-muted-foreground"
            >
              {getApplicationPipelineLabel(step)}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const currentIndex = stepIndex(status);

  return (
    <ol className="grid gap-3 sm:grid-cols-7">
      {PIPELINE_STEPS.map((step, index) => {
        const complete = index < currentIndex || (status === "INTERVIEW_COMPLETED" && index <= currentIndex);
        const active = index === currentIndex;

        return (
          <li
            key={step}
            className={`rounded-lg border px-3 py-2 text-center text-xs ${
              complete
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : active
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                  : "border-white/10 bg-white/5 text-muted-foreground"
            }`}
          >
            {getApplicationPipelineLabel(step)}
          </li>
        );
      })}
    </ol>
  );
}
