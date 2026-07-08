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

export type GithubProfileData = {
  username: string;
  profileUrl: string;
  repos: GithubRepoSummary[];
};
