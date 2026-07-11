import { describe, expect, test } from "bun:test";
import { analyzeFit } from "./match-analyzer";

const sampleJob = {
  title: "Senior Frontend Engineer",
  description:
    "Build React dashboards, collaborate with backend teams, and lead UI architecture. Bachelor's degree preferred. 5+ years experience.",
  requiredSkills: ["React", "TypeScript", "CSS"],
  preferredSkills: ["GraphQL", "Testing"],
  location: "Bengaluru",
  workStyle: "HYBRID",
  employmentTypes: ["PERMANENT"],
};

const strongCandidate = {
  skills: [{ name: "React" }, { name: "TypeScript" }, { name: "CSS" }],
  experience: [
    {
      title: "Senior Frontend Engineer",
      company: "Acme",
      description: "Built React dashboards, led UI architecture, and partnered with backend teams.",
    },
  ],
  education: [{ degree: "B.Tech Computer Science", institution: "IIT" }],
  preferences: {
    locations: ["Bengaluru"],
    workStyle: "HYBRID",
    employmentTypes: ["PERMANENT"],
    desiredRoles: ["Senior Frontend Engineer"],
  },
  parsedResume: {
    rawText: "Senior frontend engineer with React and TypeScript experience.",
    skills: ["React", "TypeScript"],
    experience: ["Built React dashboards and UI architecture."],
    education: ["B.Tech Computer Science, IIT"],
    projects: ["Open-source React component library with testing utilities."],
  },
};

const weakCandidate = {
  skills: [{ name: "Java" }],
  experience: [{ title: "Junior Backend Developer", company: "Beta", description: "Maintained REST APIs." }],
  education: [{ degree: "Diploma", institution: "Polytechnic" }],
  preferences: {
    locations: ["Mumbai"],
    workStyle: "REMOTE",
    employmentTypes: ["CONTRACT"],
  },
  parsedResume: {
    rawText: "Backend developer focused on Java services.",
    skills: ["Java"],
    experience: ["Maintained REST APIs."],
    education: ["Diploma"],
    projects: [],
  },
};

describe("analyzeFit", () => {
  test("scores a well-aligned candidate higher than a misaligned one", () => {
    const strong = analyzeFit(sampleJob, strongCandidate);
    const weak = analyzeFit(sampleJob, weakCandidate);

    expect(strong.fitScore).toBeGreaterThan(weak.fitScore);
    expect(strong.fitScore).toBeGreaterThanOrEqual(70);
    expect(weak.fitScore).toBeLessThan(60);
  });

  test("surfaces skill and experience strengths for aligned profiles", () => {
    const result = analyzeFit(sampleJob, strongCandidate, {
      coverLetter: "I have led React dashboard work and enjoy hybrid collaboration in Bengaluru.",
    });

    expect(result.strengths.join(" ")).toContain("required skills");
    expect(result.strengths.join(" ")).toMatch(/roles align|desired roles/i);
    expect(result.fitSummary).toMatch(/fit/i);
  });

  test("flags missing skills, location, and qualification gaps", () => {
    const result = analyzeFit(sampleJob, weakCandidate);

    expect(result.concerns.join(" ")).toMatch(/missing required skills|React|TypeScript/i);
    expect(result.concerns.join(" ")).toMatch(/location|work style|employment type/i);
  });
});
