import type { InterviewFeedbackResponse } from "@ai-interviewer/api-types";
import { BACKEND_URL } from "@/shared/api/config";
import { getAccessToken } from "@/shared/lib/auth-storage";

async function interviewFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export async function getInterviewFeedback(interviewId: string): Promise<InterviewFeedbackResponse> {
  return interviewFetch<InterviewFeedbackResponse>(`/api/v1/interview/${interviewId}/feedback`);
}

export async function uploadInterviewRecording(interviewId: string, blob: Blob) {
  const formData = new FormData();
  formData.append("recording", blob, "interview-recording.webm");

  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BACKEND_URL}/api/v1/interview/${interviewId}/recording`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Recording upload failed (${response.status}).`);
  }
}

export async function uploadProctoringSnapshot(interviewId: string, blob: Blob, signal: string) {
  const formData = new FormData();
  formData.append("snapshot", blob, "proctoring-snapshot.jpg");
  formData.append("signal", signal);

  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BACKEND_URL}/api/v1/interview/${interviewId}/proctoring-snapshot`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Snapshot upload failed (${response.status}).`);
  }
}
