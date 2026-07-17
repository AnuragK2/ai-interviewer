import type { ApplicationResponse } from "@ai-interviewer/api-types";
import { CheckCircle2, Clock3, Download, Mail, PlayCircle, Star, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { ButtonLoading } from "@/shared/components/loading";
import * as applicationApi from "@/features/applications/services/application-api";
import { useBilling } from "@/features/billing/context/billing-context";

type RecruiterApplicationActionsProps = {
  application: ApplicationResponse;
  hasResume: boolean;
  onApplicationUpdated: (application: ApplicationResponse) => void;
  onOpenInterviewReview: () => void;
};

export function RecruiterApplicationActions({
  application,
  hasResume,
  onApplicationUpdated,
  onOpenInterviewReview,
}: RecruiterApplicationActionsProps) {
  const { writable } = useBilling();
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function runAction(action: string, task: () => Promise<ApplicationResponse>, successMessage: string) {
    setBusyAction(action);
    try {
      const updated = await task();
      onApplicationUpdated(updated);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownloadResume() {
    setBusyAction("resume");
    try {
      const download = await applicationApi.downloadRecruiterApplicationResume(application.id);
      window.open(download.url, "_blank", "noopener,noreferrer");
      toast.success("Resume download started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download resume.");
    } finally {
      setBusyAction(null);
    }
  }

  const canInvite = application.status === "ANALYZED" && !application.interviewId;
  const canSelect = application.status === "INTERVIEW_COMPLETED";
  const canMarkReviewed =
    (application.status === "SUBMITTED" || application.status === "ANALYZING") && application.fitScore !== null;
  const canMarkPending = application.status === "ANALYZED";
  const canReject = application.status !== "INTERVIEW_IN_PROGRESS" && application.status !== "INTERVIEW_CANCELLED";
  const canViewInterview =
    Boolean(application.interviewId) &&
    (application.status === "INTERVIEW_COMPLETED" ||
      application.status === "SELECTED" ||
      application.status === "INTERVIEW_CANCELLED" ||
      application.status === "INTERVIEW_IN_PROGRESS");

  return (
    <GlowingCard className="h-full">
      <CardHeader>
        <CardTitle>Recruiter actions</CardTitle>
        <CardDescription>
          {writable
            ? "Move this candidate through your hiring workflow."
            : "Workspace is read-only due to billing. Upgrade to invite or update decisions."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Interview decision</p>
          <Button
            className="w-full justify-start bg-indigo-600 hover:bg-indigo-500"
            disabled={!writable || !canInvite || busyAction !== null}
            onClick={() =>
              void runAction("invite", () => applicationApi.inviteToInterview(application.id), "Candidate invited to interview.")
            }
          >
            <ButtonLoading loading={busyAction === "invite"} loadingText="Inviting…">
              <Mail className="h-4 w-4" />
              Invite to interview
            </ButtonLoading>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start border-emerald-500/20 bg-emerald-500/5 text-emerald-100 hover:bg-emerald-500/10"
            disabled={!writable || !canSelect || busyAction !== null}
            onClick={() =>
              void runAction(
                "select",
                () => applicationApi.updateRecruiterApplicationDecision(application.id, "select"),
                "Candidate selected.",
              )
            }
          >
            <ButtonLoading loading={busyAction === "select"} loadingText="Updating…">
              <Star className="h-4 w-4" />
              Select candidate
            </ButtonLoading>
          </Button>

          {!canSelect ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Select candidate becomes available once the interview is completed.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Application review</p>
          <Button
            variant="outline"
            className="w-full justify-start border-white/10 bg-white/5"
            disabled={!writable || !canMarkReviewed || busyAction !== null}
            onClick={() =>
              void runAction(
                "mark_reviewed",
                () => applicationApi.updateRecruiterApplicationDecision(application.id, "mark_reviewed"),
                "Application marked as reviewed.",
              )
            }
          >
            <ButtonLoading loading={busyAction === "mark_reviewed"} loadingText="Updating…">
              <CheckCircle2 className="h-4 w-4" />
              Mark as reviewed
            </ButtonLoading>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start border-white/10 bg-white/5"
            disabled={!writable || !canMarkPending || busyAction !== null}
            onClick={() =>
              void runAction(
                "mark_pending",
                () => applicationApi.updateRecruiterApplicationDecision(application.id, "mark_pending"),
                "Application marked as pending review.",
              )
            }
          >
            <ButtonLoading loading={busyAction === "mark_pending"} loadingText="Updating…">
              <Clock3 className="h-4 w-4" />
              Mark as pending
            </ButtonLoading>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start border-red-500/20 bg-red-500/5 text-red-200 hover:bg-red-500/10"
            disabled={!writable || !canReject || busyAction !== null}
            onClick={() =>
              void runAction(
                "reject",
                () => applicationApi.updateRecruiterApplicationDecision(application.id, "reject"),
                "Candidate rejected.",
              )
            }
          >
            <ButtonLoading loading={busyAction === "reject"} loadingText="Updating…">
              <UserX className="h-4 w-4" />
              Reject candidate
            </ButtonLoading>
          </Button>
        </div>

        <div className="space-y-2 border-t border-white/10 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start border-white/10 bg-white/5"
            disabled={!hasResume || busyAction !== null}
            onClick={() => void handleDownloadResume()}
          >
            <ButtonLoading loading={busyAction === "resume"} loadingText="Preparing…">
              <Download className="h-4 w-4" />
              Download resume
            </ButtonLoading>
          </Button>

          {canViewInterview ? (
            <Button
              variant="outline"
              className="w-full justify-start border-white/10 bg-white/5"
              onClick={onOpenInterviewReview}
            >
              <PlayCircle className="h-4 w-4" />
              Open interview review
            </Button>
          ) : null}
        </div>
      </CardContent>
    </GlowingCard>
  );
}
