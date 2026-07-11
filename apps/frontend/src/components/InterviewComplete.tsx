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
import { ArrowRight, CheckCircle2, List } from "lucide-react";
import { clearInterviewEndState, loadInterviewEndState } from "@/shared/lib/interview-end-state";

export function InterviewComplete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const endState = id ? loadInterviewEndState(id) : null;

  if (!id || !endState || (endState.reason !== "completed" && endState.reason !== "client_end")) {
    return <Navigate to="/candidate/applications" replace />;
  }

  const candidateName = endState.candidateName ?? "Candidate";

  function handleBackToListings() {
    clearInterviewEndState(id!);
    navigate("/candidate/applications", { replace: true });
  }

  return (
    <InterviewFlowShell>
      <PageContainer size="md">
        <PageHeader
          eyebrow="Interview complete"
          title="Thank you for your time"
          description={`${candidateName}, your interview has been submitted successfully.`}
        />

        <GlowingCard className="overflow-hidden">
          <div className="h-1 rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500" />

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">You&apos;re all set</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Thank you for the interview. The recruiter will get back to you shortly after reviewing your responses.
              </p>
            </div>
          </div>

          <div className={cn("rounded-xl p-4", interviewSurfaceClass)}>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your session recording and transcript have been saved. You can track this application from your listings
              page while the hiring team reviews your interview.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
            <Button onClick={handleBackToListings} size="lg" className={cn("h-11 w-full", interviewPrimaryButtonClass)}>
              <List className="h-4 w-4" />
              Back to listings
              <ArrowRight className="h-4 w-4" />
            </Button>
            {endState.applicationId ? (
              <Button asChild variant="outline" className={interviewOutlineButtonClass}>
                <Link to={`/candidate/applications/${endState.applicationId}`}>View application</Link>
              </Button>
            ) : null}
          </div>
        </GlowingCard>
      </PageContainer>
    </InterviewFlowShell>
  );
}

export default InterviewComplete;
