import type { NormalizedCandidate, NormalizedJob } from "./snapshot-parsers";

export type DimensionResult = {
  id: string;
  label: string;
  weight: number;
  score: number;
  strengths: string[];
  concerns: string[];
};

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "that",
  "this",
  "will",
  "your",
  "our",
  "you",
  "are",
  "have",
  "has",
  "been",
  "into",
  "using",
  "use",
  "able",
  "work",
  "team",
  "role",
  "job",
  "years",
  "year",
  "experience",
  "required",
  "preferred",
  "strong",
  "good",
  "plus",
]);

const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js", "ecmascript"],
  typescript: ["ts"],
  python: ["py"],
  golang: ["go"],
  kubernetes: ["k8s"],
  postgresql: ["postgres", "psql"],
  mongodb: ["mongo"],
  react: ["reactjs", "react.js"],
  node: ["nodejs", "node.js"],
  vue: ["vuejs", "vue.js"],
  angular: ["angularjs"],
  csharp: ["c#", "dotnet", ".net"],
  machinelearning: ["ml"],
  artificialintelligence: ["ai"],
  deeplearning: ["dl"],
  amazonwebservices: ["aws"],
  googlecloud: ["gcp"],
  microsoftazure: ["azure"],
  continuousintegration: ["ci"],
  continuousdeployment: ["cd"],
  cicd: ["ci/cd"],
};

const EDUCATION_LEVELS: { label: string; patterns: RegExp[] }[] = [
  { label: "PhD / doctorate", patterns: [/\bph\.?\s*d\b/i, /\bdoctorate\b/i, /\bdoctoral\b/i] },
  { label: "Master's degree", patterns: [/\bmaster'?s?\b/i, /\bmba\b/i, /\bm\.?\s*s\.?\b/i, /\bm\.?\s*tech\b/i] },
  {
    label: "Bachelor's degree",
    patterns: [/\bbachelor'?s?\b/i, /\bb\.?\s*tech\b/i, /\bb\.?\s*e\.?\b/i, /\bb\.?\s*s\.?\b/i, /\bundergraduate\b/i],
  },
  { label: "Diploma / associate", patterns: [/\bdiploma\b/i, /\bassociate\b/i] },
];

const SENIORITY_PATTERNS: { level: string; patterns: RegExp[] }[] = [
  { level: "executive", patterns: [/\b(cto|ceo|vp|director|head of)\b/i] },
  { level: "principal", patterns: [/\b(principal|staff|distinguished)\b/i] },
  { level: "senior", patterns: [/\b(senior|sr\.?|lead|architect)\b/i] },
  { level: "mid", patterns: [/\b(mid|intermediate|ii)\b/i] },
  { level: "junior", patterns: [/\b(junior|jr\.?|entry|graduate|intern)\b/i] },
];

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, "")
    .replace(/\.js$/i, "")
    .replace(/\.ts$/i, "");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s/-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function expandSkillVariants(skill: string): string[] {
  const normalized = normalizeToken(skill);
  if (!normalized) return [];

  const variants = new Set<string>([normalized]);
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    if (normalized === canonical || aliases.includes(normalized)) {
      variants.add(canonical);
      for (const alias of aliases) variants.add(alias);
    }
  }
  return [...variants];
}

function skillMatchesText(skill: string, text: string): boolean {
  const haystack = text.toLowerCase();
  return expandSkillVariants(skill).some((variant) => {
    if (variant.length < 2) return false;
    if (haystack.includes(variant)) return true;
    const pattern = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return pattern.test(haystack);
  });
}

function skillIsPresent(skill: string, candidate: NormalizedCandidate): boolean {
  if (candidate.skills.some((item) => skillMatchesText(skill, item))) return true;
  if (candidate.githubLanguages.some((item) => skillMatchesText(skill, item))) return true;

  const corpus = [
    candidate.summary,
    candidate.resumeText,
    candidate.coverLetter,
    ...candidate.experienceDescriptions,
    ...candidate.projects,
  ].join("\n");

  return skillMatchesText(skill, corpus);
}

function matchSkillList(skills: string[], candidate: NormalizedCandidate) {
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of skills) {
    if (skillIsPresent(skill, candidate)) matched.push(skill);
    else missing.push(skill);
  }

  return { matched, missing };
}

function overlapRatio(required: string[], found: string[]): number {
  if (required.length === 0) return 1;
  return found.length / required.length;
}

function detectSeniority(text: string): string | null {
  for (const entry of SENIORITY_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) return entry.level;
  }
  return null;
}

function titleSimilarity(jobTitle: string, candidateTitles: string[]): number {
  const jobTokens = new Set(tokenize(jobTitle));
  if (jobTokens.size === 0 || candidateTitles.length === 0) return 0;

  let best = 0;
  for (const title of candidateTitles) {
    const titleTokens = tokenize(title);
    if (titleTokens.length === 0) continue;
    const overlap = titleTokens.filter((token) => jobTokens.has(token)).length;
    best = Math.max(best, overlap / Math.max(jobTokens.size, titleTokens.length));
  }
  return best;
}

function extractEducationRequirement(description: string): string | null {
  for (const level of EDUCATION_LEVELS) {
    if (level.patterns.some((pattern) => pattern.test(description))) return level.label;
  }
  return null;
}

function candidateMeetsEducation(requirement: string | null, education: string[]): boolean {
  if (!requirement) return true;
  const corpus = education.join(" ").toLowerCase();
  if (!corpus) return false;

  if (requirement.includes("PhD")) {
    return EDUCATION_LEVELS[0]!.patterns.some((pattern) => pattern.test(corpus));
  }
  if (requirement.includes("Master")) {
    return (
      EDUCATION_LEVELS[0]!.patterns.some((pattern) => pattern.test(corpus)) ||
      EDUCATION_LEVELS[1]!.patterns.some((pattern) => pattern.test(corpus))
    );
  }
  if (requirement.includes("Bachelor")) {
    return EDUCATION_LEVELS.slice(0, 3).some((level) => level.patterns.some((pattern) => pattern.test(corpus)));
  }
  return EDUCATION_LEVELS[3]!.patterns.some((pattern) => pattern.test(corpus));
}

function locationMatches(jobLocation: string | null, preferredLocations: string[]): boolean {
  if (!jobLocation) return preferredLocations.length === 0;
  const job = jobLocation.toLowerCase();
  return preferredLocations.some((location) => {
    const preferred = location.toLowerCase();
    return preferred.includes(job) || job.includes(preferred);
  });
}

function scoreSkills(job: NormalizedJob, candidate: NormalizedCandidate): DimensionResult {
  const required = matchSkillList(job.requiredSkills, candidate);
  const preferred = matchSkillList(job.preferredSkills, candidate);

  const requiredScore = overlapRatio(job.requiredSkills, required.matched) * 100;
  const preferredScore = job.preferredSkills.length > 0 ? overlapRatio(job.preferredSkills, preferred.matched) * 100 : 100;
  const score = Math.round(requiredScore * 0.75 + preferredScore * 0.25);

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (required.matched.length > 0) {
    strengths.push(
      `Matches ${required.matched.length}/${job.requiredSkills.length || required.matched.length} required skills: ${required.matched.slice(0, 6).join(", ")}.`,
    );
  }
  if (preferred.matched.length > 0) {
    strengths.push(`Also aligns with preferred skills: ${preferred.matched.slice(0, 5).join(", ")}.`);
  }
  if (required.missing.length > 0) {
    concerns.push(`Missing required skills: ${required.missing.slice(0, 6).join(", ")}.`);
  } else if (job.requiredSkills.length === 0) {
    concerns.push("Job listing has no explicit required skills; skill fit inferred from description and profile text.");
  }
  if (preferred.missing.length > 0 && job.preferredSkills.length > 0) {
    concerns.push(`Preferred skills not evident: ${preferred.missing.slice(0, 5).join(", ")}.`);
  }

  return { id: "skills", label: "Skills", weight: 0.35, score, strengths, concerns };
}

function scoreExperience(job: NormalizedJob, candidate: NormalizedCandidate): DimensionResult {
  const titleScore = titleSimilarity(job.title, candidate.experienceTitles) * 100;
  const jobDescriptionTokens = new Set(tokenize(job.description));
  const experienceCorpus = candidate.experienceDescriptions.join("\n");
  const responsibilityOverlap = tokenize(experienceCorpus).filter((token) => jobDescriptionTokens.has(token));
  const responsibilityScore =
    jobDescriptionTokens.size === 0 ? 50 : Math.min(100, (responsibilityOverlap.length / 20) * 100);

  const jobSeniority = detectSeniority(job.title + " " + job.description);
  const candidateSeniority = detectSeniority(candidate.experienceTitles.join(" ") + " " + experienceCorpus);
  let seniorityScore = 70;
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (titleScore >= 40) {
    strengths.push(`Prior roles align with "${job.title}" (${candidate.experienceTitles.slice(0, 3).join("; ")}).`);
  }
  if (responsibilityOverlap.length >= 8) {
    strengths.push("Experience descriptions reflect several responsibilities mentioned in the job description.");
  }
  if (candidate.desiredRoles.some((role) => skillMatchesText(job.title, role))) {
    strengths.push(`Candidate listed "${job.title}" among desired roles.`);
    seniorityScore = Math.max(seniorityScore, 85);
  }

  if (titleScore < 25 && candidate.experienceTitles.length > 0) {
    concerns.push("Recent job titles show limited direct overlap with this role's title.");
  } else if (candidate.experienceTitles.length === 0) {
    concerns.push("No structured work experience found in profile or resume.");
  }

  if (jobSeniority && candidateSeniority && jobSeniority !== candidateSeniority) {
    const rank = (level: string) => SENIORITY_PATTERNS.findIndex((entry) => entry.level === level);
    if (rank(candidateSeniority) > rank(jobSeniority)) {
      concerns.push(`Role appears ${jobSeniority}-level; candidate profile reads more ${candidateSeniority}-level.`);
      seniorityScore = 45;
    } else if (rank(candidateSeniority) < rank(jobSeniority)) {
      concerns.push(`Role expects ${jobSeniority}-level scope; verify depth of prior ownership in interview.`);
      seniorityScore = 55;
    }
  }

  if (responsibilityOverlap.length < 4 && job.description.length > 80) {
    concerns.push("Few role responsibilities from the job description appear in the candidate's experience narrative.");
  }

  const score = Math.round(titleScore * 0.4 + responsibilityScore * 0.4 + seniorityScore * 0.2);
  return { id: "experience", label: "Experience & role fit", weight: 0.25, score, strengths, concerns };
}

function scoreEducation(job: NormalizedJob, candidate: NormalizedCandidate): DimensionResult {
  const requirement = extractEducationRequirement(job.description);
  const meets = candidateMeetsEducation(requirement, candidate.education);
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (candidate.education.length > 0) {
    strengths.push(`Education on profile: ${candidate.education.slice(0, 3).join("; ")}.`);
  }

  let score = 70;
  if (!requirement) {
    score = candidate.education.length > 0 ? 80 : 60;
    if (candidate.education.length === 0) {
      concerns.push("No education entries found in profile or parsed resume.");
    }
  } else if (meets) {
    score = 92;
    strengths.push(`Meets stated qualification expectation (${requirement}).`);
  } else {
    score = candidate.education.length > 0 ? 45 : 25;
    concerns.push(`Job description signals "${requirement}" but matching qualification is not clear in the profile.`);
  }

  return { id: "education", label: "Qualifications", weight: 0.1, score, strengths, concerns };
}

function scoreProjects(job: NormalizedJob, candidate: NormalizedCandidate): DimensionResult {
  const targetSkills = [...job.requiredSkills, ...job.preferredSkills];
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (candidate.projects.length === 0 && candidate.githubLanguages.length === 0) {
    return {
      id: "projects",
      label: "Projects & portfolio",
      weight: 0.1,
      score: 45,
      strengths,
      concerns: ["No projects or GitHub language signals found to validate hands-on work."],
    };
  }

  const relevantProjects: string[] = [];
  for (const project of candidate.projects) {
    if (targetSkills.some((skill) => skillMatchesText(skill, project)) || skillMatchesText(job.title, project)) {
      relevantProjects.push(project.slice(0, 120));
    }
  }

  const githubHits = candidate.githubLanguages.filter((language) =>
    targetSkills.some((skill) => skillMatchesText(skill, language)),
  );

  let score = 50;
  if (relevantProjects.length > 0) {
    score += Math.min(35, relevantProjects.length * 15);
    strengths.push(`Projects demonstrate relevant work: ${relevantProjects.slice(0, 2).join(" | ")}.`);
  }
  if (githubHits.length > 0) {
    score += Math.min(20, githubHits.length * 8);
    strengths.push(`GitHub activity includes relevant stacks: ${[...new Set(githubHits)].slice(0, 5).join(", ")}.`);
  }
  if (relevantProjects.length === 0 && githubHits.length === 0) {
    concerns.push("Projects and GitHub repos do not clearly reflect the job's core skill requirements.");
  }

  return {
    id: "projects",
    label: "Projects & portfolio",
    weight: 0.1,
    score: Math.min(100, Math.round(score)),
    strengths,
    concerns,
  };
}

function scoreLocationAndWorkStyle(job: NormalizedJob, candidate: NormalizedCandidate): DimensionResult {
  const strengths: string[] = [];
  const concerns: string[] = [];
  let locationScore = 70;
  let styleScore = 70;
  let typeScore = 70;

  if (job.workStyle === "REMOTE") {
    locationScore = 90;
    strengths.push("Role is remote-friendly.");
  } else if (job.location) {
    if (locationMatches(job.location, candidate.preferredLocations)) {
      locationScore = 95;
      strengths.push(`Location preference aligns with job location (${job.location}).`);
    } else if (candidate.preferredLocations.length > 0) {
      locationScore = 40;
      concerns.push(
        `Job location (${job.location}) does not match candidate preferred locations (${candidate.preferredLocations.join(", ")}).`,
      );
    } else {
      locationScore = 60;
      concerns.push(`Candidate has not stated location preferences for this ${job.location} role.`);
    }
  }

  if (job.workStyle && candidate.workStyle) {
    if (job.workStyle === candidate.workStyle) {
      styleScore = 95;
      strengths.push(`Work style preference matches (${job.workStyle.toLowerCase()}).`);
    } else {
      styleScore = 45;
      concerns.push(
        `Work style mismatch: role is ${job.workStyle.toLowerCase()}, candidate prefers ${candidate.workStyle.toLowerCase()}.`,
      );
    }
  }

  if (job.employmentTypes.length > 0 && candidate.employmentTypes.length > 0) {
    const overlap = job.employmentTypes.filter((type) => candidate.employmentTypes.includes(type));
    if (overlap.length > 0) {
      typeScore = 95;
      strengths.push(`Employment type preference overlaps (${overlap.join(", ").toLowerCase()}).`);
    } else {
      typeScore = 40;
      concerns.push(
        `Employment type mismatch: role offers ${job.employmentTypes.join(", ").toLowerCase()}, candidate prefers ${candidate.employmentTypes.join(", ").toLowerCase()}.`,
      );
    }
  }

  const score = Math.round(locationScore * 0.5 + styleScore * 0.3 + typeScore * 0.2);
  return {
    id: "logistics",
    label: "Location & work preferences",
    weight: 0.1,
    score,
    strengths,
    concerns,
  };
}

function scoreDescriptionSignals(job: NormalizedJob, candidate: NormalizedCandidate): DimensionResult {
  const jobTokens = new Set(tokenize(`${job.title} ${job.description}`));
  const candidateCorpus = [
    candidate.summary,
    candidate.resumeText,
    candidate.coverLetter,
    ...candidate.experienceDescriptions,
    ...candidate.projects,
  ].join("\n");
  const candidateTokens = new Set(tokenize(candidateCorpus));
  const overlap = [...jobTokens].filter((token) => candidateTokens.has(token));
  const score =
    jobTokens.size === 0 ? 50 : Math.min(100, Math.round((overlap.length / Math.max(25, jobTokens.size)) * 100));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (overlap.length >= 10) {
    strengths.push("Resume and profile language closely mirror the job description's domain and responsibilities.");
  } else if (overlap.length >= 5) {
    strengths.push("Some job-description terminology appears across the candidate's summary and experience.");
  } else {
    concerns.push("Limited overlap between job-description language and the candidate's narrative.");
  }

  return {
    id: "description",
    label: "JD narrative alignment",
    weight: 0.1,
    score,
    strengths,
    concerns,
  };
}

function clampScore(score: number): number {
  return Math.max(5, Math.min(95, Math.round(score)));
}

function uniqueMessages(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function buildSummary(dimensions: DimensionResult[], fitScore: number): string {
  const byScore = [...dimensions].sort((a, b) => b.score - a.score);
  const strongest = byScore[0];
  const weakest = byScore[byScore.length - 1];

  if (fitScore >= 80) {
    return `Strong overall fit (${fitScore}/100). Standout area: ${strongest?.label.toLowerCase() ?? "profile signals"}. Validate depth and impact in interview, especially around ${weakest?.label.toLowerCase() ?? "role-specific scenarios"}.`;
  }
  if (fitScore >= 60) {
    return `Moderate fit (${fitScore}/100). ${strongest?.label ?? "Core areas"} look promising, but ${weakest?.label.toLowerCase() ?? "some areas"} need closer review before moving forward.`;
  }
  return `Limited fit (${fitScore}/100) from the current profile snapshot. Biggest gap: ${weakest?.label.toLowerCase() ?? "role alignment"}. Candidate may still be viable if they have transferable experience not captured in the resume.`;
}

export function runAnalysis(job: NormalizedJob, candidate: NormalizedCandidate) {
  const dimensions = [
    scoreSkills(job, candidate),
    scoreExperience(job, candidate),
    scoreEducation(job, candidate),
    scoreProjects(job, candidate),
    scoreLocationAndWorkStyle(job, candidate),
    scoreDescriptionSignals(job, candidate),
  ];

  const weighted = dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0);
  const fitScore = clampScore(weighted);

  const strengths = uniqueMessages(dimensions.flatMap((dimension) => dimension.strengths)).slice(0, 8);
  const concerns = uniqueMessages(dimensions.flatMap((dimension) => dimension.concerns)).slice(0, 8);

  return {
    fitScore,
    fitSummary: buildSummary(dimensions, fitScore),
    strengths: strengths.length > 0 ? strengths : ["Profile provides some relevant signals, but none stood out strongly."],
    concerns:
      concerns.length > 0
        ? concerns
        : ["No major concerns detected from structured profile analysis; recruiter should still verify in interview."],
    dimensions,
  };
}
