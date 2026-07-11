import type { CandidateProfileResponse } from "@ai-interviewer/api-types";
import { formatDateRange, parseCandidateSnapshot } from "@/features/applications/lib/parse-snapshot";

type CandidateSnapshotViewProps = {
  snapshot: unknown;
};

function SectionTitle({ children }: { children: string }) {
  return <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</p>;
}

function SkillPills({ skills }: { skills: { name: string; proficiency?: string }[] }) {
  if (skills.length === 0) return <p className="text-sm text-muted-foreground">No skills listed</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={`${skill.name}-${skill.proficiency ?? ""}`}
          className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
        >
          {skill.name}
          {skill.proficiency ? <span className="text-emerald-200/70"> · {skill.proficiency}</span> : null}
        </span>
      ))}
    </div>
  );
}

function LinkList({ links }: { links: CandidateProfileResponse["links"] }) {
  const items = [
    links.github ? { label: "GitHub", href: links.github } : null,
    links.linkedin ? { label: "LinkedIn", href: links.linkedin } : null,
    links.portfolio ? { label: "Portfolio", href: links.portfolio } : null,
    ...(links.other ?? []).map((href) => ({ label: "Link", href })),
  ].filter((item): item is { label: string; href: string } => item !== null);

  if (items.length === 0) return <p className="text-sm text-muted-foreground">No links provided</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200 hover:bg-white/10 hover:underline"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

export function CandidateSnapshotView({ snapshot }: CandidateSnapshotViewProps) {
  const profile = parseCandidateSnapshot(snapshot);

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Candidate snapshot unavailable.</p>;
  }

  const parsedResume = profile.parsedResume;
  const resumeProjects = parsedResume?.projects ?? [];
  const resumeExperience = parsedResume?.experience ?? [];
  const resumeEducation = parsedResume?.education ?? [];
  const githubRepos = profile.githubMeta?.repos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold">{profile.name ?? "Candidate"}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          {profile.phone ? <p className="text-sm text-muted-foreground">{profile.phone}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Profile completeness</p>
          <p className="text-2xl font-semibold">{profile.profileCompleteness ?? 0}%</p>
        </div>
      </div>

      {parsedResume?.summary ? (
        <div className="space-y-2">
          <SectionTitle>Summary</SectionTitle>
          <p className="text-sm leading-relaxed text-foreground/90">{parsedResume.summary}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <SectionTitle>Skills</SectionTitle>
        <SkillPills skills={profile.skills ?? []} />
      </div>

      <div className="space-y-3">
        <SectionTitle>Experience</SectionTitle>
        {profile.experience && profile.experience.length > 0 ? (
          <div className="space-y-3">
            {profile.experience.map((entry, index) => (
              <div key={`${entry.title}-${entry.company}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{entry.title}</p>
                    <p className="text-sm text-muted-foreground">{entry.company}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateRange(entry.startDate, entry.endDate) || "Dates not specified"}
                  </p>
                </div>
                {entry.description ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{entry.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : resumeExperience.length > 0 ? (
          <ul className="space-y-2 text-sm leading-relaxed text-foreground/90">
            {resumeExperience.map((item, index) => (
              <li key={index} className="rounded-lg border border-white/10 bg-white/5 p-3">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No experience listed</p>
        )}
      </div>

      <div className="space-y-3">
        <SectionTitle>Education</SectionTitle>
        {profile.education && profile.education.length > 0 ? (
          <div className="space-y-2">
            {profile.education.map((entry, index) => (
              <div key={`${entry.degree}-${entry.institution}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium">{entry.degree}</p>
                <p className="text-sm text-muted-foreground">{entry.institution}</p>
                {formatDateRange(entry.startDate, entry.endDate) ? (
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateRange(entry.startDate, entry.endDate)}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : resumeEducation.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {resumeEducation.map((item, index) => (
              <li key={index} className="rounded-lg border border-white/10 bg-white/5 p-3">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No education listed</p>
        )}
      </div>

      {resumeProjects.length > 0 ? (
        <div className="space-y-3">
          <SectionTitle>Projects</SectionTitle>
          <ul className="space-y-2">
            {resumeProjects.map((project, index) => (
              <li key={index} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed">
                {project}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {githubRepos.length > 0 ? (
        <div className="space-y-3">
          <SectionTitle>GitHub highlights</SectionTitle>
          <div className="grid gap-2">
            {githubRepos.slice(0, 6).map((repo) => (
              <a
                key={repo.fullName || repo.name}
                href={repo.url || undefined}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{repo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {repo.language ?? "Unknown"}
                    {repo.starCount ? ` · ${repo.starCount} stars` : ""}
                  </p>
                </div>
                {repo.description ? <p className="mt-1 text-xs text-muted-foreground">{repo.description}</p> : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <SectionTitle>Preferences</SectionTitle>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Desired roles: </span>
              {profile.preferences?.desiredRoles?.length ? profile.preferences.desiredRoles.join(", ") : "—"}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Locations: </span>
              {profile.preferences?.locations?.length ? profile.preferences.locations.join(", ") : "—"}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Work style: </span>
              {profile.preferences?.workStyle ?? "—"}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Employment: </span>
              {profile.preferences?.employmentTypes?.length ? profile.preferences.employmentTypes.join(", ") : "—"}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <SectionTitle>Links & resume</SectionTitle>
          <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <LinkList links={profile.links ?? {}} />
            {profile.resume?.hasFile ? (
              <p className="text-sm text-muted-foreground">
                Resume on file: <span className="text-foreground">{profile.resume.fileName}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No resume file attached</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
