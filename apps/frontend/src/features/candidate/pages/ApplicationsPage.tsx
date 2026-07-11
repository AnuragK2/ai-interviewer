import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { ApplicationResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { ApplicationAnalysisCard } from "@/features/applications/components/ApplicationAnalysisCard";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import * as applicationApi from "@/features/applications/services/application-api";

function statusBadgeClasses(status: ApplicationResponse["status"]) {
  switch (status) {
    case "ANALYZED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "ANALYZING":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
    default:
      return "border-border bg-muted/20 text-muted-foreground";
  }
}

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
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
        description="Track fit analysis for each job you applied to."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : applications.length === 0 ? (
        <GlowingCard>
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        </GlowingCard>
      ) : (
        <div className="space-y-4">
          {applications.map((app, index) => (
            <GlowingCard key={app.id} delay={index * 0.05}>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClasses(app.status)}`}>
                        {app.status}
                      </span>
                      <span className="text-xs text-muted-foreground">Submitted {app.createdAt.slice(0, 10)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Job:{" "}
                      <Link to={`/candidate/jobs/${app.jobId}`} className="text-indigo-300 hover:underline">
                        View job
                      </Link>
                    </p>
                  </div>
                </div>

                <ApplicationAnalysisCard application={app} />
              </div>
            </GlowingCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
