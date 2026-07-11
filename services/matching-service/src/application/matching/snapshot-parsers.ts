import type {
  CandidateProfileResponse,
  EmploymentType,
  JobResponse,
  ParsedResume,
  WorkStyle,
} from "@ai-interviewer/api-types";

export type NormalizedJob = {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  location: string | null;
  workStyle: WorkStyle | null;
  employmentTypes: EmploymentType[];
};

export type NormalizedCandidate = {
  skills: string[];
  experienceTitles: string[];
  experienceDescriptions: string[];
  education: string[];
  projects: string[];
  summary: string;
  resumeText: string;
  desiredRoles: string[];
  preferredLocations: string[];
  workStyle: WorkStyle | null;
  employmentTypes: EmploymentType[];
  githubLanguages: string[];
  coverLetter: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function asEnumArray<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => typeof item === "string" && allowed.includes(item as T));
}

function parseResume(snapshot: Record<string, unknown>): ParsedResume {
  const parsed = asRecord(snapshot.parsedResume);
  return {
    rawText: asString(parsed?.rawText) || asString(snapshot.resumeText),
    name: asString(parsed?.name) || undefined,
    email: asString(parsed?.email) || undefined,
    phone: asString(parsed?.phone) || undefined,
    summary: asString(parsed?.summary) || undefined,
    skills: asStringArray(parsed?.skills),
    experience: asStringArray(parsed?.experience),
    education: asStringArray(parsed?.education),
    projects: asStringArray(parsed?.projects),
  };
}

export function parseJobSnapshot(snapshot: unknown): NormalizedJob {
  const record = asRecord(snapshot);
  const job = record as Partial<JobResponse> | null;

  return {
    title: asString(job?.title),
    description: asString(job?.description),
    requiredSkills: asStringArray(job?.requiredSkills),
    preferredSkills: asStringArray(job?.preferredSkills),
    location: asString(job?.location) || null,
    workStyle: (job?.workStyle as WorkStyle | null | undefined) ?? null,
    employmentTypes: asEnumArray(job?.employmentTypes, ["PERMANENT", "CONTRACT", "INTERNSHIP"] as const),
  };
}

export function parseCandidateSnapshot(snapshot: unknown, coverLetter = ""): NormalizedCandidate {
  const record = asRecord(snapshot);
  const profile = record as Partial<CandidateProfileResponse> | null;
  const resume = record ? parseResume(record) : parseResume({});
  const preferences = asRecord(profile?.preferences);
  const githubMeta = asRecord(profile?.githubMeta);
  const repos = Array.isArray(githubMeta?.repos) ? githubMeta.repos : [];

  const profileSkills = asStringArray(profile?.skills);
  const experience = Array.isArray(profile?.experience) ? profile.experience : [];
  const educationEntries = Array.isArray(profile?.education) ? profile.education : [];

  const experienceTitles = experience
    .map((entry) => {
      const item = asRecord(entry);
      return asString(item?.title);
    })
    .filter(Boolean);

  const experienceDescriptions = experience
    .map((entry) => {
      const item = asRecord(entry);
      const title = asString(item?.title);
      const company = asString(item?.company);
      const description = asString(item?.description);
      return [title, company, description].filter(Boolean).join(" — ");
    })
    .concat(resume.experience);

  const education = educationEntries
    .map((entry) => {
      const item = asRecord(entry);
      const degree = asString(item?.degree);
      const institution = asString(item?.institution);
      return [degree, institution].filter(Boolean).join(" at ");
    })
    .concat(resume.education);

  const githubLanguages = repos
    .map((repo) => {
      const item = asRecord(repo);
      return asString(item?.language);
    })
    .filter(Boolean);

  return {
    skills: [...new Set([...profileSkills, ...resume.skills])],
    experienceTitles,
    experienceDescriptions: experienceDescriptions.filter(Boolean),
    education: education.filter(Boolean),
    projects: resume.projects,
    summary: resume.summary || "",
    resumeText: resume.rawText || asString(profile?.resumeText),
    desiredRoles: asStringArray(preferences?.desiredRoles),
    preferredLocations: asStringArray(preferences?.locations),
    workStyle: (preferences?.workStyle as WorkStyle | null | undefined) ?? null,
    employmentTypes: asEnumArray(preferences?.employmentTypes, ["PERMANENT", "CONTRACT", "INTERNSHIP"] as const),
    githubLanguages,
    coverLetter: coverLetter.trim(),
  };
}
