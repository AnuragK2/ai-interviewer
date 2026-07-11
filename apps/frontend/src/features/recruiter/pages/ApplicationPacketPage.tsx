import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { InterviewFeedbackResponse, RecruiterApplicationPacketResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateSnapshotView } from "@/features/applications/components/CandidateSnapshotView";
import { JobSnapshotView } from "@/features/applications/components/JobSnapshotView";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CardLoader } from "@/shared/components/loading";
import { getCandidateName, getJobTitle, parseCandidateSnapshot } from "@/features/applications/lib/parse-snapshot";
import { ApplicantOverviewCard } from "@/features/recruiter/components/ApplicantOverviewCard";
import { ApplicationFitAnalysisCard } from "@/features/recruiter/components/ApplicationFitAnalysisCard";
import { InterviewAnalysisCard } from "@/features/recruiter/components/InterviewAnalysisCard";
import { InterviewReviewModal } from "@/features/recruiter/components/InterviewReviewModal";
import { RecruiterApplicationActions } from "@/features/recruiter/components/RecruiterApplicationActions";
import * as applicationApi from "@/features/applications/services/application-api";
import * as interviewApi from "@/features/interview/services/interview-api";

export function RecruiterApplicationPacketPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<RecruiterApplicationPacketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviewReviewOpen, setInterviewReviewOpen] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState<InterviewFeedbackResponse | null>(null);
  const [interviewFeedbackLoading, setInterviewFeedbackLoading] = useState(false);
  const [interviewFeedbackError, setInterviewFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void applicationApi
      .getRecruiterApplicationPacket(id)
      .then(setDetail)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load application."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const interviewId = detail?.application.interviewId;
    if (!interviewId) {
      setInterviewFeedback(null);
      setInterviewFeedbackError(null);
      setInterviewFeedbackLoading(false);
      return;
    }

    setInterviewFeedbackLoading(true);
    setInterviewFeedbackError(null);
    void interviewApi
      .getInterviewFeedback(interviewId)
      .then(setInterviewFeedback)
      .catch((error) => {
        setInterviewFeedback(null);
        setInterviewFeedbackError(error instanceof Error ? error.message : "Failed to load interview analysis.");
      })
      .finally(() => setInterviewFeedbackLoading(false));
  }, [detail?.application.interviewId]);

  const candidateName =
    detail?.application.candidateName ??
    (detail ? getCandidateName(detail.candidateSnapshot) : null);
  const jobTitle = detail ? getJobTitle(detail.jobSnapshot) : null;
  const profile = detail ? parseCandidateSnapshot(detail.candidateSnapshot) : null;
  const hasResume = Boolean(profile?.resume?.hasFile);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Application review"
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
            <Link
              to={`/recruiter/jobs/${detail.application.jobId}/applicants`}
              className="text-sm text-indigo-200 hover:underline"
            >
              Back to applicants
            </Link>
          ) : null
        }
      />

      {loading ? (
        <CardLoader message="Loading application…" />
      ) : !detail ? (
        <p className="text-sm text-muted-foreground">Application not found.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ApplicantOverviewCard
              snapshot={detail.candidateSnapshot}
              candidateName={candidateName}
              appliedAt={detail.application.createdAt}
              jobTitle={jobTitle}
              jobId={detail.application.jobId}
            />

            <RecruiterApplicationActions
              application={detail.application}
              hasResume={hasResume}
              onApplicationUpdated={(application) =>
                setDetail((current) => (current ? { ...current, application } : current))
              }
              onOpenInterviewReview={() => setInterviewReviewOpen(true)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ApplicationFitAnalysisCard application={detail.application} />

            <InterviewAnalysisCard
              interviewId={detail.application.interviewId}
              feedback={interviewFeedback}
              loading={interviewFeedbackLoading}
              error={interviewFeedbackError}
              onOpenFullReview={() => setInterviewReviewOpen(true)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlowingCard className="h-full">
              <CardHeader>
                <CardTitle>Job details</CardTitle>
                <CardDescription>Role requirements when this candidate applied.</CardDescription>
              </CardHeader>
              <CardContent>
                <JobSnapshotView snapshot={detail.jobSnapshot} />
              </CardContent>
            </GlowingCard>

            <GlowingCard className="h-full">
              <CardHeader>
                <CardTitle>Candidate profile</CardTitle>
                <CardDescription>Resume, skills, and experience at apply time.</CardDescription>
              </CardHeader>
              <CardContent>
                <CandidateSnapshotView snapshot={detail.candidateSnapshot} />
              </CardContent>
            </GlowingCard>
          </div>

          {detail.application.coverLetter ? (
            <GlowingCard>
              <CardHeader>
                <CardTitle>Cover letter</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed">
                  {detail.application.coverLetter}
                </pre>
              </CardContent>
            </GlowingCard>
          ) : null}
        </div>
      )}

      {detail?.application.interviewId ? (
        <InterviewReviewModal
          interviewId={detail.application.interviewId}
          candidateName={candidateName}
          open={interviewReviewOpen}
          onOpenChange={setInterviewReviewOpen}
        />
      ) : null}
    </PageContainer>
  );
}
