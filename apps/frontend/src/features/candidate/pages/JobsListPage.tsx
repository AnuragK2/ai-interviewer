import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { RecommendedJobResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchScoreBadge } from "@/features/jobs/components/MatchScoreBadge";
import { JobFilters } from "@/features/jobs/components/JobFilters";
import {
  collectJobFilterOptions,
  defaultJobListFilters,
  filterJobs,
  type JobListFilters,
} from "@/features/jobs/lib/job-filters";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CardLoader } from "@/shared/components/loading";
import { getAccessToken } from "@/shared/lib/auth-storage";
import * as jobApi from "@/features/jobs/services/job-api";

function formatSalary(job: RecommendedJobResponse) {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${job.currency} ${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()}`;
  }
  if (job.salaryMin != null) return `${job.currency} ${job.salaryMin.toLocaleString()}+`;
  return `Up to ${job.currency} ${job.salaryMax!.toLocaleString()}`;
}

function JobCard({ job }: { job: RecommendedJobResponse }) {
  const salary = formatSalary(job);

  return (
    <div className="space-y-3 p-5 transition-colors hover:bg-white/5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">{job.title}</p>
            <MatchScoreBadge score={job.matchScore} />
            {job.hasApplied ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                Applied
              </span>
            ) : null}
            {job.isRecommended ? (
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                Recommended
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {[job.location ?? "Location flexible", job.workStyle, salary].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
          <Link to={`/candidate/jobs/${job.id}`}>{job.hasApplied ? "View" : "Apply"}</Link>
        </Button>
      </div>
      {job.matchSummary ? <p className="text-sm text-muted-foreground">{job.matchSummary}</p> : null}
      <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
      {job.requiredSkills.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {job.requiredSkills.slice(0, 6).map((skill) => (
            <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {skill}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CandidateJobsListPage() {
  const [jobs, setJobs] = useState<RecommendedJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobListFilters>(defaultJobListFilters);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuthenticated(Boolean(token));

    const loader = token ? jobApi.listRecommendedJobs() : jobApi.listPublicJobs().then((publicJobs) =>
      publicJobs.map((job) => ({
        ...job,
        matchScore: 0,
        matchSummary: null,
        isRecommended: false,
        hasApplied: false,
      })),
    );

    void loader
      .then(setJobs)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load jobs."))
      .finally(() => setLoading(false));
  }, []);

  const filterOptions = useMemo(() => collectJobFilterOptions(jobs), [jobs]);

  const filteredJobs = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);

  const recommendedJobs = filteredJobs.filter((job) => job.isRecommended);
  const otherJobs = filteredJobs.filter((job) => !job.isRecommended);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Jobs"
        title="Browse open roles"
        description={
          isAuthenticated
            ? "Roles are ranked by how well they match your profile."
            : "Sign in to see personalized match scores and recommendations."
        }
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Find your next role</CardTitle>
          <CardDescription>Filter the catalog or jump into roles recommended for your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <JobFilters
            filters={filters}
            onChange={setFilters}
            locations={filterOptions.locations}
            skills={filterOptions.skills}
          />

          {loading ? (
            <CardLoader message="Loading jobs…" />
          ) : filteredJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs match your filters.</p>
          ) : (
            <div className="space-y-8">
              {recommendedJobs.length > 0 ? (
                <section className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Recommended for you</p>
                    <p className="text-xs text-muted-foreground">
                      Based on your skills, experience, and preferences.
                    </p>
                  </div>
                  <div className="divide-y divide-border/60 rounded-xl border border-white/10">
                    {recommendedJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{recommendedJobs.length > 0 ? "All jobs" : "Open jobs"}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAuthenticated ? "Every open role includes a profile match score." : "Log in to unlock match scores."}
                  </p>
                </div>
                <div className="divide-y divide-border/60 rounded-xl border border-white/10">
                  {(recommendedJobs.length > 0 ? otherJobs : filteredJobs).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            </div>
          )}
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
