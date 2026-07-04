import { Navigate, useNavigate, useParams } from "react-router";
import { PageShell } from "./PageShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  ArrowRight,
  Camera,
  Copy,
  Eye,
  Home,
  Monitor,
  ShieldAlert,
  VideoOff,
} from "lucide-react";
import { clearInterviewEndState, loadInterviewEndState } from "../lib/interviewEndState";

const VIOLATION_ITEMS = [
  { icon: Eye, label: "Looking away from the camera" },
  { icon: Camera, label: "Face not visible in frame" },
  { icon: VideoOff, label: "Camera turned off" },
  { icon: Monitor, label: "Leaving the interview tab" },
  { icon: Copy, label: "Copy or paste activity" },
] as const;

export function ProctoringEnded() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const endState = id ? loadInterviewEndState(id) : null;

  if (!id || !endState || endState.reason !== "cheat") {
    return <Navigate to="/" replace />;
  }

  const interviewId = id;
  const candidateName = endState.candidateName ?? "Candidate";

  function handleReturnHome() {
    clearInterviewEndState(interviewId);
    navigate("/", { replace: true });
  }

  return (
    <PageShell>
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
              <ShieldAlert className="h-7 w-7 text-red-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Interview
                <span className="bg-gradient-to-r from-red-300 via-amber-300 to-orange-200 bg-clip-text text-transparent">
                  {" "}
                  ended
                </span>
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                {candidateName}, your session was closed due to repeated proctoring violations.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden border-red-500/20 bg-card/70 shadow-2xl shadow-red-950/20 backdrop-blur-xl">
            <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-orange-500" />
            <CardHeader className="border-b border-border/50 pb-5">
              <CardTitle className="text-lg">Proctoring policy exceeded</CardTitle>
              <CardDescription className="leading-relaxed">
                {endState.message ||
                  "Interview ended after repeated proctoring violations. Five total warnings were recorded across any combination of rule breaks."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Monitored behaviors
                </p>
                <ul className="space-y-2.5">
                  {VIOLATION_ITEMS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2.5 text-sm text-foreground/90">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5">
                        <Icon className="h-3.5 w-3.5 text-red-300/90" />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Session ID</p>
                  <p className="mt-1 truncate font-mono text-sm">{interviewId.slice(0, 8)}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Outcome</p>
                  <p className="mt-1 text-sm font-medium text-red-300">Disqualified</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                All proctoring violations share one combined limit. You received warnings during the
                session before this final termination.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-6">
              <Button
                onClick={handleReturnHome}
                size="lg"
                className="h-11 w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-amber-500 text-white shadow-lg shadow-teal-950/30 hover:from-teal-500 hover:via-emerald-500 hover:to-amber-400"
              >
                <Home className="h-4 w-4" />
                Return to home
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You may start a new interview from the home page when you are ready.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export default ProctoringEnded;
