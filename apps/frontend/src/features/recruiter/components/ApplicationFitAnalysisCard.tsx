import type { ApplicationResponse } from "@ai-interviewer/api-types";
import type { ReactNode } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import {
  getApplicationPipelineLabel,
  getApplicationStatusBadgeClasses,
} from "@/features/applications/lib/application-status-labels";

type ApplicationFitAnalysisCardProps = {
  application: ApplicationResponse;
};

function MetricTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 min-w-0">{children}</div>
    </div>
  );
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-300";
  if (score >= 60) return "text-indigo-200";
  if (score >= 40) return "text-amber-200";
  return "text-muted-foreground";
}

export function ApplicationFitAnalysisCard({ application }: ApplicationFitAnalysisCardProps) {
  const interviewStageLabel = application.interviewId
    ? application.status === "SELECTED"
      ? "Selected for role"
      : application.status === "INTERVIEW_COMPLETED"
      ? "Interview completed"
      : application.status === "INTERVIEW_CANCELLED"
        ? "Interview closed"
        : application.status === "INTERVIEW_IN_PROGRESS"
          ? "Interview in progress"
          : application.status === "INTERVIEW_PENDING"
            ? "Ready for interview"
            : "Interview invited"
    : "Not invited";

  return (
    <GlowingCard className="h-full">
      <CardHeader>
        <CardTitle>AI fit analysis</CardTitle>
        <CardDescription>Automated screening produced after the candidate applied.</CardDescription>
      </CardHeader>
      <CardContent className="@container space-y-6">
        <div className="grid grid-cols-1 gap-3 @[28rem]:grid-cols-3">
          <MetricTile label="Status">
            <span
              title={getApplicationPipelineLabel(application.status)}
              className={`inline-flex max-w-full items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none ${getApplicationStatusBadgeClasses(application.status)}`}
            >
              <span className="truncate">{getApplicationPipelineLabel(application.status)}</span>
            </span>
          </MetricTile>

          <MetricTile label="Fit score">
            {application.fitScore !== null ? (
              <div className="flex items-baseline gap-1 whitespace-nowrap tabular-nums">
                <span className={`text-2xl font-semibold leading-none ${scoreTone(application.fitScore)}`}>
                  {application.fitScore}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
            )}
          </MetricTile>

          <MetricTile label="Interview stage">
            <p className="text-sm font-medium leading-snug break-words">{interviewStageLabel}</p>
          </MetricTile>
        </div>

        {application.fitSummary ? (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
            <p className="text-sm leading-relaxed">{application.fitSummary}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Fit summary will appear once analysis completes.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-200/80">Strengths</p>
            {application.strengths.length ? (
              <ul className="space-y-2 text-sm leading-relaxed">
                {application.strengths.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No strengths listed yet.</p>
            )}
          </div>
          <div className="space-y-2 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">Concerns</p>
            {application.concerns.length ? (
              <ul className="space-y-2 text-sm leading-relaxed">
                {application.concerns.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No concerns listed yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </GlowingCard>
  );
}
