import type { JobResponse } from "@ai-interviewer/api-types";
import { formatSalaryRange, parseJobSnapshot } from "@/features/applications/lib/parse-snapshot";
import { getJobStatusLabel } from "@/features/jobs/lib/job-status-labels";

type JobSnapshotViewProps = {
  snapshot: unknown;
};

function SkillPills({ skills, tone }: { skills: string[]; tone: "required" | "preferred" }) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">None listed</p>;
  }

  const classes =
    tone === "required"
      ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-100"
      : "border-white/10 bg-white/5 text-foreground";

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill} className={`rounded-full border px-3 py-1 text-xs ${classes}`}>
          {skill}
        </span>
      ))}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

export function JobSnapshotView({ snapshot }: JobSnapshotViewProps) {
  const job = parseJobSnapshot(snapshot);

  if (!job) {
    return <p className="text-sm text-muted-foreground">Job snapshot unavailable.</p>;
  }

  const typedJob = job as Partial<JobResponse>;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-lg font-semibold">{typedJob.title}</p>
            {typedJob.location ? <p className="text-sm text-muted-foreground">{typedJob.location}</p> : null}
          </div>
          {typedJob.status ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-muted-foreground">
              {getJobStatusLabel(typedJob.status)}
              {typedJob.isExpired ? " · expired" : ""}
            </span>
          ) : null}
        </div>

        {typedJob.description ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{typedJob.description}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Required skills</p>
          <SkillPills skills={typedJob.requiredSkills ?? []} tone="required" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preferred skills</p>
          <SkillPills skills={typedJob.preferredSkills ?? []} tone="preferred" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem label="Work style" value={typedJob.workStyle ?? "Not specified"} />
        <MetaItem
          label="Employment type"
          value={typedJob.employmentTypes?.length ? typedJob.employmentTypes.join(", ") : "Not specified"}
        />
        <MetaItem
          label="Salary"
          value={formatSalaryRange({
            currency: typedJob.currency,
            salaryMin: typedJob.salaryMin,
            salaryMax: typedJob.salaryMax,
          })}
        />
        <MetaItem label="Expires" value={typedJob.expiresAt ? typedJob.expiresAt.slice(0, 10) : "Not set"} />
      </div>
    </div>
  );
}
