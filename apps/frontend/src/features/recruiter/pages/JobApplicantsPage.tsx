import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { ApplicationResponse, JobResponse } from "@ai-interviewer/api-types";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/features/applications/components/ApplicationStatusBadge";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { PageLoader } from "@/shared/components/loading";
import { useAuth } from "@/features/auth/context/auth-context";
import * as applicationApi from "@/features/applications/services/application-api";
import * as jobApi from "@/features/jobs/services/job-api";

export function RecruiterJobApplicantsPage() {
  const { user } = useAuth();
  const { id } = useParams();

  const [job, setJob] = useState<JobResponse | null>(null);
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void Promise.all([jobApi.getJob(id), applicationApi.listApplicantsForJob(id)])
      .then(([j, apps]) => {
        setJob(j);
        setApplications(apps);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load applicants."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Applicants"
        title={job?.title ?? "Job applicants"}
        description={user?.company?.name}
        actions={
          <Button asChild variant="outline" className="border-white/10 bg-white/5">
            <Link to={id ? `/recruiter/jobs/${id}` : "/recruiter/jobs"}>Back to job</Link>
          </Button>
        }
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>{loading ? "Loading applicants…" : `${applications.length} applicants`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <PageLoader message="Loading applicants…" minHeight="min-h-40" />
          ) : applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applicants yet.</p>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:p-6"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ApplicationStatusBadge status={app.status} />
                    <span className="text-xs text-muted-foreground">
                      Applied {app.createdAt.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{app.candidateName ?? "Unknown candidate"}</p>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <div className="text-sm text-muted-foreground">
                    {app.fitScore !== null ? `Fit: ${app.fitScore}/100` : "Analysis pending…"}
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
                    <Link to={`/recruiter/applications/${app.id}`}>View application</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
