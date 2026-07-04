export const INTERVIEW_LIMITS = {
  /** Start winding down after this many candidate answers. */
  TARGET_QUESTIONS: 7,
  /** Hard stop after this many candidate answers. */
  MAX_QUESTIONS: 8,
  /** Target interview length (~30 minutes). */
  TARGET_DURATION_MS: 30 * 60 * 1000,
  /** Allow a short grace period for strong, in-progress answers. */
  MAX_DURATION_MS: 35 * 60 * 1000,
  /** How often to re-check elapsed time while the session is idle. */
  PROGRESS_CHECK_INTERVAL_MS: 30_000,
} as const;

export function getWindDownInstructions() {
  return [
    "INTERVIEW PACING UPDATE:",
    "You have reached the planned length of this interview (about 30 minutes or 7 questions).",
    "If the candidate is mid-answer and explaining something well, let them finish — do not cut them off.",
    "After that, ask at most one more short question if needed, then move to your closing.",
    "Do not start any new deep topic areas.",
  ].join(" ");
}

export function getClosingInstructions() {
  return [
    "INTERVIEW CLOSING — FINAL TURN:",
    "The interview is now complete. Do not ask any new questions.",
    "Warmly thank the candidate by name, briefly acknowledge their effort,",
    "clearly state that the interview session is over, wish them well, and say goodbye.",
  ].join(" ");
}
