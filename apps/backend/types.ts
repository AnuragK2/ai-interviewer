import type { ParsedResume } from "./lib/extractResumeFields";

export type { ParsedResume };

export type GithubRepoSummary = {
  description: string | null;
  name: string;
  fullName: string;
  starCount: number;
  language: string | null;
  url: string;
};

export type GithubProfileData = {
  username: string;
  profileUrl: string;
  repos: GithubRepoSummary[];
};

export type InterviewSummary = {
  id: string;
  status: string;
  score: number;
  createdAt: string;
};

export type PreInterviewResponse = {
  interview: InterviewSummary;
  resume: ParsedResume;
  github: GithubProfileData;
};

export type InterviewResultMessage = {
  id: string;
  participant: "User" | "Assistant";
  message: string;
  createdAt: string;
};

export type InterviewResultsResponse = {
  interview: InterviewSummary & { updatedAt: string };
  candidate: {
    name: string | null;
    githubUsername: string | null;
  };
  stats: {
    userMessages: number;
    assistantMessages: number;
    durationMinutes: number;
  };
  messages: InterviewResultMessage[];
};
