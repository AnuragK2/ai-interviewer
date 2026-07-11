import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { CandidateDashboardResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchScoreBadge } from "@/features/jobs/components/MatchScoreBadge";
import { getApplicationStatusLabel } from "@/features/applications/lib/application-status-labels";
import * as applicationApi from "@/features/applications/services/application-api";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CardLoader } from "@/shared/components/loading";
import { useAuth } from "@/features/auth/context/auth-context";

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CandidateDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<CandidateDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void applicationApi
      .getCandidateDashboard()
      .then(setDashboard)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Candidate"
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Your applications, interviews, and recommended roles at a glance."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link to="/candidate/jobs">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/5">
              <Link to="/candidate/applications">Applications</Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <CardLoader message="Loading dashboard…" />
      ) : !dashboard ? (
        <p className="text-sm text-muted-foreground">Dashboard unavailable.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active applications" value={dashboard.totalApplications} />
            <StatCard label="Pending interviews" value={dashboard.pendingInterviews} hint="Invited but not started" />
            <StatCard
              label="Profile completeness"
              value={dashboard.profileCompleteness != null ? `${dashboard.profileCompleteness}%` : "—"}
              hint="Complete your profile to improve matches"
            />
            <StatCard
              label="Analyzed applications"
              value={dashboard.applicationsByStatus.find((item) => item.status === "ANALYZED")?.count ?? 0}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <GlowingCard>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest updates across your applications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.recentApplications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications yet.</p>
                ) : (
                  dashboard.recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <p className="font-medium">{application.jobTitle ?? "Role"}</p>
                        <p className="text-xs text-muted-foreground">
                          {getApplicationStatusLabel(application.status)} · Updated {application.updatedAt.slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {application.fitScore != null ? <MatchScoreBadge score={application.fitScore} /> : null}
                        <Button asChild size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <Link to={`/candidate/applications/${application.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </GlowingCard>

            <GlowingCard>
              <CardHeader>
                <CardTitle>Recommended jobs</CardTitle>
                <CardDescription>Top matches based on your current profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.topRecommendedJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No strong recommendations yet. Update your profile or browse the full catalog.
                  </p>
                ) : (
                  dashboard.topRecommendedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.location ?? "Flexible location"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MatchScoreBadge score={job.matchScore} />
                        <Button asChild size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <Link to={`/candidate/jobs/${job.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </GlowingCard>
          </div>

          <GlowingCard>
            <CardHeader>
              <CardTitle>Application status breakdown</CardTitle>
              <CardDescription>Where your applications sit in the pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.applicationsByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Apply to a job to start tracking progress.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {dashboard.applicationsByStatus.map((item) => (
                    <div key={item.status} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {getApplicationStatusLabel(item.status)}
                      </p>
                      <p className="mt-2 text-xl font-semibold">{item.count}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </GlowingCard>

          <GlowingCard>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Stronger profiles lead to better recommendations and recruiter visibility.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
                <Link to="/candidate/profile">Update profile</Link>
              </Button>
            </CardContent>
          </GlowingCard>
        </div>
      )}
    </PageContainer>
  );
}
