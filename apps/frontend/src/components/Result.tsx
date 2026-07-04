import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import axios from "axios";
import { PageShell } from "@/shared/components/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { BACKEND_URL } from "@/shared/api/config";
import type { InterviewResultsResponse } from "@/shared/api/types";
import {
  ArrowRight,
  Clock,
  Home,
  Loader2,
  MessageSquare,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

function getScoreLabel(score: number) {
  if (score >= 80) return { label: "Excellent", color: "text-teal-300" };
  if (score >= 60) return { label: "Good", color: "text-emerald-300" };
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
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-secondary/60"
          />
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
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#fbbf24" />
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
  const [results, setResults] = useState<InterviewResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get<InterviewResultsResponse>(
          `${BACKEND_URL}/api/v1/interview/${id}/results`,
        );
        if (!cancelled) setResults(data);
      } catch (err) {
        if (cancelled) return;
        const message =
          axios.isAxiosError(err) && err.response?.data?.error
            ? String(err.response.data.error)
            : "Could not load interview results.";
        setError(message);
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

  const candidateName =
    results?.candidate.name ?? results?.candidate.githubUsername ?? "Candidate";

  return (
    <PageShell>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-6 py-10">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/25 bg-teal-500/10 shadow-[0_0_30px_rgba(45,212,191,0.12)]">
            <Trophy className="h-6 w-6 text-amber-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Interview
              <span className="bg-gradient-to-r from-teal-300 via-emerald-200 to-amber-300 bg-clip-text text-transparent">
                {" "}
                results
              </span>
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              {loading ? "Loading your performance summary..." : `Session summary for ${candidateName}`}
            </p>
          </div>
        </div>

        {loading && (
          <Card className="border-border/60 bg-card/70 backdrop-blur-xl">
            <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
              <p className="text-sm text-muted-foreground">Fetching your results...</p>
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card className="border-border/60 bg-card/70 backdrop-blur-xl">
            <CardContent className="space-y-4 py-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={() => navigate("/")} className="border-border/60 bg-secondary/20">
                <Home className="h-4 w-4" />
                Back to home
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && results && (
          <>
            <Card className="overflow-hidden border-border/60 bg-card/70 shadow-2xl shadow-teal-950/20 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-teal-600 via-emerald-600 to-amber-500" />
              <CardHeader className="border-b border-border/50">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-center sm:text-left">
                    <CardTitle className="text-xl">{candidateName}</CardTitle>
                    <CardDescription>
                      {results.candidate.githubUsername && `@${results.candidate.githubUsername} · `}
                      <span className="font-mono">{results.interview.id.slice(0, 8)}</span>
                    </CardDescription>
                  </div>
                  <ScoreRing score={results.interview.score} />
                </div>
              </CardHeader>

              <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
                <StatTile
                  icon={<MessageSquare className="h-4 w-4 text-teal-300" />}
                  label="Your responses"
                  value={String(results.stats.userMessages)}
                />
                <StatTile
                  icon={<Sparkles className="h-4 w-4 text-amber-300" />}
                  label="Interviewer turns"
                  value={String(results.stats.assistantMessages)}
                />
                <StatTile
                  icon={<Clock className="h-4 w-4 text-emerald-300" />}
                  label="Duration"
                  value={`${results.stats.durationMinutes} min`}
                />
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70 backdrop-blur-xl">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg">Conversation transcript</CardTitle>
                <CardDescription>Full record of your interview session</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[28rem] space-y-3 overflow-y-auto pt-6">
                {results.messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No messages were recorded for this session.
                  </p>
                ) : (
                  results.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex", message.participant === "User" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          message.participant === "User"
                            ? "rounded-br-md bg-teal-600/20 text-teal-50"
                            : "rounded-bl-md bg-secondary/70 text-foreground/90",
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
              </CardContent>
            </Card>

            <div className="flex justify-center pb-6">
              <Button
                onClick={() => navigate("/")}
                size="lg"
                className="h-11 bg-gradient-to-r from-teal-600 via-emerald-600 to-amber-500 px-8 text-white shadow-lg shadow-teal-950/30 hover:from-teal-500 hover:via-emerald-500 hover:to-amber-400"
              >
                <Home className="h-4 w-4" />
                Start a new interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export default Result;
