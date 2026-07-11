import { Link, Navigate, useNavigate, useParams } from "react-router";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  InterviewFlowShell,
  interviewOutlineButtonClass,
  interviewPrimaryButtonClass,
  interviewSurfaceClass,
} from "@/features/interview/components/InterviewFlowShell";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useAuth } from "@/features/auth/context/auth-context";
import { ArrowRight, Camera, Copy, Eye, Home, Monitor, ShieldAlert, VideoOff } from "lucide-react";
import { clearInterviewEndState, loadInterviewEndState } from "@/shared/lib/interview-end-state";

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
  const { user, getDashboardPath } = useAuth();
  const endState = id ? loadInterviewEndState(id) : null;

  if (!id || !endState || endState.reason !== "cheat") {
    return <Navigate to="/" replace />;
  }

  const interviewId = id;
  const candidateName = endState.candidateName ?? "Candidate";
  const homePath = user ? getDashboardPath(user.role) : "/";

  function handleReturnHome() {
    clearInterviewEndState(interviewId);
    navigate(homePath, { replace: true });
  }

  return (
    <InterviewFlowShell>
      <PageContainer size="md">
        <PageHeader
          eyebrow="Interview ended"
          title="Proctoring policy exceeded"
          description={`${candidateName}, your session was closed due to repeated proctoring violations.`}
        />

        <GlowingCard className="overflow-hidden">
          <div className="h-1 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-orange-500" />

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Session terminated</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {endState.message ||
                "Interview ended after repeated proctoring violations. Five total warnings were recorded across any combination of rule breaks."}
            </p>
          </div>

          <div className={cn("rounded-xl p-4", interviewSurfaceClass)}>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Monitored behaviors</p>
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
            <div className={cn("rounded-xl px-4 py-3", interviewSurfaceClass)}>
              <p className="text-xs text-muted-foreground">Session ID</p>
              <p className="mt-1 truncate font-mono text-sm">{interviewId.slice(0, 8)}</p>
            </div>
            <div className={cn("rounded-xl px-4 py-3", interviewSurfaceClass)}>
              <p className="text-xs text-muted-foreground">Outcome</p>
              <p className="mt-1 text-sm font-medium text-red-300">Disqualified</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            All proctoring violations share one combined limit. You received warnings during the session before this final termination.
          </p>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
            <Button onClick={handleReturnHome} size="lg" className={cn("h-11 w-full", interviewPrimaryButtonClass)}>
              <Home className="h-4 w-4" />
              {user ? "Back to dashboard" : "Return to home"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {user?.role === "CANDIDATE" ? (
              <Button asChild variant="outline" className={interviewOutlineButtonClass}>
                <Link to="/candidate/applications">View applications</Link>
              </Button>
            ) : null}
          </div>
        </GlowingCard>
      </PageContainer>
    </InterviewFlowShell>
  );
}

export default ProctoringEnded;
