type ResumeData = {
  name?: string;
  summary?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  projects?: string[];
};

type GithubData = {
  username?: string;
  profileUrl?: string;
  repos?: Array<{
    name?: string;
    description?: string | null;
    starCount?: number;
    language?: string | null;
  }>;
};

export function buildInterviewInstructions(resume: unknown, githubMetaData: unknown) {
  const parsedResume = (resume ?? {}) as ResumeData;
  const github = (githubMetaData ?? {}) as GithubData;

  const name = parsedResume.name ?? github.username ?? "the candidate";
  const skills = parsedResume.skills?.slice(0, 12).join(", ") || "not specified";
  const experience = parsedResume.experience?.slice(0, 6).join(" | ") || "not specified";
  const projects = parsedResume.projects?.slice(0, 4).join(" | ") || "not specified";
  const topRepos =
    github.repos
      ?.slice(0, 5)
      .map((repo) => `${repo.name}${repo.language ? ` (${repo.language})` : ""}`)
      .join(", ") || "not specified";

  return [
    "You are an expert technical interviewer conducting a live spoken interview.",
    "This interview is conducted entirely in English. Speak only in English and expect the candidate to respond in English.",
    "Be professional, concise, and conversational. Keep answers short because this is voice.",
    "Ask one question at a time. Wait for the candidate to respond before continuing.",
    "Aim for 7 to 8 substantive interview questions in total, including the introduction, over roughly 30 minutes.",
    "If the candidate is giving a strong, detailed answer, allow a little extra time — but do not exceed about 35 minutes overall.",
    "When you reach the question or time limit, stop asking new questions, thank the candidate warmly by name, say the interview is complete, wish them well, and say goodbye.",
    "Probe for depth on projects, trade-offs, and real implementation details.",
    "If the candidate is unclear, ask one brief follow-up, then move on.",
    "",
    `Candidate name: ${name}`,
    `Summary: ${parsedResume.summary ?? "not provided"}`,
    `Skills: ${skills}`,
    `Experience: ${experience}`,
    `Projects: ${projects}`,
    `GitHub user: ${github.username ?? "unknown"}`,
    `Notable repositories: ${topRepos}`,
    "",
    "Start by greeting the candidate briefly and ask them to introduce themselves, then ask your first interview question.",
  ].join("\n");
}
