import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { JobResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CardLoader } from "@/shared/components/loading";
import { useAuth } from "@/features/auth/context/auth-context";
import * as jobApi from "@/features/jobs/services/job-api";
import { getJobStatusLabel } from "@/features/jobs/lib/job-status-labels";

export function RecruiterJobsListPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void jobApi
      .listRecruiterJobs()
      .then(setJobs)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load jobs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Recruiter"
        title={user?.company?.name ?? "Job listings"}
        description="Create drafts, publish openings, and review applicants."
        actions={
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
            <Link to="/recruiter/jobs/new">New job</Link>
          </Button>
        }
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Your job listings</CardTitle>
          <CardDescription>Create jobs as draft, then publish when ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <CardLoader message="Loading jobs…" />
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="divide-y divide-border/60 rounded-xl border border-white/10">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-white/5 sm:p-6"
                >
                  <div className="min-w-48">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {getJobStatusLabel(job.status)}
                      {job.isExpired ? " · expired" : ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {job.location ?? "No location"} · {job.currency}
                    {job.salaryMin ? ` ${job.salaryMin}` : ""}
                    {job.salaryMax ? `–${job.salaryMax}` : ""}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
                      <Link to={`/recruiter/jobs/${job.id}`}>Edit</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
                      <Link to={`/recruiter/jobs/${job.id}/applicants`}>Applicants</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
