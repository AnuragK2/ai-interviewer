import type { CandidateProfileResponse, CreateInterviewFromApplicationRequest } from "@ai-interviewer/api-types";
import type { Prisma } from "../../../lib/generated/prisma/client";
import { interviewRepository } from "../../infrastructure/db/repositories/interview.repository";

function asProfile(snapshot: unknown): Partial<CandidateProfileResponse> {
  return snapshot && typeof snapshot === "object" ? (snapshot as Partial<CandidateProfileResponse>) : {};
}

export async function createInterviewFromApplication(input: CreateInterviewFromApplicationRequest) {
  const profile = asProfile(input.candidateSnapshot);
  const parsedResume = profile.parsedResume ?? {
    rawText: profile.resumeText ?? "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };

  const resume = {
    name: profile.name ?? parsedResume.name,
    summary: parsedResume.summary,
    skills: [
      ...(profile.skills?.map((skill) => skill.name) ?? []),
      ...(parsedResume.skills ?? []),
    ],
    experience: [
      ...(profile.experience?.map((entry) =>
        [entry.title, entry.company, entry.description].filter(Boolean).join(" — "),
      ) ?? []),
      ...(parsedResume.experience ?? []),
    ],
    education: [
      ...(profile.education?.map((entry) => `${entry.degree} at ${entry.institution}`) ?? []),
      ...(parsedResume.education ?? []),
    ],
    projects: parsedResume.projects ?? [],
    rawText: parsedResume.rawText ?? profile.resumeText ?? "",
  };

  const githubMetaData = profile.githubMeta ?? {
    username: "",
    profileUrl: "",
    repos: [],
  };

  const applicationContext = {
    applicationId: input.applicationId,
    jobSnapshot: input.jobSnapshot,
    candidateSnapshot: input.candidateSnapshot,
    fitScore: input.fitScore ?? null,
    fitSummary: input.fitSummary ?? null,
    strengths: input.strengths ?? [],
    concerns: input.concerns ?? [],
  };

  const interview = await interviewRepository.create({
    applicationId: input.applicationId,
    applicationContext: applicationContext as Prisma.InputJsonValue,
    githubMetaData: githubMetaData as Prisma.InputJsonValue,
    resume: resume as Prisma.InputJsonValue,
    status: "PENDING",
  });

  return {
    interview: {
      id: interview.id,
      status: interview.status,
      applicationId: interview.applicationId!,
      createdAt: interview.createdAt.toISOString(),
    },
  };
}
