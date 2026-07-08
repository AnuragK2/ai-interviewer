import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { JobResponse } from "@ai-interviewer/api-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/shared/components/PageShell";
import { useAuth } from "@/features/auth/context/auth-context";
import * as jobApi from "@/features/jobs/services/job-api";

export function CandidateJobDetailPage() {
  const { id } = useParams();
  const { logout } = useAuth();
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
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-teal-400">Job detail</p>
            <h1 className="text-3xl font-semibold">{loading ? "Loading…" : job?.title ?? "Job"}</h1>
            <p className="text-sm text-muted-foreground">{job?.location ?? ""}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/candidate/jobs">Back to jobs</Link>
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About the role</CardTitle>
            <CardDescription>
              {job?.status ? `Status: ${job.status}` : ""} {job?.isExpired ? "· expired" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                          <span key={skill} className="rounded-full border border-border px-3 py-1 text-xs">
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
                          <span key={skill} className="rounded-full border border-border px-3 py-1 text-xs">
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

                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Apply flow is Phase 4. For now, recruiters can publish jobs and candidates can browse.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

