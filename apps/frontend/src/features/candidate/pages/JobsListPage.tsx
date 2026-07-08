import type { JobResponse } from "@ai-interviewer/api-types";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/shared/components/PageShell";
import { useAuth } from "@/features/auth/context/auth-context";
import * as jobApi from "@/features/jobs/services/job-api";

export function CandidateJobsListPage() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void jobApi
      .listPublicJobs()
      .then(setJobs)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load jobs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-teal-400">Jobs</p>
            <h1 className="text-3xl font-semibold">Browse open roles</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/candidate/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Open jobs</CardTitle>
            <CardDescription>No recommendations yet — Phase 7 adds ranking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open jobs yet.</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {jobs.map((job) => (
                  <div key={job.id} className="space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.location ?? "Location not set"}</p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/candidate/jobs/${job.id}`}>View</Link>
                      </Button>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
                    {job.requiredSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {job.requiredSkills.slice(0, 8).map((skill) => (
                          <span key={skill} className="rounded-full border border-border px-3 py-1 text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}
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

