import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { RecruiterDashboardResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { ApplicationStatusPieChart } from "@/features/applications/components/ApplicationStatusPieChart";
import { MatchScoreBadge } from "@/features/jobs/components/MatchScoreBadge";
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
        <CardLoader message="Loading dashboard…" />
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

          <div className="grid gap-6 xl:grid-cols-2">
            <GlowingCard>
              <CardHeader>
                <CardTitle>Applications by status</CardTitle>
                <CardDescription>Distribution of candidates across your hiring pipeline.</CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationStatusPieChart data={dashboard.applicationsByStatus} />
              </CardContent>
            </GlowingCard>

            <GlowingCard>
              <CardHeader>
                <CardTitle>Recent applications</CardTitle>
                <CardDescription>Latest candidates who applied to your open roles.</CardDescription>
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
                      <div className="min-w-0">
                        <p className="font-medium">{application.candidateName ?? "Unknown candidate"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {application.jobTitle ?? "Role"} · Applied {application.createdAt.slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ApplicationStatusBadge status={application.status} />
                        {application.fitScore != null ? <MatchScoreBadge score={application.fitScore} /> : null}
                        <Button asChild size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <Link to={`/recruiter/applications/${application.id}`}>View</Link>
                        </Button>
                      </div>
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
