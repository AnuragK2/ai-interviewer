import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { CandidateApplicationDetailResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { ApplicationAnalysisCard } from "@/features/applications/components/ApplicationAnalysisCard";
import { ApplicationPipeline } from "@/features/applications/components/ApplicationPipeline";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import * as applicationApi from "@/features/applications/services/application-api";

export function CandidateApplicationAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<CandidateApplicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      const next = await applicationApi.getCandidateApplication(id);
      setDetail(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load application.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!detail) return;
    const pending =
      detail.application.status === "ANALYZING" ||
      detail.application.status === "INTERVIEW_INVITED" ||
      detail.application.status === "INTERVIEW_IN_PROGRESS";

    if (!pending) return;

    const interval = window.setInterval(() => {
      void loadDetail();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [detail, loadDetail]);

  async function handleStartInterview() {
    if (!id || !detail?.application.interviewId) return;
    setStarting(true);
    try {
      if (detail.application.status === "INTERVIEW_INVITED") {
        await applicationApi.markInterviewPending(id);
      }
      navigate(`/interview/${detail.application.interviewId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start interview.");
    } finally {
      setStarting(false);
    }
  }

  const canStart = detail?.canStartInterview ?? false;
  const interviewBlockedReason =
    detail?.application.status === "ANALYZED"
      ? "Waiting for recruiter to invite you to interview."
      : detail?.application.status === "INTERVIEW_COMPLETED"
        ? "This interview has already been completed."
        : detail?.application.status === "INTERVIEW_CANCELLED"
          ? "This interview was cancelled."
          : "Interview is not available yet.";

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Application analytics"
        title={loading ? "Loading…" : (detail?.jobTitle ?? "Application")}
        description={detail ? `Applied ${detail.application.createdAt.slice(0, 10)}` : undefined}
        actions={
          <Button asChild variant="outline" className="border-white/10 bg-white/5">
            <Link to="/candidate/applications">Back to applications</Link>
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !detail ? (
        <p className="text-sm text-muted-foreground">Application not found.</p>
      ) : (
        <div className="space-y-6">
          <GlowingCard>
            <div className="space-y-5 p-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Pipeline</p>
                  <p className="text-xs text-muted-foreground">Current status: {detail.application.status}</p>
                </div>
                <Button
                  disabled={!canStart || starting}
                  onClick={handleStartInterview}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  {starting ? "Starting…" : "Start interview"}
                </Button>
              </div>

              {!canStart ? <p className="text-xs text-muted-foreground">{interviewBlockedReason}</p> : null}

              <ApplicationPipeline status={detail.application.status} />
            </div>
          </GlowingCard>

          <ApplicationAnalysisCard application={detail.application} />

          <GlowingCard>
            <div className="space-y-3 p-1">
              <p className="text-sm font-medium">Interview</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Interview id</p>
                  <p className="text-sm font-mono">{detail.application.interviewId ?? "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Invited at</p>
                  <p className="text-sm">{detail.application.invitedAt?.slice(0, 16) ?? "—"}</p>
                </div>
              </div>
              {detail.application.status === "INTERVIEW_COMPLETED" && detail.application.interviewId ? (
                <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
                  <Link to={`/results/${detail.application.interviewId}`}>View interview results</Link>
                </Button>
              ) : null}
            </div>
          </GlowingCard>
        </div>
      )}
    </PageContainer>
  );
}
