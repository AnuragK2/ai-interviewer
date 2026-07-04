export type ParsedResume = {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
};

export type GithubRepoSummary = {
  description: string | null;
  name: string;
  fullName: string;
  starCount: number;
  language: string | null;
  url: string;
};

export type InterviewSummary = {
  id: string;
  status: string;
  score: number;
  createdAt: string;
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

export type PreInterviewResponse = {
  interview: InterviewSummary;
  resume: ParsedResume;
  github: {
    username: string;
    profileUrl: string;
    repos: GithubRepoSummary[];
  };
};
