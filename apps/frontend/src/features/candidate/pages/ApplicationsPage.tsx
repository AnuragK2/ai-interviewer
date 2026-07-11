import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { ApplicationListItem } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { MatchScoreBadge } from "@/features/jobs/components/MatchScoreBadge";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CardLoader } from "@/shared/components/loading";
import * as applicationApi from "@/features/applications/services/application-api";
import {
  applicationStatusFilterOptions,
  countApplicationsByFilter,
  matchesApplicationStatusFilter,
  type ApplicationStatusFilter,
} from "@/features/applications/lib/application-status-filter";

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>("ALL");

  const filteredApplications = useMemo(
    () => applications.filter((app) => matchesApplicationStatusFilter(app.status, statusFilter)),
    [applications, statusFilter],
  );

  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        applicationStatusFilterOptions.map((option) => [
          option.value,
          countApplicationsByFilter(
            applications.map((app) => app.status),
            option.value,
          ),
        ]),
      ) as Record<ApplicationStatusFilter, number>,
    [applications],
  );

  const loadApplications = useCallback(async () => {
    try {
      const next = await applicationApi.listMyApplications();
      setApplications(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    const hasPending = applications.some((app) => app.status === "ANALYZING");
    if (!hasPending) return;

    const interval = window.setInterval(() => {
      void loadApplications();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [applications, loadApplications]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Applications"
        title="Your applications"
        description="Track every role you applied to, with fit scores and pipeline status."
        actions={
          <Button asChild variant="outline" className="border-white/10 bg-white/5">
            <Link to="/candidate/jobs">Browse jobs</Link>
          </Button>
        }
      />

      {loading ? (
        <CardLoader message="Loading applications…" />
      ) : applications.length === 0 ? (
        <GlowingCard>
          <p className="p-1 text-sm text-muted-foreground">No applications yet. Browse jobs to get started.</p>
        </GlowingCard>
      ) : (
        <GlowingCard>
          <div className="space-y-4 border-b border-white/10 px-4 py-4 sm:px-6">
            <div>
              <p className="text-sm font-medium">Filter by status</p>
              <p className="text-xs text-muted-foreground">Quickly narrow applications by where they are in the pipeline.</p>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Filter applications by status"
            >
              {applicationStatusFilterOptions.map((option) => {
                const selected = statusFilter === option.value;
                const count = statusCounts[option.value];

                return (
                  <label
                    key={option.value}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-100"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="application-status-filter"
                      value={option.value}
                      checked={selected}
                      onChange={() => setStatusFilter(option.value)}
                      className="sr-only"
                    />
                    <span>{option.label}</span>
                    <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground sm:px-6">
              No applications match the {applicationStatusFilterOptions.find((option) => option.value === statusFilter)?.label.toLowerCase()} filter.
            </p>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Match</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="border-b border-white/5 align-top">
                    <td className="px-4 py-4">
                      <p className="font-medium">{app.jobTitle ?? "Role"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Application {app.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-4">
                      {app.fitScore != null ? (
                        <MatchScoreBadge score={app.fitScore} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{app.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline" className="border-white/10 bg-white/5">
                          <Link to={`/candidate/jobs/${app.jobId}`}>Job</Link>
                        </Button>
                        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                          <Link to={`/candidate/applications/${app.id}`}>Analytics</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </GlowingCard>
      )}
    </PageContainer>
  );
}
