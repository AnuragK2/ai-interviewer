import type {
  CandidateProfileResponse,
  JobResponse,
  ParsedResume,
} from "@ai-interviewer/api-types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const record = asRecord(item);
      if (record && typeof record.name === "string") return record.name.trim();
      return "";
    })
    .filter(Boolean);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseJobSnapshot(snapshot: unknown): Partial<JobResponse> | null {
  const record = asRecord(snapshot);
  if (!record) return null;

  return {
    id: asString(record.id) ?? undefined,
    title: asString(record.title) ?? "Untitled role",
    description: asString(record.description) ?? "",
    requiredSkills: asStringArray(record.requiredSkills),
    preferredSkills: asStringArray(record.preferredSkills),
    location: asString(record.location),
    salaryMin: asNumber(record.salaryMin),
    salaryMax: asNumber(record.salaryMax),
    currency: asString(record.currency) ?? "USD",
    workStyle: asString(record.workStyle) as JobResponse["workStyle"] | undefined,
    employmentTypes: asStringArray(record.employmentTypes) as JobResponse["employmentTypes"],
    status: asString(record.status) as JobResponse["status"] | undefined,
    expiresAt: asString(record.expiresAt),
    isExpired: record.isExpired === true,
  };
}

function parseExperience(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const title = asString(record.title);
      const company = asString(record.company);
      if (!title || !company) return null;
      return {
        title,
        company,
        startDate: asString(record.startDate) ?? undefined,
        endDate: asString(record.endDate) ?? undefined,
        description: asString(record.description) ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function parseEducation(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const degree = asString(record.degree);
      const institution = asString(record.institution);
      if (!degree || !institution) return null;
      return {
        degree,
        institution,
        startDate: asString(record.startDate) ?? undefined,
        endDate: asString(record.endDate) ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function parseSkills(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { name: item.trim() };
      const record = asRecord(item);
      const name = asString(record?.name);
      if (!name) return null;
      return {
        name,
        proficiency: asString(record?.proficiency) ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function parseParsedResume(value: unknown): ParsedResume | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    rawText: asString(record.rawText) ?? "",
    name: asString(record.name) ?? undefined,
    email: asString(record.email) ?? undefined,
    phone: asString(record.phone) ?? undefined,
    summary: asString(record.summary) ?? undefined,
    skills: asStringArray(record.skills),
    experience: asStringArray(record.experience),
    education: asStringArray(record.education),
    projects: asStringArray(record.projects),
  };
}

export function parseCandidateSnapshot(snapshot: unknown): Partial<CandidateProfileResponse> | null {
  const record = asRecord(snapshot);
  if (!record) return null;

  const preferences = asRecord(record.preferences);
  const links = asRecord(record.links);
  const githubMeta = asRecord(record.githubMeta);
  const resume = asRecord(record.resume);

  return {
    name: asString(record.name),
    email: asString(record.email) ?? "",
    phone: asString(record.phone),
    skills: parseSkills(record.skills),
    experience: parseExperience(record.experience),
    education: parseEducation(record.education),
    preferences: preferences
      ? {
          salaryMin: asNumber(preferences.salaryMin) ?? undefined,
          salaryMax: asNumber(preferences.salaryMax) ?? undefined,
          currency: asString(preferences.currency) ?? undefined,
          desiredRoles: asStringArray(preferences.desiredRoles),
          locations: asStringArray(preferences.locations),
          workStyle: asString(preferences.workStyle) as CandidateProfileResponse["preferences"]["workStyle"],
          employmentTypes: asStringArray(preferences.employmentTypes) as CandidateProfileResponse["preferences"]["employmentTypes"],
        }
      : {},
    links: links
      ? {
          linkedin: asString(links.linkedin) ?? undefined,
          portfolio: asString(links.portfolio) ?? undefined,
          github: asString(links.github) ?? undefined,
          other: asStringArray(links.other),
        }
      : {},
    resume: resume
      ? {
          fileName: asString(resume.fileName) ?? "Resume",
          mimeType: asString(resume.mimeType) ?? "",
          hasFile: resume.hasFile === true,
        }
      : null,
    resumeText: asString(record.resumeText),
    parsedResume: parseParsedResume(record.parsedResume) ?? undefined,
    githubMeta: githubMeta
      ? {
          username: asString(githubMeta.username) ?? "",
          profileUrl: asString(githubMeta.profileUrl) ?? "",
          repos: Array.isArray(githubMeta.repos)
            ? githubMeta.repos
                .map((repo) => {
                  const item = asRecord(repo);
                  if (!item) return null;
                  return {
                    name: asString(item.name) ?? "",
                    fullName: asString(item.fullName) ?? "",
                    description: asString(item.description),
                    starCount: asNumber(item.starCount) ?? 0,
                    language: asString(item.language),
                    url: asString(item.url) ?? "",
                  };
                })
                .filter((item): item is NonNullable<typeof item> => item !== null)
            : [],
        }
      : null,
    profileCompleteness: asNumber(record.profileCompleteness) ?? 0,
    updatedAt: asString(record.updatedAt) ?? undefined,
  };
}

export function formatSalaryRange(input: {
  currency?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
}): string {
  const { currency = "USD", salaryMin, salaryMax } = input;
  if (salaryMin == null && salaryMax == null) return "Not specified";
  if (salaryMin != null && salaryMax != null) return `${currency} ${salaryMin.toLocaleString()} – ${salaryMax.toLocaleString()}`;
  if (salaryMin != null) return `${currency} ${salaryMin.toLocaleString()}+`;
  return `Up to ${currency} ${salaryMax!.toLocaleString()}`;
}

export function formatDateRange(start?: string, end?: string): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  if (end) return end;
  return "";
}

export function getCandidateName(snapshot: unknown): string | null {
  const profile = parseCandidateSnapshot(snapshot);
  return profile?.name ?? profile?.parsedResume?.name ?? null;
}

export function getJobTitle(snapshot: unknown): string | null {
  return parseJobSnapshot(snapshot)?.title ?? null;
}
