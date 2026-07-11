import type { ApplicationStatus } from "@ai-interviewer/api-types";

const PIPELINE_STEPS: { status: ApplicationStatus; label: string }[] = [
  { status: "SUBMITTED", label: "Applied" },
  { status: "ANALYZING", label: "Analyzing" },
  { status: "ANALYZED", label: "Analyzed" },
  { status: "INTERVIEW_INVITED", label: "Invited" },
  { status: "INTERVIEW_PENDING", label: "Ready" },
  { status: "INTERVIEW_IN_PROGRESS", label: "In progress" },
  { status: "INTERVIEW_COMPLETED", label: "Completed" },
];

const STATUS_ORDER: ApplicationStatus[] = PIPELINE_STEPS.map((step) => step.status);

function stepIndex(status: ApplicationStatus): number {
  const index = STATUS_ORDER.indexOf(status);
  if (index >= 0) return index;
  if (status === "INTERVIEW_CANCELLED") return STATUS_ORDER.indexOf("INTERVIEW_IN_PROGRESS");
  return 0;
}

type ApplicationPipelineProps = {
  status: ApplicationStatus;
};

export function ApplicationPipeline({ status }: ApplicationPipelineProps) {
  const currentIndex = stepIndex(status);

  return (
    <ol className="grid gap-3 sm:grid-cols-7">
      {PIPELINE_STEPS.map((step, index) => {
        const complete = index < currentIndex || (status === "INTERVIEW_COMPLETED" && index <= currentIndex);
        const active = index === currentIndex;

        return (
          <li
            key={step.status}
            className={`rounded-lg border px-3 py-2 text-center text-xs ${
              complete
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : active
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                  : "border-white/10 bg-white/5 text-muted-foreground"
            }`}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
