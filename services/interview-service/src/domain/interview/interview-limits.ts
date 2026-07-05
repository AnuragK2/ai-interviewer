export const INTERVIEW_LIMITS = {
  TARGET_QUESTIONS: 7,
  MAX_QUESTIONS: 8,
  TARGET_DURATION_MS: 30 * 60 * 1000,
  MAX_DURATION_MS: 35 * 60 * 1000,
  PROGRESS_CHECK_INTERVAL_MS: 30_000,
  /** Pause after the candidate stops speaking before the agent replies. */
  USER_TURN_END_DELAY_MS: 900,
  /** Shorter delay for the first answer so the conversation feels responsive. */
  FIRST_TURN_END_DELAY_MS: 500,
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

export function getCandidateEndInstructions() {
  return [
    "CANDIDATE REQUESTED TO END:",
    "The candidate asked to stop or end the interview early.",
    "Acknowledge their request politely, thank them by name for their time,",
    "give a brief positive closing remark, clearly say the session is ending now, and say goodbye.",
    "Do not ask any questions.",
  ].join(" ");
}
