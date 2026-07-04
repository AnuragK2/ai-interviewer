import { buildInterviewInstructions } from "./interviewInstructions";
import {
  buildProctoringAgentPrompt,
  type ProctoringSignal,
} from "./proctoringMessages";

const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2";
const OPENAI_REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE ?? "marin";

type OpenAIRealtimeSocketOptions = {
  interviewId: string;
  resume: unknown;
  githubMetaData: unknown;
  onEvent: (event: Record<string, unknown>) => void;
  onClose: () => void;
  onError: (message: string) => void;
};

export class OpenAIRealtimeSocket {
  private ws: WebSocket | null = null;
  private closed = false;
  private baseInstructions = "";
  private responseActive = false;

  constructor(private readonly options: OpenAIRealtimeSocketOptions) {}

  private trackResponseState(event: Record<string, unknown>) {
    const type = String(event.type ?? "");

    if (type === "response.created" || type === "output_audio_buffer.started") {
      this.responseActive = true;
      return;
    }

    if (
      type === "response.done" ||
      type === "response.cancelled" ||
      type === "response.output_audio.done" ||
      type === "response.audio.done" ||
      type === "output_audio_buffer.stopped"
    ) {
      this.responseActive = false;
    }
  }

  async connect() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(OPENAI_REALTIME_MODEL)}`;

    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    await new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error("Failed to create OpenAI WebSocket."));

      this.ws.addEventListener("open", () => resolve(), { once: true });
      this.ws.addEventListener(
        "error",
        () => reject(new Error("Failed to connect to OpenAI Realtime API.")),
        { once: true },
      );
    });

    this.ws.addEventListener("message", (message) => {
      try {
        const event = JSON.parse(String(message.data)) as Record<string, unknown>;
        this.trackResponseState(event);
        this.options.onEvent(event);
      } catch {
        this.options.onError("Received malformed event from OpenAI.");
      }
    });

    this.ws.addEventListener("close", () => {
      this.closed = true;
      this.options.onClose();
    });

    this.ws.addEventListener("error", () => {
      this.options.onError("OpenAI Realtime socket error.");
    });

    const instructions = buildInterviewInstructions(
      this.options.resume,
      this.options.githubMetaData,
    );
    this.baseInstructions = instructions;

    this.send({
      type: "session.update",
      session: {
        type: "realtime",
        model: OPENAI_REALTIME_MODEL,
        instructions,
        audio: {
          input: {
            format: { type: "audio/pcm", rate: 24000 },
            transcription: {
              model: "gpt-4o-mini-transcribe",
              language: "en",
              prompt: "Technical job interview. Transcribe spoken English only.",
            },
            turn_detection: {
              type: "semantic_vad",
              eagerness: "low",
              create_response: false,
              interrupt_response: true,
            },
          },
          output: {
            format: { type: "audio/pcm", rate: 24000 },
            voice: OPENAI_REALTIME_VOICE,
          },
        },
      },
    });
  }

  send(event: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.closed) return;
    this.ws.send(JSON.stringify(event));
  }

  appendAudio(base64Audio: string) {
    this.send({
      type: "input_audio_buffer.append",
      audio: base64Audio,
    });
  }

  startConversation() {
    this.send({ type: "response.create" });
  }

  commitInputBuffer() {
    this.send({ type: "input_audio_buffer.commit" });
  }

  createResponse() {
    this.send({ type: "response.create" });
  }

  appendInstructions(addition: string) {
    this.send({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: `${this.baseInstructions}\n\n${addition}`,
      },
    });
  }

  requestProctoringWarning(
    signal: ProctoringSignal,
    strike: number,
    limit: number,
    isFinal: boolean,
  ) {
    this.send({
      type: "response.create",
      response: {
        output_modalities: ["audio"],
        instructions: buildProctoringAgentPrompt(signal, strike, limit, isFinal),
      },
    });
  }

  requestClosingRemark(candidateName: string) {
    this.send({
      type: "response.create",
      response: {
        output_modalities: ["audio"],
        instructions: `The interview is now complete. Give a warm, brief closing statement: thank ${candidateName} for their time and thoughtful answers, tell them the interview session is over, wish them well, and say goodbye. Do not ask any questions.`,
      },
    });
  }

  cancelResponseIfActive() {
    if (!this.responseActive) return;
    this.responseActive = false;
    this.send({ type: "response.cancel" });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.cancelResponseIfActive();
    this.ws?.close();
    this.ws = null;
  }
}
