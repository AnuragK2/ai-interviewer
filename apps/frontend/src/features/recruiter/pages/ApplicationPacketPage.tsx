import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import type { RecruiterApplicationPacketResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateSnapshotView } from "@/features/applications/components/CandidateSnapshotView";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { JobSnapshotView } from "@/features/applications/components/JobSnapshotView";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ButtonLoading, CardLoader } from "@/shared/components/loading";
import { getCandidateName, getJobTitle } from "@/features/applications/lib/parse-snapshot";
import { InterviewReviewPanel } from "@/features/recruiter/components/InterviewReviewPanel";
import * as applicationApi from "@/features/applications/services/application-api";

export function RecruiterApplicationPacketPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<RecruiterApplicationPacketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void applicationApi
      .getRecruiterApplicationPacket(id)
      .then(setDetail)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load application."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleInvite() {
    if (!id) return;
    setInviting(true);
    try {
      const application = await applicationApi.inviteToInterview(id);
      setDetail((current) =>
        current
          ? {
              ...current,
              application,
            }
          : current,
      );
      toast.success("Candidate invited to interview.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to invite candidate.");
    } finally {
      setInviting(false);
    }
  }

  const canInvite = detail?.application.status === "ANALYZED";
  const candidateName =
    detail?.application.candidateName ??
    (detail ? getCandidateName(detail.candidateSnapshot) : null);
  const jobTitle = detail ? getJobTitle(detail.jobSnapshot) : null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Application"
        title={loading ? "Loading…" : (candidateName ?? "Application")}
        description={
          loading
            ? undefined
            : [jobTitle, detail ? `Applied ${detail.application.createdAt.slice(0, 10)}` : null]
                .filter(Boolean)
                .join(" · ")
        }
        actions={
          detail ? (
            <Button
              disabled={!canInvite || inviting || Boolean(detail.application.interviewId)}
              onClick={handleInvite}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              {detail.application.interviewId ? (
                "Interview invited"
              ) : (
                <ButtonLoading loading={inviting} loadingText="Inviting…">
                  Invite to interview
                </ButtonLoading>
              )}
            </Button>
          ) : null
        }
      />

      {loading ? (
        <CardLoader message="Loading application…" />
      ) : (
        <>
      <GlowingCard>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
          <CardDescription>Async fit analysis produced shortly after the candidate applies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!detail ? (
            <p className="text-sm text-muted-foreground">Application not found.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <ApplicationStatusBadge status={detail.application.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Fit score</p>
                  <p className="text-sm font-medium">
                    {detail.application.fitScore !== null ? `${detail.application.fitScore}/100` : "Pending"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Interview</p>
                  <p className="text-sm font-medium">
                    {detail.application.interviewId ? detail.application.interviewId : "Not invited"}
                  </p>
                </div>
              </div>

              {detail.application.fitSummary ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Summary</p>
                  <p className="text-sm leading-relaxed">{detail.application.fitSummary}</p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Strengths</p>
                  {detail.application.strengths.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {detail.application.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Concerns</p>
                  {detail.application.concerns.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {detail.application.concerns.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              {detail.application.coverLetter ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cover letter</p>
                  <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
                    {detail.application.coverLetter}
                  </pre>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </GlowingCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlowingCard>
          <CardHeader>
            <CardTitle>Job listing</CardTitle>
            <CardDescription>Role requirements captured when the candidate applied.</CardDescription>
          </CardHeader>
          <CardContent>{detail ? <JobSnapshotView snapshot={detail.jobSnapshot} /> : null}</CardContent>
        </GlowingCard>

        <GlowingCard>
          <CardHeader>
            <CardTitle>Candidate profile</CardTitle>
            <CardDescription>Resume, skills, and experience at apply time.</CardDescription>
          </CardHeader>
          <CardContent>{detail ? <CandidateSnapshotView snapshot={detail.candidateSnapshot} /> : null}</CardContent>
        </GlowingCard>
      </div>

      {detail?.application.interviewId &&
      (detail.application.status === "INTERVIEW_COMPLETED" ||
        detail.application.status === "INTERVIEW_CANCELLED") ? (
        <InterviewReviewPanel interviewId={detail.application.interviewId} />
      ) : null}
        </>
      )}
    </PageContainer>
  );
}
