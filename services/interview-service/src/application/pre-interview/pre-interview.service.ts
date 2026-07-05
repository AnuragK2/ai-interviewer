import type { GithubProfileData, PreInterviewResponse } from "@ai-interviewer/api-types";
import { z } from "zod";
import { fetchGithubRepos, toGithubRepoSummary } from "../../infrastructure/github/github.client";
import { interviewRepository } from "../../infrastructure/db/repositories/interview.repository";
import { parseResumeFile } from "@ai-interviewer/resume-parser";

const githubUrlSchema = z.url();

export class PreInterviewService {
  async createInterview(resumeBuffer: Buffer, mimeType: string, fileName: string, githubUrl: string) {
    const profileUrl = githubUrl.replace(/\/$/, "");
    const username = profileUrl.split("/").pop();
    if (!username) {
      throw new Error("Could not parse GitHub username from URL.");
    }

    const [resume, githubRepos] = await Promise.all([
      parseResumeFile(resumeBuffer, mimeType, fileName),
      fetchGithubRepos(username),
    ]);

    const github: GithubProfileData = {
      username,
      profileUrl,
      repos: toGithubRepoSummary(githubRepos),
    };

    const interview = await interviewRepository.create({
      githubMetaData: github,
      resume,
      status: "PENDING",
    });

    const response: PreInterviewResponse = {
      interview: {
        id: interview.id,
        status: interview.status,
        score: interview.score,
        createdAt: interview.createdAt.toISOString(),
      },
      resume,
      github,
    };

    return response;
  }

  parseGithubUrl(raw: unknown) {
    return githubUrlSchema.safeParse(raw);
  }
}

export const preInterviewService = new PreInterviewService();
