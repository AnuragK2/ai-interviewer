import type { InterviewFeedbackResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/shared/components/loading";
import { Link } from "react-router";

type PostInterviewFeedbackCardProps = {
  feedback: InterviewFeedbackResponse;
  interviewId: string;
};

function recommendationLabel(value: string) {
  switch (value) {
    case "STRONG_YES":
      return "Strong match";
    case "YES":
      return "Good match";
    case "REVIEW":
      return "Needs review";
    case "NO":
      return "Limited match";
    default:
      return value;
  }
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function PostInterviewFeedbackCard({ feedback, interviewId }: PostInterviewFeedbackCardProps) {
  const report = feedback.report;
  const recording = feedback.media.find((asset) => asset.type === "RECORDING");

  if (!report && !feedback.results) {
    return (
      <GlowingCard>
        <div className="flex items-center gap-3 p-4" role="status" aria-live="polite">
          <Spinner size="sm" />
          <p className="text-sm text-muted-foreground">Interview feedback is still being generated…</p>
        </div>
      </GlowingCard>
    );
  }

  return (
    <GlowingCard>
      <div className="space-y-5 p-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Post-interview feedback</p>
            <p className="text-xs text-muted-foreground">
              Score {feedback.interview.score}/100 · {recommendationLabel(report?.recommendation ?? "REVIEW")}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
            <Link to={`/results/${interviewId}`}>Full transcript</Link>
          </Button>
        </div>

        {report ? (
          <>
            <p className="text-sm leading-relaxed text-foreground/90">{report.narrative}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(report.dimensions).map(([label, value]) => (
                <DimensionBar
                  key={label}
                  label={label.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}
                  value={value}
                />
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Strengths</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {report.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gaps</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {report.gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : null}

        {recording ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Session recording</p>
            <video controls className="w-full rounded-xl border border-white/10 bg-black/40" src={recording.url}>
              <track kind="captions" />
            </video>
          </div>
        ) : null}
      </div>
    </GlowingCard>
  );
}
