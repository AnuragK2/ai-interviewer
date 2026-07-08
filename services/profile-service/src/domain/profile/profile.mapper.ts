import type {
  CandidateProfileResponse,
  EducationEntry,
  ExperienceEntry,
  GithubProfileData,
  ParsedResume,
  ProfileLinks,
  ProfilePreferences,
  SkillEntry,
  UpdateCandidateProfileRequest,
} from "@ai-interviewer/api-types";

export function calculateProfileCompleteness(profile: {
  name: string | null;
  phone: string | null;
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  preferences: ProfilePreferences;
  links: ProfileLinks;
  resumeObjectKey: string | null;
}): number {
  let score = 0;

  if (profile.name?.trim()) score += 10;
  if (profile.phone?.trim()) score += 5;
  if (profile.skills.length > 0) score += 15;
  if (profile.experience.length > 0) score += 15;
  if (profile.education.length > 0) score += 10;

  const prefs = profile.preferences;
  if (prefs.workStyle) score += 5;
  if ((prefs.desiredRoles?.length ?? 0) > 0 || (prefs.locations?.length ?? 0) > 0) score += 5;
  if (prefs.salaryMin != null || prefs.salaryMax != null) score += 5;

  if (profile.links.github?.trim() || profile.links.linkedin?.trim()) score += 10;
  if (profile.resumeObjectKey) score += 20;

  return Math.min(100, score);
}

export function mergeParsedResumeIntoProfile(
  current: UpdateCandidateProfileRequest,
  parsed: ParsedResume,
): UpdateCandidateProfileRequest {
  const merged: UpdateCandidateProfileRequest = { ...current };

  if (!merged.name && parsed.name) merged.name = parsed.name;
  if (!merged.phone && parsed.phone) merged.phone = parsed.phone;

  if ((merged.skills?.length ?? 0) === 0 && parsed.skills.length > 0) {
    merged.skills = parsed.skills.map((name) => ({ name }));
  }

  if ((merged.experience?.length ?? 0) === 0 && parsed.experience.length > 0) {
    merged.experience = parsed.experience.map((line) => ({
      title: line,
      company: "—",
      description: line,
    }));
  }

  if ((merged.education?.length ?? 0) === 0 && parsed.education.length > 0) {
    merged.education = parsed.education.map((line) => ({
      degree: line,
      institution: "—",
    }));
  }

  return merged;
}

export function toCandidateProfileResponse(
  row: {
    userId: string;
    name: string | null;
    phone: string | null;
    photoUrl: string | null;
    skills: unknown;
    experience: unknown;
    education: unknown;
    preferences: unknown;
    links: unknown;
    resumeObjectKey: string | null;
    resumeFileName: string | null;
    resumeMimeType: string | null;
    resumeText: string | null;
    parsedResume: unknown;
    githubMeta: unknown;
    profileCompleteness: number;
    updatedAt: Date;
  },
  email: string,
): CandidateProfileResponse {
  return {
    userId: row.userId,
    email,
    name: row.name,
    phone: row.phone,
    photoUrl: row.photoUrl,
    skills: (row.skills as SkillEntry[]) ?? [],
    experience: (row.experience as ExperienceEntry[]) ?? [],
    education: (row.education as EducationEntry[]) ?? [],
    preferences: (row.preferences as ProfilePreferences) ?? {},
    links: (row.links as ProfileLinks) ?? {},
    resume: row.resumeObjectKey
      ? {
          fileName: row.resumeFileName ?? "resume",
          mimeType: row.resumeMimeType ?? "application/octet-stream",
          hasFile: true,
        }
      : null,
    resumeText: row.resumeText,
    parsedResume: (row.parsedResume as ParsedResume) ?? { rawText: "", skills: [], experience: [], education: [], projects: [] },
    githubMeta: (() => {
      const meta = row.githubMeta as GithubProfileData | null;
      return meta?.username ? meta : null;
    })(),
    profileCompleteness: row.profileCompleteness,
    updatedAt: row.updatedAt.toISOString(),
  };
}
