import type { ApplicationResponse } from "@ai-interviewer/api-types";
import { Spinner } from "@/shared/components/loading";

type ApplicationAnalysisCardProps = {
  application: ApplicationResponse;
};

export function ApplicationAnalysisCard({ application }: ApplicationAnalysisCardProps) {
  if (application.status === "ANALYZING" || application.fitScore === null) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-sm text-yellow-200" role="status" aria-live="polite">
        <Spinner size="sm" className="text-yellow-200" />
        Analysis in progress… This usually completes within a few seconds.
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-muted/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Fit analysis</p>
          <p className="text-xs text-muted-foreground">
            {application.analyzedAt ? `Completed ${application.analyzedAt.slice(0, 10)}` : "Completed"}
          </p>
        </div>
        <p className="text-2xl font-semibold">
          {application.fitScore}
          <span className="text-sm font-normal text-muted-foreground">/100</span>
        </p>
      </div>

      {application.fitSummary ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Summary</p>
          <p className="text-sm leading-relaxed">{application.fitSummary}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Strengths</p>
          {application.strengths.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {application.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Areas to improve</p>
          {application.concerns.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {application.concerns.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
