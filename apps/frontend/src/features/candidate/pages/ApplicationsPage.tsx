import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { ApplicationListItem, ApplicationResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { MatchScoreBadge } from "@/features/jobs/components/MatchScoreBadge";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import * as applicationApi from "@/features/applications/services/application-api";

function statusBadgeClasses(status: ApplicationResponse["status"]) {
  switch (status) {
    case "ANALYZED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "ANALYZING":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
    case "INTERVIEW_INVITED":
    case "INTERVIEW_PENDING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "INTERVIEW_IN_PROGRESS":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "INTERVIEW_COMPLETED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "INTERVIEW_CANCELLED":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    default:
      return "border-border bg-muted/20 text-muted-foreground";
  }
}

function formatStatus(status: ApplicationResponse["status"]) {
  return status.replaceAll("_", " ");
}

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : applications.length === 0 ? (
        <GlowingCard>
          <p className="p-1 text-sm text-muted-foreground">No applications yet. Browse jobs to get started.</p>
        </GlowingCard>
      ) : (
        <GlowingCard>
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
                {applications.map((app) => (
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
                      <span className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClasses(app.status)}`}>
                        {formatStatus(app.status)}
                      </span>
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
        </GlowingCard>
      )}
    </PageContainer>
  );
}
