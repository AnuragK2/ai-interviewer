import { runAnalysis } from "./analysis-engine";
import { parseCandidateSnapshot, parseJobSnapshot } from "./snapshot-parsers";

export type MatchResult = {
  fitScore: number;
  fitSummary: string;
  strengths: string[];
  concerns: string[];
};

export function analyzeFit(
  jobSnapshot: unknown,
  candidateSnapshot: unknown,
  options?: { coverLetter?: string | null },
): MatchResult {
  const job = parseJobSnapshot(jobSnapshot);
  const candidate = parseCandidateSnapshot(candidateSnapshot, options?.coverLetter ?? "");

  const result = runAnalysis(job, candidate);

  return {
    fitScore: result.fitScore,
    fitSummary: result.fitSummary,
    strengths: result.strengths,
    concerns: result.concerns,
  };
}
