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
import { getCandidateName, getJobTitle } from "@/features/applications/lib/parse-snapshot";
import { InterviewReviewPanel } from "@/features/recruiter/components/InterviewReviewPanel";
import * as applicationApi from "@/features/applications/services/application-api";

export function RecruiterApplicationPacketPage() {
  const { id } = useParams();
  const [packet, setPacket] = useState<RecruiterApplicationPacketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void applicationApi
      .getRecruiterApplicationPacket(id)
      .then(setPacket)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load application packet."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleInvite() {
    if (!id) return;
    setInviting(true);
    try {
      const application = await applicationApi.inviteToInterview(id);
      setPacket((current) =>
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

  const canInvite = packet?.application.status === "ANALYZED";
  const candidateName =
    packet?.application.candidateName ??
    (packet ? getCandidateName(packet.candidateSnapshot) : null);
  const jobTitle = packet ? getJobTitle(packet.jobSnapshot) : null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Applicant packet"
        title={loading ? "Loading…" : (candidateName ?? "Application packet")}
        description={
          loading
            ? undefined
            : [jobTitle, packet ? `Applied ${packet.application.createdAt.slice(0, 10)}` : null]
                .filter(Boolean)
                .join(" · ")
        }
        actions={
          packet ? (
            <Button
              disabled={!canInvite || inviting || Boolean(packet.application.interviewId)}
              onClick={handleInvite}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              {packet.application.interviewId
                ? "Interview invited"
                : inviting
                  ? "Inviting…"
                  : "Invite to interview"}
            </Button>
          ) : null
        }
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
          <CardDescription>Async fit analysis produced shortly after the candidate applies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !packet ? (
            <p className="text-sm text-muted-foreground">Not found.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <ApplicationStatusBadge status={packet.application.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Fit score</p>
                  <p className="text-sm font-medium">
                    {packet.application.fitScore !== null ? `${packet.application.fitScore}/100` : "Pending"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted-foreground">Interview</p>
                  <p className="text-sm font-medium">
                    {packet.application.interviewId ? packet.application.interviewId : "Not invited"}
                  </p>
                </div>
              </div>

              {packet.application.fitSummary ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Summary</p>
                  <p className="text-sm leading-relaxed">{packet.application.fitSummary}</p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Strengths</p>
                  {packet.application.strengths.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {packet.application.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Concerns</p>
                  {packet.application.concerns.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {packet.application.concerns.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              {packet.application.coverLetter ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cover letter</p>
                  <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
                    {packet.application.coverLetter}
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
          <CardContent>{packet ? <JobSnapshotView snapshot={packet.jobSnapshot} /> : null}</CardContent>
        </GlowingCard>

        <GlowingCard>
          <CardHeader>
            <CardTitle>Candidate profile</CardTitle>
            <CardDescription>Resume, skills, and experience at apply time.</CardDescription>
          </CardHeader>
          <CardContent>{packet ? <CandidateSnapshotView snapshot={packet.candidateSnapshot} /> : null}</CardContent>
        </GlowingCard>
      </div>

      {packet?.application.interviewId &&
      (packet.application.status === "INTERVIEW_COMPLETED" ||
        packet.application.status === "INTERVIEW_CANCELLED") ? (
        <InterviewReviewPanel interviewId={packet.application.interviewId} />
      ) : null}
    </PageContainer>
  );
}
