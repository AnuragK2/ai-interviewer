import type { PreInterviewResponse } from "./types";

function sessionKey(interviewId: string) {
  return `interview:${interviewId}`;
}

export function saveInterviewSession(profile: PreInterviewResponse) {
  sessionStorage.setItem(sessionKey(profile.interview.id), JSON.stringify(profile));
}

export function loadInterviewSession(interviewId: string): PreInterviewResponse | null {
  const raw = sessionStorage.getItem(sessionKey(interviewId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PreInterviewResponse;
  } catch {
    return null;
  }
}

export function clearInterviewSession(interviewId: string) {
  sessionStorage.removeItem(sessionKey(interviewId));
}
