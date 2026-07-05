const END_INTERVIEW_PATTERNS = [
  /\b(end|stop|terminate|finish|wrap up|quit)\b.{0,30}\b(interview|session|call|conversation)\b/i,
  /\b(interview|session|call)\b.{0,30}\b(end|stop|terminate|finish|over|done)\b/i,
  /\b(end|stop|terminate)\s+(the\s+)?(interview|session)\b/i,
  /\b(i('m| am)|let's|lets|please)\s+(done|stop|end|finish)\b/i,
  /\bcan we (stop|end|finish|wrap up)\b/i,
  /\bno more questions\b/i,
];

export function isCandidateEndInterviewRequest(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return END_INTERVIEW_PATTERNS.some((pattern) => pattern.test(trimmed));
}
