export type InterviewEndReason = "cheat" | "completed" | "client_end" | "error";

export type InterviewEndState = {
  reason: InterviewEndReason;
  message: string;
  score?: number;
  interviewId: string;
  candidateName?: string;
  endedAt: string;
};

function endStateKey(interviewId: string) {
  return `interview-end:${interviewId}`;
}

export function saveInterviewEndState(state: Omit<InterviewEndState, "endedAt">) {
  const payload: InterviewEndState = {
    ...state,
    endedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(endStateKey(state.interviewId), JSON.stringify(payload));
}

export function loadInterviewEndState(interviewId: string): InterviewEndState | null {
  const raw = sessionStorage.getItem(endStateKey(interviewId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as InterviewEndState;
  } catch {
    return null;
  }
}

export function clearInterviewEndState(interviewId: string) {
  sessionStorage.removeItem(endStateKey(interviewId));
}
