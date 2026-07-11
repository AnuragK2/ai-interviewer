import { Link } from "react-router";
import { Mail, Phone } from "lucide-react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { parseCandidateSnapshot } from "@/features/applications/lib/parse-snapshot";

type ApplicantOverviewCardProps = {
  snapshot: unknown;
  candidateName: string | null;
  appliedAt: string;
  jobTitle: string | null;
  jobId: string;
};

export function ApplicantOverviewCard({
  snapshot,
  candidateName,
  appliedAt,
  jobTitle,
  jobId,
}: ApplicantOverviewCardProps) {
  const profile = parseCandidateSnapshot(snapshot);

  return (
    <GlowingCard className="h-full">
      <CardHeader>
        <CardTitle>Applicant overview</CardTitle>
        <CardDescription>Candidate details captured at application time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xl font-semibold">{candidateName ?? profile?.name ?? "Candidate"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Applied {appliedAt.slice(0, 10)}</p>
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">Role: </span>
            <Link to={`/recruiter/jobs/${jobId}/applicants`} className="text-indigo-200 hover:underline">
              {jobTitle ?? "View job applicants"}
            </Link>
          </p>
        </div>

        <div className="space-y-3 text-sm">
          {profile?.email ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{profile.email}</span>
            </div>
          ) : null}
          {profile?.phone ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{profile.phone}</span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-muted-foreground">Profile completeness</p>
            <p className="mt-1 text-lg font-semibold">{profile?.profileCompleteness ?? 0}%</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-muted-foreground">Skills listed</p>
            <p className="mt-1 text-lg font-semibold">{profile?.skills?.length ?? 0}</p>
          </div>
        </div>

        {profile?.parsedResume?.summary ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile summary</p>
            <p className="text-sm leading-relaxed text-foreground/90">{profile.parsedResume.summary}</p>
          </div>
        ) : null}
      </CardContent>
    </GlowingCard>
  );
}
