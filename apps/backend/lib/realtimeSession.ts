import { createHash } from "node:crypto";
import { buildInterviewInstructions } from "./interviewInstructions";

const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2";
const OPENAI_REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE ?? "marin";

type InterviewContext = {
  id: string;
  resume: unknown;
  githubMetaData: unknown;
};

export async function createRealtimeSdpAnswer(offerSdp: string, interview: InterviewContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!offerSdp?.trim()) {
    throw new Error("SDP offer is required.");
  }

  const instructions = buildInterviewInstructions(interview.resume, interview.githubMetaData);

  const sessionConfig = JSON.stringify({
    type: "realtime",
    model: OPENAI_REALTIME_MODEL,
    instructions,
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
        },
      },
      output: {
        voice: OPENAI_REALTIME_VOICE,
      },
    },
  });

  const formData = new FormData();
  formData.set("sdp", offerSdp);
  formData.set("session", sessionConfig);

  const safetyIdentifier = createHash("sha256").update(interview.id).digest("hex");

  const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Safety-Identifier": safetyIdentifier,
    },
    body: formData,
  });

  if (!sdpResponse.ok) {
    const details = await sdpResponse.text();
    throw new Error(`Failed to negotiate WebRTC session: ${details}`);
  }

  return sdpResponse.text();
}
