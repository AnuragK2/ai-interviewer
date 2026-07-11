import type {
  GenerateJobDescriptionRequest,
  GenerateJobDescriptionResponse,
  JobSeniority,
} from "@ai-interviewer/api-types";
import { env } from "../../config/env";
import { JobError } from "./job.service";

const seniorityLabels: Record<JobSeniority, string> = {
  JUNIOR: "Junior",
  MID: "Mid-level",
  SENIOR: "Senior",
  LEAD: "Lead",
  MANAGER: "Manager",
};

function uniqueSkills(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function buildTemplateDescription(input: GenerateJobDescriptionRequest): GenerateJobDescriptionResponse {
  const seniority = seniorityLabels[input.seniority];
  const company = input.companyName?.trim() || "our company";
  const industry = input.industry?.trim();
  const teamFocus = input.teamOrProduct?.trim() || "high-impact product initiatives";
  const location = input.location?.trim();
  const workStyle = input.workStyle?.toLowerCase().replace("_", " ");
  const employmentTypes = input.employmentTypes?.length
    ? input.employmentTypes.map((type) => type.toLowerCase()).join(", ")
    : "full-time";

  const requiredSkills = uniqueSkills(input.mustHaveSkills ?? []);
  const preferredSkills = uniqueSkills(input.niceToHaveSkills ?? []);

  const description = [
    `${company} is hiring a ${seniority} ${input.roleTitle}${industry ? ` in the ${industry} space` : ""}.`,
    "",
    "About the role",
    `You will join a collaborative team and focus on ${teamFocus}. This is a ${employmentTypes} opportunity${
      location ? ` based in ${location}` : ""
    }${workStyle ? ` with a ${workStyle} work model` : ""}.`,
    "",
    "What you'll do",
    "- Own meaningful deliverables from planning through execution.",
    "- Partner with product, design, and engineering stakeholders to ship reliable outcomes.",
    "- Improve team practices, documentation, and quality standards.",
    "- Mentor teammates and contribute to roadmap discussions when needed.",
    "",
    "What we're looking for",
    requiredSkills.length
      ? requiredSkills.map((skill) => `- Strong experience with ${skill}.`).join("\n")
      : "- Relevant hands-on experience for this role and seniority level.",
    "",
    "Nice to have",
    preferredSkills.length
      ? preferredSkills.map((skill) => `- Familiarity with ${skill}.`).join("\n")
      : "- Exposure to modern tooling and cross-functional collaboration.",
    "",
    "Why join us",
    "- Work on challenging problems with clear ownership.",
    "- Collaborative culture with room to grow.",
    "- Competitive compensation and benefits.",
  ].join("\n");

  return {
    title: `${seniority} ${input.roleTitle}`.trim(),
    description,
    requiredSkills,
    preferredSkills,
    generatedBy: "template",
  };
}

async function buildAiDescription(
  input: GenerateJobDescriptionRequest,
): Promise<GenerateJobDescriptionResponse | null> {
  if (!env.openaiApiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical recruiter writing polished, inclusive job descriptions. Return JSON with keys: title (string), description (string with markdown-style sections using plain text headings), requiredSkills (string[]), preferredSkills (string[]). Keep descriptions practical, specific, and ready to publish. Avoid buzzword stuffing.",
        },
        {
          role: "user",
          content: JSON.stringify({
            roleTitle: input.roleTitle,
            seniority: input.seniority,
            teamOrProduct: input.teamOrProduct,
            mustHaveSkills: input.mustHaveSkills ?? [],
            niceToHaveSkills: input.niceToHaveSkills ?? [],
            location: input.location,
            workStyle: input.workStyle,
            employmentTypes: input.employmentTypes ?? [],
            companyName: input.companyName,
            industry: input.industry,
          }),
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Partial<GenerateJobDescriptionResponse>;
    if (!parsed.title?.trim() || !parsed.description?.trim()) return null;

    return {
      title: parsed.title.trim(),
      description: parsed.description.trim(),
      requiredSkills: uniqueSkills(
        Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills.map(String) : input.mustHaveSkills ?? [],
      ),
      preferredSkills: uniqueSkills(
        Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills.map(String) : input.niceToHaveSkills ?? [],
      ),
      generatedBy: "ai",
    };
  } catch {
    return null;
  }
}

export async function generateJobDescription(
  input: GenerateJobDescriptionRequest,
): Promise<GenerateJobDescriptionResponse> {
  const aiResult = await buildAiDescription(input);
  if (aiResult) return aiResult;

  const templateResult = buildTemplateDescription(input);
  if (templateResult.description.length < 20) {
    throw new JobError("Could not generate a job description.", 500);
  }

  return templateResult;
}
