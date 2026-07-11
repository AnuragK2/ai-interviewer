import { useEffect, useState } from "react";
import type { InterviewFeedbackResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as interviewApi from "@/features/interview/services/interview-api";

type InterviewReviewPanelProps = {
  interviewId: string;
};

export function InterviewReviewPanel({ interviewId }: InterviewReviewPanelProps) {
  const [feedback, setFeedback] = useState<InterviewFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    void interviewApi
      .getInterviewFeedback(interviewId)
      .then(setFeedback)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load interview review."))
      .finally(() => setLoading(false));
  }, [interviewId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading interview review…</p>;
  }

  if (error || !feedback) {
    return <p className="text-sm text-muted-foreground">{error ?? "Interview review unavailable."}</p>;
  }

  const recording = feedback.media.find((asset) => asset.type === "RECORDING");
  const snapshots = feedback.media.filter((asset) => asset.type === "SNAPSHOT");
  const report = feedback.report;

  return (
    <GlowingCard>
      <CardHeader>
        <CardTitle>Interview review</CardTitle>
        <CardDescription>
          Score {feedback.interview.score}/100
          {feedback.interview.endedAt ? ` · Completed ${feedback.interview.endedAt.slice(0, 16)}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {report ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{report.narrative}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Strengths</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {report.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Gaps</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {report.gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">AI report not available yet.</p>
        )}

        {recording ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Session recording</p>
            <video controls className="w-full rounded-xl border border-white/10 bg-black/40" src={recording.url}>
              <track kind="captions" />
            </video>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recording uploaded for this interview.</p>
        )}

        {snapshots.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Proctoring snapshots</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-2">
                  <img src={snapshot.url} alt={snapshot.signal ?? "Proctoring snapshot"} className="rounded-md" />
                  <p className="text-xs text-muted-foreground">
                    {snapshot.signal ?? "violation"} · {snapshot.capturedAt.slice(0, 16)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {feedback.results ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Transcript</p>
            <div className="max-h-[420px] space-y-3 overflow-auto rounded-xl border border-white/10 bg-white/5 p-4">
              {feedback.results.messages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{message.participant}</p>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </GlowingCard>
  );
}
