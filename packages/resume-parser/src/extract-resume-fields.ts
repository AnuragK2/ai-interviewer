import type { ParsedResume } from "@ai-interviewer/api-types";

const SECTION_PATTERNS: {
  key: keyof Pick<ParsedResume, "summary" | "skills" | "experience" | "education" | "projects">;
  labels: string[];
}[] = [
  { key: "summary", labels: ["summary", "profile", "objective", "about"] },
  {
    key: "experience",
    labels: ["experience", "work experience", "employment", "professional experience", "work history"],
  },
  { key: "education", labels: ["education", "academic background"] },
  { key: "skills", labels: ["skills", "technical skills", "core competencies", "technologies"] },
  { key: "projects", labels: ["projects", "personal projects", "selected projects"] },
];

function normalizeLine(line: string) {
  return line.trim().replace(/\s+/g, " ");
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function extractPhone(text: string) {
  return text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];
}

function isSectionHeader(line: string) {
  const normalized = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return SECTION_PATTERNS.find(({ labels }) => labels.includes(normalized));
}

function splitListItems(block: string) {
  return block
    .split(/\n+/)
    .map(normalizeLine)
    .filter((line) => line.length > 1)
    .filter((line) => !/^page \d+$/i.test(line));
}

function parseSkills(block: string) {
  const inline = block
    .replace(/\n+/g, " ")
    .split(/[,|•·]/)
    .map((item) => normalizeLine(item.replace(/^[-*]\s*/, "")))
    .filter(Boolean);

  if (inline.length > 1) {
    return inline;
  }

  return splitListItems(block).map((line) => line.replace(/^[-*•]\s*/, ""));
}

type ResumeSections = {
  summary: string[];
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
};

export function extractResumeFields(rawText: string): ParsedResume {
  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const sections: ResumeSections = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };

  let currentSection: keyof ResumeSections | null = null;
  const preamble: string[] = [];

  for (const line of lines) {
    const header = isSectionHeader(line);
    if (header) {
      currentSection = header.key;
      continue;
    }

    if (!currentSection) {
      preamble.push(line);
      continue;
    }

    sections[currentSection].push(line);
  }

  const name = preamble.find(
    (line) => !extractEmail(line) && !extractPhone(line) && line.length > 1,
  );

  return {
    rawText,
    name,
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    summary: sections.summary.join("\n") || undefined,
    skills: parseSkills(sections.skills.join("\n")),
    experience: splitListItems(sections.experience.join("\n")),
    education: splitListItems(sections.education.join("\n")),
    projects: splitListItems(sections.projects.join("\n")),
  };
}
