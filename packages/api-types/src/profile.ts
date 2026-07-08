import { z } from "zod";
import type { GithubProfileData, ParsedResume } from "./resume";

export type WorkStyle = "REMOTE" | "HYBRID" | "ONSITE";
export type EmploymentType = "PERMANENT" | "CONTRACT" | "INTERNSHIP";

export type SkillEntry = {
  name: string;
  proficiency?: string;
};

export type ExperienceEntry = {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type EducationEntry = {
  degree: string;
  institution: string;
  startDate?: string;
  endDate?: string;
};

export type ProfilePreferences = {
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  desiredRoles?: string[];
  locations?: string[];
  workStyle?: WorkStyle;
  employmentTypes?: EmploymentType[];
};

export type ProfileLinks = {
  linkedin?: string;
  portfolio?: string;
  github?: string;
  other?: string[];
};

export type ProfileResumeInfo = {
  fileName: string;
  mimeType: string;
  hasFile: boolean;
};

export type CandidateProfileResponse = {
  userId: string;
  email: string;
  name: string | null;
  phone: string | null;
  photoUrl: string | null;
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  preferences: ProfilePreferences;
  links: ProfileLinks;
  resume: ProfileResumeInfo | null;
  resumeText: string | null;
  parsedResume: ParsedResume;
  githubMeta: GithubProfileData | null;
  profileCompleteness: number;
  updatedAt: string;
};

export type UpdateCandidateProfileRequest = {
  name?: string;
  phone?: string;
  photoUrl?: string;
  skills?: SkillEntry[];
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  preferences?: ProfilePreferences;
  links?: ProfileLinks;
};

const SkillEntrySchema = z.object({
  name: z.string().trim().min(1),
  proficiency: z.string().trim().optional(),
});

const ExperienceEntrySchema = z.object({
  title: z.string().trim().min(1),
  company: z.string().trim().min(1),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

const EducationEntrySchema = z.object({
  degree: z.string().trim().min(1),
  institution: z.string().trim().min(1),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

const ProfilePreferencesSchema = z.object({
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  currency: z.string().trim().optional(),
  desiredRoles: z.array(z.string().trim().min(1)).optional(),
  locations: z.array(z.string().trim().min(1)).optional(),
  workStyle: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  employmentTypes: z.array(z.enum(["PERMANENT", "CONTRACT", "INTERNSHIP"])).optional(),
});

const ProfileLinksSchema = z.object({
  linkedin: z.string().trim().optional(),
  portfolio: z.string().trim().optional(),
  github: z.string().trim().optional(),
  other: z.array(z.string().trim().min(1)).optional(),
});

export const UpdateCandidateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
  skills: z.array(SkillEntrySchema).optional(),
  experience: z.array(ExperienceEntrySchema).optional(),
  education: z.array(EducationEntrySchema).optional(),
  preferences: ProfilePreferencesSchema.optional(),
  links: ProfileLinksSchema.optional(),
});

export type ResumeDownloadResponse = {
  url: string;
  fileName: string;
};
