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

type JobSnapshot = {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  location?: string | null;
  workStyle?: string | null;
  employmentTypes?: string[];
};

type ApplicationContext = {
  jobSnapshot?: JobSnapshot;
  fitScore?: number | null;
  fitSummary?: string | null;
  strengths?: string[];
  concerns?: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function parseApplicationContext(value: unknown): ApplicationContext {
  const record = asRecord(value);
  if (!record) return {};

  const jobSnapshot = asRecord(record.jobSnapshot) as JobSnapshot | null;
  return {
    jobSnapshot: jobSnapshot ?? undefined,
    fitScore: typeof record.fitScore === "number" ? record.fitScore : null,
    fitSummary: typeof record.fitSummary === "string" ? record.fitSummary : null,
    strengths: Array.isArray(record.strengths)
      ? record.strengths.filter((item): item is string => typeof item === "string")
      : [],
    concerns: Array.isArray(record.concerns)
      ? record.concerns.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export function buildInterviewInstructions(resume: unknown, githubMetaData: unknown, applicationContext?: unknown) {
  const parsedResume = (resume ?? {}) as ResumeData;
  const github = (githubMetaData ?? {}) as GithubData;
  const context = parseApplicationContext(applicationContext);

  const name = parsedResume.name ?? github.username ?? "the candidate";
  const skills = parsedResume.skills?.slice(0, 12).join(", ") || "not specified";
  const experience = parsedResume.experience?.slice(0, 6).join(" | ") || "not specified";
  const projects = parsedResume.projects?.slice(0, 4).join(" | ") || "not specified";
  const education = parsedResume.education?.slice(0, 4).join(" | ") || "not specified";
  const topRepos =
    github.repos
      ?.slice(0, 5)
      .map((repo) => `${repo.name}${repo.language ? ` (${repo.language})` : ""}`)
      .join(", ") || "not specified";

  const job = context.jobSnapshot;
  const jobTitle = job?.title ?? "the open role";
  const jobDescription = job?.description ?? "not provided";
  const requiredSkills = job?.requiredSkills?.join(", ") || "not specified";
  const preferredSkills = job?.preferredSkills?.join(", ") || "not specified";
  const roleLogistics = [
    job?.location ? `Location: ${job.location}` : null,
    job?.workStyle ? `Work style: ${job.workStyle}` : null,
    job?.employmentTypes?.length ? `Employment type: ${job.employmentTypes.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const matchHighlights = [
    context.fitScore !== null && context.fitScore !== undefined ? `Fit score: ${context.fitScore}/100` : null,
    context.fitSummary ? `Fit summary: ${context.fitSummary}` : null,
    context.strengths?.length ? `Profile strengths: ${context.strengths.slice(0, 5).join(" | ")}` : null,
    context.concerns?.length ? `Areas to probe: ${context.concerns.slice(0, 4).join(" | ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "You are an expert technical interviewer conducting a live spoken interview.",
    "This interview is conducted entirely in English. Speak only in English and expect the candidate to respond in English.",
    "",
    "TURN-TAKING RULES (critical — follow strictly):",
    "- Your primary job is to LISTEN. Never interrupt the candidate while they are answering.",
    "- Wait until the candidate has fully finished their answer before you speak.",
    "- Candidates often pause to think or gather their thoughts — treat mid-answer pauses as part of their response, not a signal to jump in.",
    "- After they finish, give a brief acknowledgment (e.g. 'Thanks' or 'Got it') and then ask your next question.",
    "- Ask exactly ONE question at a time. Never stack multiple questions in one turn.",
    "- Keep your own spoken responses concise, but always give the candidate ample time to answer completely.",
    "",
    "Aim for 7 to 8 substantive interview questions in total, including the introduction, over roughly 30 minutes.",
    "If the candidate is giving a strong, detailed answer, let them continue — do not rush them.",
    "This session is proctored. If the candidate switches tabs, hides their face, looks away, turns off their camera, or copies/pastes, you may be prompted to give a brief proctoring reminder — follow those prompts exactly and do not continue the interview until the issue is addressed.",
    "When you reach the question or time limit, stop asking new questions, thank the candidate warmly by name, say the interview is complete, wish them well, and say goodbye.",
    "If the candidate clearly asks to end, stop, or terminate the interview early, acknowledge politely, thank them, give a brief closing remark, and end the session — do not ask further questions.",
    "Probe for depth on projects, trade-offs, and real implementation details.",
    "If something is unclear, ask one brief clarifying follow-up and wait for their full answer before moving on.",
    "",
    `Role being interviewed for: ${jobTitle}`,
    `Job description: ${jobDescription}`,
    `Required skills: ${requiredSkills}`,
    `Preferred skills: ${preferredSkills}`,
    roleLogistics ? `Role logistics: ${roleLogistics}` : "",
    matchHighlights ? `Pre-interview analysis:\n${matchHighlights}` : "",
    "",
    `Candidate name: ${name}`,
    `Summary: ${parsedResume.summary ?? "not provided"}`,
    `Skills: ${skills}`,
    `Experience: ${experience}`,
    `Education: ${education}`,
    `Projects: ${projects}`,
    `GitHub user: ${github.username ?? "unknown"}`,
    `Notable repositories: ${topRepos}`,
    "",
    "Tailor your questions to the job description, required skills, and the candidate's experience. Validate claims from the resume with concrete follow-ups.",
    "Start by greeting the candidate briefly and ask them to introduce themselves, then ask your first interview question.",
  ]
    .filter(Boolean)
    .join("\n");
}
