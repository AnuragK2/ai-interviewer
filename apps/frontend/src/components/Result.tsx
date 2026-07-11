import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { InterviewResultsResponse } from "@/shared/api/types";
import * as applicationApi from "@/features/applications/services/application-api";
import * as interviewApi from "@/features/interview/services/interview-api";
import {
  InterviewFlowShell,
  interviewAgentBubbleClass,
  interviewOutlineButtonClass,
  interviewPrimaryButtonClass,
  interviewSurfaceClass,
  interviewUserBubbleClass,
} from "@/features/interview/components/InterviewFlowShell";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Spinner } from "@/shared/components/loading";
import { useAuth } from "@/features/auth/context/auth-context";
import {
  ArrowRight,
  Clock,
  Home,
  MessageSquare,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

function getScoreLabel(score: number) {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-300" };
  if (score >= 60) return { label: "Good", color: "text-indigo-300" };
  if (score >= 40) return { label: "Fair", color: "text-amber-300" };
  return { label: "Needs improvement", color: "text-orange-300" };
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { label, color } = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="-rotate-90 transform" width="144" height="144" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/10" />
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tracking-tight">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className={cn("text-sm font-medium", color)}>{label}</p>
    </div>
  );
}

export function Result() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDashboardPath } = useAuth();
  const [results, setResults] = useState<InterviewResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const interviewId = id;

    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      setError(null);
      setAccessDenied(false);

      try {
        const access = await applicationApi.getInterviewAccess(interviewId);
        if (cancelled) return;
        setApplicationId(access.application.id);

        const data = await interviewApi.getInterviewResults(interviewId);
        if (!cancelled) setResults(data);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        if (message.toLowerCase().includes("not found") || message.includes("404")) {
          setAccessDenied(true);
          return;
        }
        setError(message || "Could not load interview results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (accessDenied) {
    return <Navigate to="/candidate/applications" replace />;
  }

  const candidateName = results?.candidate.name ?? results?.candidate.githubUsername ?? "Candidate";
  const homePath = applicationId ? `/candidate/applications/${applicationId}` : getDashboardPath("CANDIDATE");

  return (
    <InterviewFlowShell>
      <PageContainer size="md">
        <PageHeader
          eyebrow="Interview complete"
          title="Your interview results"
          description={loading ? "Loading your performance summary..." : `Session summary for ${candidateName}`}
          actions={
            <Button asChild variant="outline" className={interviewOutlineButtonClass}>
              <Link to={applicationId ? `/candidate/applications/${applicationId}` : "/candidate/applications"}>
                View application
              </Link>
            </Button>
          }
        />

        {loading ? (
          <GlowingCard>
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-12">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Fetching your results...</p>
            </div>
          </GlowingCard>
        ) : null}

        {!loading && error ? (
          <GlowingCard>
            <div className="space-y-4 py-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={() => navigate(homePath)} className={interviewOutlineButtonClass}>
                <Home className="h-4 w-4" />
                Back to home
              </Button>
            </div>
          </GlowingCard>
        ) : null}

        {!loading && results ? (
          <div className="space-y-6">
            <GlowingCard>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold">{candidateName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {results.candidate.githubUsername && `@${results.candidate.githubUsername} · `}
                    <span className="font-mono">{results.interview.id.slice(0, 8)}</span>
                  </p>
                </div>
                <ScoreRing score={results.interview.score} />
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <StatTile icon={<MessageSquare className="h-4 w-4 text-indigo-300" />} label="Your responses" value={String(results.stats.userMessages)} />
                <StatTile icon={<Sparkles className="h-4 w-4 text-indigo-300" />} label="Interviewer turns" value={String(results.stats.assistantMessages)} />
                <StatTile icon={<Clock className="h-4 w-4 text-indigo-300" />} label="Duration" value={`${results.stats.durationMinutes} min`} />
              </div>
            </GlowingCard>

            <GlowingCard>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Conversation transcript</h2>
                <p className="text-sm text-muted-foreground">Full record of your interview session</p>
              </div>
              <div className="max-h-[28rem] space-y-3 overflow-y-auto">
                {results.messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No messages were recorded for this session.</p>
                ) : (
                  results.messages.map((message) => (
                    <div key={message.id} className={cn("flex", message.participant === "User" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          message.participant === "User" ? interviewUserBubbleClass : interviewAgentBubbleClass,
                        )}
                      >
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {message.participant === "User" ? (
                            <>
                              <User className="h-3 w-3" /> You
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" /> Interviewer
                            </>
                          )}
                        </p>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlowingCard>

            <div className="flex justify-center pb-6">
              <Button onClick={() => navigate(homePath)} size="lg" className={cn("h-11 px-8", interviewPrimaryButtonClass)}>
                <Trophy className="h-4 w-4" />
                Back to application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </PageContainer>
    </InterviewFlowShell>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className={cn("rounded-xl p-4", interviewSurfaceClass)}>
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export default Result;
