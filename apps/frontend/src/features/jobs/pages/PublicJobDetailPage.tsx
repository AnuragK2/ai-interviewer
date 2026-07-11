import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { JobResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JobShareButtons } from "@/features/jobs/components/JobShareButtons";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CardLoader } from "@/shared/components/loading";
import * as jobApi from "@/features/jobs/services/job-api";
import { getJobStatusLabel } from "@/features/jobs/lib/job-status-labels";

export function PublicJobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    void jobApi
      .getJob(id)
      .then(setJob)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load job."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <PageContainer size="md">
      <PageHeader
        eyebrow="Open role"
        title={loading ? "Loading…" : (job?.title ?? "Job")}
        description={job?.location ?? undefined}
        actions={
          <Button asChild variant="outline" className="border-white/10 bg-white/5">
            <Link to="/login">Sign in to apply</Link>
          </Button>
        }
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>About the role</CardTitle>
          <CardDescription>
            {job?.status ? `Status: ${getJobStatusLabel(job.status)}` : ""} {job?.isExpired ? "· expired" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <CardLoader message="Loading job details…" />
          ) : !job ? (
            <p className="text-sm text-muted-foreground">Job not found.</p>
          ) : (
            <>
              {job.status === "OPEN" && !job.isExpired ? (
                <JobShareButtons job={job} />
              ) : null}

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

              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Interested in this role?</p>
                    <p className="text-xs text-muted-foreground">Create an account or sign in to apply.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
                      <Link to="/register">Create account</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-white/10 bg-white/5">
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
