export const PROCTORING_VIOLATION_LIMIT = 5;

export type ProctoringSignal =
  | "tab_hidden"
  | "window_blur"
  | "copy"
  | "paste"
  | "face_not_visible"
  | "looking_away"
  | "camera_disabled";

export const PROCTORING_SIGNALS = new Set<ProctoringSignal>([
  "tab_hidden",
  "window_blur",
  "copy",
  "paste",
  "face_not_visible",
  "looking_away",
  "camera_disabled",
]);

export const VIOLATION_LABELS: Record<ProctoringSignal, string> = {
  tab_hidden: "Tab switch detected",
  window_blur: "Window focus lost",
  face_not_visible: "Face not visible",
  looking_away: "Looking away from camera",
  camera_disabled: "Camera turned off",
  copy: "Copy activity detected",
  paste: "Paste activity detected",
};

const VIOLATION_ACTIONS: Record<ProctoringSignal, string> = {
  face_not_visible:
    "Ask the candidate to show their face clearly in the camera frame and stay visible.",
  looking_away:
    "Ask the candidate to look at the camera and stay focused on the interview.",
  camera_disabled:
    "Ask the candidate to turn their camera back on immediately and keep it on.",
  tab_hidden:
    "Ask the candidate to return to the interview tab and stay on it for the rest of the session.",
  window_blur:
    "Ask the candidate to return focus to the interview window and stay on the interview tab.",
  copy: "Tell the candidate not to copy content during the interview.",
  paste: "Tell the candidate not to paste content during the interview.",
};

export function buildProctoringAgentPrompt(
  signal: ProctoringSignal,
  strike: number,
  limit: number,
  isFinal: boolean,
) {
  const action = VIOLATION_ACTIONS[signal];

  if (isFinal) {
    return [
      `Proctoring strike ${strike} of ${limit} — the interview must end now.`,
      action,
      "Briefly tell the candidate this is the final violation, the interview is ending due to repeated proctoring issues, thank them for their time, and say goodbye.",
      "Do not ask any interview questions.",
    ].join(" ");
  }

  return [
    `Proctoring strike ${strike} of ${limit}.`,
    action,
    "Give a brief, firm but professional spoken reminder in one or two sentences.",
    "Do not ask an interview question — only address the proctoring issue.",
  ].join(" ");
}

export function buildProctoringToastMessage(signal: ProctoringSignal, strike: number, limit: number) {
  return `${VIOLATION_LABELS[signal]}. Warning ${strike}/${limit}: please follow interview proctoring rules.`;
}

export const PROCTORING_TERMINATION_MESSAGE =
  "Interview ended after repeated proctoring violations.";
