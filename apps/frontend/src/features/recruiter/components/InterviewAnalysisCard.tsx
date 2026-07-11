import type { InterviewFeedbackResponse } from "@ai-interviewer/api-types";
import { PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { CardLoader } from "@/shared/components/loading";
import { InterviewScoreHighlight } from "@/features/recruiter/components/InterviewScoreHighlight";
import { cn } from "@/shared/lib/utils";

type InterviewAnalysisCardProps = {
  interviewId: string | null;
  feedback: InterviewFeedbackResponse | null;
  loading: boolean;
  error: string | null;
  onOpenFullReview: () => void;
};

export function InterviewAnalysisCard({
  interviewId,
  feedback,
  loading,
  error,
  onOpenFullReview,
}: InterviewAnalysisCardProps) {
  const report = feedback?.report;

  return (
    <GlowingCard className="h-full">
      <CardHeader>
        <CardTitle>Interview analysis</CardTitle>
        <CardDescription>AI evaluation from the completed interview session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!interviewId ? (
          <p className="text-sm text-muted-foreground">Interview analysis will appear after the candidate completes their session.</p>
        ) : loading ? (
          <CardLoader message="Loading interview analysis…" />
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : !feedback ? (
          <p className="text-sm text-muted-foreground">Interview analysis unavailable.</p>
        ) : (
          <>
            <InterviewScoreHighlight score={feedback.interview.score} />

            {feedback.interview.endedAt ? (
              <p className="text-xs text-muted-foreground">
                Completed {feedback.interview.endedAt.slice(0, 16)}
              </p>
            ) : null}

            {report ? (
              <>
                <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
                  <p className="text-sm leading-relaxed">{report.narrative}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-200/80">Strengths</p>
                    {report.strengths.length ? (
                      <ul className="space-y-2 text-sm leading-relaxed">
                        {report.strengths.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-300" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No strengths listed.</p>
                    )}
                  </div>
                  <div className="space-y-2 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-200/80">Gaps</p>
                    {report.gaps.length ? (
                      <ul className="space-y-2 text-sm leading-relaxed">
                        {report.gaps.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No gaps listed.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">AI interview report not available yet.</p>
            )}

            <div className="rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-indigo-600/5 p-4 shadow-[0_0_32px_-8px_rgba(99,102,241,0.55)]">
              <div className="mb-3 flex items-center justify-center gap-2 text-indigo-200">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Full session review</p>
              </div>
              <Button
                size="lg"
                onClick={onOpenFullReview}
                className={cn(
                  "h-14 w-full gap-3 rounded-xl border border-indigo-400/30 text-base font-semibold text-white",
                  "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500",
                  "shadow-lg shadow-indigo-950/50 transition hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-400",
                )}
              >
                <PlayCircle className="h-6 w-6 shrink-0" />
                Open full interview review
              </Button>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                Watch the recording, read the transcript, and inspect proctoring snapshots.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </GlowingCard>
  );
}
