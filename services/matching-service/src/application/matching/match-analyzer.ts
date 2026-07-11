function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+.#\s-]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2),
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export type MatchResult = {
  fitScore: number;
  fitSummary: string;
  strengths: string[];
  concerns: string[];
};

export function analyzeFit(jobSnapshot: unknown, candidateSnapshot: unknown): MatchResult {
  const jobText = safeStringify(jobSnapshot);
  const candidateText = safeStringify(candidateSnapshot);

  const jobTokens = tokenize(jobText);
  const candidateTokens = tokenize(candidateText);

  const overlap: string[] = [];
  for (const t of jobTokens) {
    if (candidateTokens.has(t)) overlap.push(t);
  }

  const overlapCount = overlap.length;
  const denom = Math.max(40, jobTokens.size);
  const raw = Math.round((overlapCount / denom) * 100);
  const fitScore = Math.max(5, Math.min(95, raw));

  const top = overlap.slice(0, 12);
  const strengths =
    top.length > 0
      ? top.map((t) => `Experience or signals related to "${t}".`)
      : ["Profile has limited direct overlap with this job description snapshot."];

  const concerns =
    overlapCount >= 8
      ? ["No major concerns detected from keyword overlap; recruiter should still verify depth in interview."]
      : ["Limited keyword overlap; consider tailoring resume/skills to the role requirements."];

  const fitSummary =
    overlapCount >= 8
      ? "Strong baseline fit based on profile ↔ job snapshot overlap. Validate seniority, scope, and impact in interview."
      : overlapCount >= 4
        ? "Moderate fit. Some relevant skills appear, but the profile may be missing key role-specific signals."
        : "Low-to-moderate fit from snapshot overlap. Candidate may still be viable if they have transferable experience.";

  return {
    fitScore,
    fitSummary,
    strengths,
    concerns,
  };
}

