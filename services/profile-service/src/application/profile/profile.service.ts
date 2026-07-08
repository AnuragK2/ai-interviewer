import type {
  CandidateProfileResponse,
  GithubProfileData,
  UpdateCandidateProfileRequest,
} from "@ai-interviewer/api-types";
import { isAllowedResumeFile, parseResumeFile } from "@ai-interviewer/resume-parser";
import { prisma } from "../../infrastructure/db/prisma.client";
import {
  fetchGithubRepos,
  parseGithubUsername,
  toGithubRepoSummary,
} from "../../infrastructure/github/github.client";
import {
  deleteResumeFile,
  getResumeDownloadUrl,
  storeResumeFile,
} from "../../infrastructure/storage/resume.storage";
import {
  calculateProfileCompleteness,
  mergeParsedResumeIntoProfile,
  toCandidateProfileResponse,
} from "../../domain/profile/profile.mapper";

export class ProfileError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

async function getOrCreateProfile(userId: string) {
  const existing = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.candidateProfile.create({
    data: { userId },
  });
}

function jsonFieldsFromUpdate(input: UpdateCandidateProfileRequest) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
    ...(input.skills !== undefined ? { skills: input.skills } : {}),
    ...(input.experience !== undefined ? { experience: input.experience } : {}),
    ...(input.education !== undefined ? { education: input.education } : {}),
    ...(input.preferences !== undefined ? { preferences: input.preferences } : {}),
    ...(input.links !== undefined ? { links: input.links } : {}),
  };
}

async function saveWithCompleteness(
  userId: string,
  email: string,
  data: ReturnType<typeof jsonFieldsFromUpdate> & {
    resumeObjectKey?: string | null;
    resumeFileName?: string | null;
    resumeMimeType?: string | null;
    resumeText?: string | null;
    parsedResume?: object;
    githubMeta?: object;
  },
): Promise<CandidateProfileResponse> {
  const current = await getOrCreateProfile(userId);
  const merged = { ...current, ...data };

  const profileCompleteness = calculateProfileCompleteness({
    name: merged.name ?? null,
    phone: merged.phone ?? null,
    skills: (merged.skills as CandidateProfileResponse["skills"]) ?? [],
    experience: (merged.experience as CandidateProfileResponse["experience"]) ?? [],
    education: (merged.education as CandidateProfileResponse["education"]) ?? [],
    preferences: (merged.preferences as CandidateProfileResponse["preferences"]) ?? {},
    links: (merged.links as CandidateProfileResponse["links"]) ?? {},
    resumeObjectKey: merged.resumeObjectKey ?? null,
  });

  const updated = await prisma.candidateProfile.update({
    where: { userId },
    data: {
      ...data,
      profileCompleteness,
    },
  });

  return toCandidateProfileResponse(updated, email);
}

export async function getMyProfile(userId: string, email: string): Promise<CandidateProfileResponse> {
  const profile = await getOrCreateProfile(userId);
  return toCandidateProfileResponse(profile, email);
}

export async function updateMyProfile(
  userId: string,
  email: string,
  input: UpdateCandidateProfileRequest,
): Promise<CandidateProfileResponse> {
  await getOrCreateProfile(userId);
  return saveWithCompleteness(userId, email, jsonFieldsFromUpdate(input));
}

export async function uploadResume(
  userId: string,
  email: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
  manualFields?: UpdateCandidateProfileRequest,
): Promise<CandidateProfileResponse> {
  if (!isAllowedResumeFile(file.mimetype, file.originalname)) {
    throw new ProfileError("Unsupported resume format. Upload PDF, DOCX, or TXT.");
  }

  const parsed = await parseResumeFile(file.buffer, file.mimetype, file.originalname);
  const mergedManual = mergeParsedResumeIntoProfile(manualFields ?? {}, parsed);

  const profile = await getOrCreateProfile(userId);
  if (profile.resumeObjectKey) {
    try {
      await deleteResumeFile(profile.resumeObjectKey);
    } catch {
      // MinIO optional in local dev
    }
  }

  let objectKey: string | null = null;
  try {
    objectKey = await storeResumeFile(userId, file.originalname, file.buffer, file.mimetype);
  } catch (error) {
    throw new ProfileError(
      `Resume storage unavailable: ${error instanceof Error ? error.message : "unknown error"}`,
      503,
    );
  }

  return saveWithCompleteness(userId, email, {
    ...jsonFieldsFromUpdate(mergedManual),
    resumeObjectKey: objectKey,
    resumeFileName: file.originalname,
    resumeMimeType: file.mimetype,
    resumeText: parsed.rawText,
    parsedResume: parsed,
  });
}

export async function getResumeDownload(userId: string): Promise<{ url: string; fileName: string }> {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile?.resumeObjectKey) {
    throw new ProfileError("No resume uploaded.", 404);
  }

  const url = await getResumeDownloadUrl(profile.resumeObjectKey);
  return { url, fileName: profile.resumeFileName ?? "resume" };
}

export async function enrichGithubProfile(userId: string, email: string): Promise<CandidateProfileResponse> {
  const profile = await getOrCreateProfile(userId);
  const links = (profile.links as { github?: string }) ?? {};
  const githubUrl = links.github?.trim();

  if (!githubUrl) {
    throw new ProfileError("Add a GitHub link to your profile first.");
  }

  const username = parseGithubUsername(githubUrl);
  const repos = await fetchGithubRepos(username);
  const githubMeta: GithubProfileData = {
    username,
    profileUrl: githubUrl.replace(/\/$/, ""),
    repos: toGithubRepoSummary(repos),
  };

  return saveWithCompleteness(userId, email, { githubMeta });
}
