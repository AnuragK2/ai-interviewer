import type { JobResponse } from "@ai-interviewer/api-types";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import * as jobApi from "@/features/jobs/services/job-api";

export function CandidateJobsListPage() {
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
    <PageContainer>
      <PageHeader
        eyebrow="Jobs"
        title="Browse open roles"
        description="Explore published positions and apply with your profile."
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Open jobs</CardTitle>
          <CardDescription>Personalized recommendations arrive in Phase 7.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open jobs yet.</p>
          ) : (
            <div className="divide-y divide-border/60 rounded-xl border border-white/10">
              {jobs.map((job) => (
                <div key={job.id} className="space-y-3 p-5 transition-colors hover:bg-white/5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.location ?? "Location not set"}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
                      <Link to={`/candidate/jobs/${job.id}`}>View</Link>
                    </Button>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
                  {job.requiredSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {job.requiredSkills.slice(0, 8).map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
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
      </GlowingCard>
    </PageContainer>
  );
}
