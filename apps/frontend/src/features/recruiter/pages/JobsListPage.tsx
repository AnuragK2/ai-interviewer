import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { JobResponse } from "@ai-interviewer/api-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/shared/components/PageShell";
import { useAuth } from "@/features/auth/context/auth-context";
import * as jobApi from "@/features/jobs/services/job-api";

export function RecruiterJobsListPage() {
  const { user, logout } = useAuth();
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
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-amber-400">Recruiter jobs</p>
            <h1 className="text-3xl font-semibold">{user?.company?.name ?? "Jobs"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/recruiter/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Your job listings</CardTitle>
              <CardDescription>Create jobs as draft, then publish when ready.</CardDescription>
            </div>
            <Button asChild>
              <Link to="/recruiter/jobs/new">New job</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {jobs.map((job) => (
                  <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-48">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.status}
                        {job.isExpired ? " · expired" : ""}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.location ?? "No location"} · {job.currency}
                      {job.salaryMin ? ` ${job.salaryMin}` : ""}
                      {job.salaryMax ? `–${job.salaryMax}` : ""}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/recruiter/jobs/${job.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

