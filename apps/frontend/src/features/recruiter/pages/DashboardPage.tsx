import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { RecruiterDashboardResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as applicationApi from "@/features/applications/services/application-api";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
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

export function RecruiterDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<RecruiterDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void applicationApi
      .getRecruiterDashboard()
      .then(setDashboard)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Recruiter"
        title={user?.company?.name ?? "Your company"}
        description={`Workspace overview for ${user?.company?.slug ?? "your tenant"}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link to="/recruiter/jobs/new">Create job</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/5">
              <Link to="/recruiter/jobs">Manage jobs</Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      ) : !dashboard ? (
        <p className="text-sm text-muted-foreground">Dashboard unavailable.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Open jobs" value={dashboard.openJobsCount} />
            <StatCard label="New applicants (7d)" value={dashboard.newApplicantsLast7Days} />
            <StatCard label="Awaiting review" value={dashboard.awaitingReviewCount} hint="Analyzed, not invited" />
            <StatCard
              label="Awaiting interview feedback"
              value={dashboard.awaitingInterviewFeedbackCount}
              hint="Completed interviews to review"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <GlowingCard>
              <CardHeader>
                <CardTitle>Applicant pipeline</CardTitle>
                <CardDescription>How candidates are moving through your hiring funnel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.pipelineFunnel.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applicants yet.</p>
                ) : (
                  dashboard.pipelineFunnel.map((stage) => (
                    <div
                      key={stage.status}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-sm font-medium">{stage.label}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                        {stage.count}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </GlowingCard>

            <GlowingCard>
              <CardHeader>
                <CardTitle>Expiring jobs</CardTitle>
                <CardDescription>Open roles closing within the next 14 days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.expiringJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No jobs expiring soon.</p>
                ) : (
                  dashboard.expiringJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires {job.expiresAt.slice(0, 10)} · {job.daysRemaining} days left
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="border-white/10 bg-white/5">
                        <Link to={`/recruiter/jobs/${job.id}`}>Edit</Link>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </GlowingCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
