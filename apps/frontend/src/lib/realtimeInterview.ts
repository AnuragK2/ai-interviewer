import { BACKEND_URL } from "./config";
import { createAudioPlayer, createMicStreamer } from "./audioBridge";

export type CheatSignal = "tab_hidden" | "window_blur" | "copy" | "paste";

export type BackendInterviewEvent =
  | { type: "session.ready" }
  | { type: "transcript"; role: "agent" | "user"; text: string; final?: boolean }
  | { type: "agent_speaking"; speaking: boolean }
  | { type: "user_speaking"; speaking: boolean }
  | { type: "output_audio"; audio: string }
  | { type: "interview.ended"; reason: string; message: string; score?: number }
  | { type: "error"; message: string };

export type RealtimeConnection = {
  sendCheatSignal: (signal: CheatSignal) => void;
  endInterview: () => void;
  close: () => void;
};

type ConnectOptions = {
  interviewId: string;
  mediaStream: MediaStream;
  onEvent?: (event: BackendInterviewEvent) => void;
  onConnectionStateChange?: (state: "connecting" | "connected" | "failed" | "closed") => void;
};

function toWebSocketUrl(httpUrl: string) {
  const url = new URL(httpUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/v1/interview/ws";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export async function connectRealtimeInterview({
  interviewId,
  mediaStream,
  onEvent,
  onConnectionStateChange,
}: ConnectOptions): Promise<RealtimeConnection> {
  onConnectionStateChange?.("connecting");

  const ws = new WebSocket(toWebSocketUrl(BACKEND_URL));
  const player = createAudioPlayer();
  let micStreamer: ReturnType<typeof createMicStreamer> | null = null;
  let closed = false;

  const send = (payload: Record<string, unknown>) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  await new Promise<void>((resolve, reject) => {
    ws.addEventListener("open", () => resolve(), { once: true });
    ws.addEventListener(
      "error",
      () => reject(new Error("Failed to connect interview WebSocket.")),
      { once: true },
    );
  });

  await player.resume();
  micStreamer = createMicStreamer(mediaStream, (audio) => {
    send({ type: "input_audio", audio });
  });
  await micStreamer.resume();

  send({ type: "join", interviewId });
  onConnectionStateChange?.("connected");

  ws.addEventListener("message", (message) => {
    let event: BackendInterviewEvent;
    try {
      event = JSON.parse(String(message.data)) as BackendInterviewEvent;
    } catch {
      return;
    }

    if (event.type === "output_audio") {
      player.playPcm16Base64(event.audio);
    }

    if (event.type === "session.ready") {
      onConnectionStateChange?.("connected");
    }

    if (event.type === "error") {
      onConnectionStateChange?.("failed");
    }

    if (event.type === "interview.ended") {
      onConnectionStateChange?.("closed");
    }

    onEvent?.(event);
  });

  ws.addEventListener("close", () => {
    if (closed) return;
    closed = true;
    micStreamer?.stop();
    player.stop();
    onConnectionStateChange?.("closed");
  });

  ws.addEventListener("error", () => {
    onConnectionStateChange?.("failed");
  });

  return {
    sendCheatSignal(signal) {
      send({ type: "cheat_signal", signal });
    },
    endInterview() {
      send({ type: "end_interview" });
    },
    close() {
      if (closed) return;
      closed = true;
      micStreamer?.stop();
      player.stop();
      try {
        ws.close();
      } catch {
        // ignore
      }
    },
  };
}
