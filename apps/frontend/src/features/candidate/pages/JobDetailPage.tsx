import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { ApplicationResponse, JobResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationAnalysisCard } from "@/features/applications/components/ApplicationAnalysisCard";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import * as jobApi from "@/features/jobs/services/job-api";
import * as applicationApi from "@/features/applications/services/application-api";

export function CandidateJobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [application, setApplication] = useState<ApplicationResponse | null>(null);

  const loadApplication = useCallback(async (jobId: string) => {
    try {
      const applications = await applicationApi.listMyApplications();
      const existing = applications.find((app) => app.jobId === jobId) ?? null;
      setApplication(existing);
    } catch {
      // Non-blocking: job page still works if applications API is unavailable.
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    void jobApi
      .getJob(id)
      .then(setJob)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load job."))
      .finally(() => setLoading(false));

    void loadApplication(id);
  }, [id, loadApplication]);

  useEffect(() => {
    if (!id || application?.status !== "ANALYZING") return;

    const interval = window.setInterval(() => {
      void loadApplication(id);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [id, application?.status, loadApplication]);

  const applyDisabled = useMemo(() => {
    if (loading || !job) return true;
    if (job.isExpired || job.status !== "OPEN") return true;
    return false;
  }, [job, loading]);

  async function handleApply() {
    if (!id) return;
    setApplying(true);
    try {
      const created = await applicationApi.applyToJob({
        jobId: id,
        coverLetter: coverLetter.trim() ? coverLetter.trim() : null,
      });
      setApplication(created);
      toast.success("Applied successfully. Analysis will appear shortly.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <PageContainer size="md">
      <PageHeader
        eyebrow="Job detail"
        title={loading ? "Loading…" : (job?.title ?? "Job")}
        description={job?.location ?? undefined}
        actions={
          <Button asChild variant="outline" className="border-white/10 bg-white/5">
            <Link to="/candidate/jobs">Back to jobs</Link>
          </Button>
        }
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>About the role</CardTitle>
          <CardDescription>
            {job?.status ? `Status: ${job.status}` : ""} {job?.isExpired ? "· expired" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !job ? (
            <p className="text-sm text-muted-foreground">Job not found.</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Required skills</p>
                  {job.requiredSkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None listed</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Preferred skills</p>
                  {job.preferredSkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None listed</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {job.preferredSkills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Work style</p>
                  <p className="text-sm">{job.workStyle ?? "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Employment type</p>
                  <p className="text-sm">
                    {job.employmentTypes.length ? job.employmentTypes.join(", ") : "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="text-sm">
                    {job.salaryMin || job.salaryMax
                      ? `${job.currency} ${job.salaryMin ?? "?"} – ${job.salaryMax ?? "?"}`
                      : "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="text-sm">{job.expiresAt ? job.expiresAt.slice(0, 10) : "Not set"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6 sm:p-7">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Apply</p>
                      <p className="text-xs text-muted-foreground">
                        Submit a cover letter (optional). We’ll run an async fit analysis after submission.
                      </p>
                    </div>
                    <Button
                      disabled={applyDisabled || applying || Boolean(application)}
                      onClick={handleApply}
                      className="bg-indigo-600 hover:bg-indigo-500"
                    >
                      {application ? "Applied" : applying ? "Submitting…" : "Apply now"}
                    </Button>
                  </div>
                  {!application ? (
                    <Textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Optional cover letter…"
                      className="min-h-[120px] border-white/10 bg-background/50"
                    />
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Application id: <span className="font-mono">{application.id}</span>
                      </p>
                      <ApplicationAnalysisCard application={application} />
                      <Button variant="outline" size="sm" asChild className="border-white/10 bg-white/5">
                        <Link to="/candidate/applications">View all applications</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
