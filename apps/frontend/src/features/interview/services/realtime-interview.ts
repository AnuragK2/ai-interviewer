import type { CheatSignal, ServerInterviewEvent } from "@ai-interviewer/api-types";
import { BACKEND_URL } from "@/shared/api/config";
import { createAudioPlayer, createMicStreamer } from "./audio-bridge";

export type { CheatSignal, ServerInterviewEvent as BackendInterviewEvent };

export type RealtimeConnection = {
  sendCheatSignal: (signal: CheatSignal) => void;
  endInterview: () => void;
  close: () => void;
};

type ConnectOptions = {
  interviewId: string;
  mediaStream: MediaStream;
  onEvent?: (event: ServerInterviewEvent) => void;
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

function logInterviewWs(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.info(`[interview-ws] ${message}`, data);
  } else {
    console.info(`[interview-ws] ${message}`);
  }
}

export async function connectRealtimeInterview({
  interviewId,
  mediaStream,
  onEvent,
  onConnectionStateChange,
}: ConnectOptions): Promise<RealtimeConnection> {
  const wsUrl = toWebSocketUrl(BACKEND_URL);
  logInterviewWs("connecting", { wsUrl, interviewId, backendUrl: BACKEND_URL });
  onConnectionStateChange?.("connecting");

  const ws = new WebSocket(wsUrl);
  const player = createAudioPlayer();
  let micStreamer: ReturnType<typeof createMicStreamer> | null = null;
  let closed = false;
  let closeReason = "unknown";

  const send = (payload: Record<string, unknown>) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      logInterviewWs("send skipped — socket not open", {
        readyState: ws.readyState,
        type: payload.type,
      });
    }
  };

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      closeReason = "timeout (10s)";
      reject(new Error(`WebSocket connect timeout to ${wsUrl}`));
    }, 10_000);

    ws.addEventListener(
      "open",
      () => {
        window.clearTimeout(timeoutId);
        logInterviewWs("socket open");
        resolve();
      },
      { once: true },
    );

    ws.addEventListener(
      "close",
      (event) => {
        window.clearTimeout(timeoutId);
        closeReason = `closed before open code=${event.code} reason=${event.reason || "none"}`;
        logInterviewWs("socket closed during connect", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        reject(new Error(`Failed to connect interview WebSocket (${closeReason}).`));
      },
      { once: true },
    );

    ws.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeoutId);
        logInterviewWs("socket error during connect", { closeReason });
        reject(new Error(`Failed to connect interview WebSocket (${closeReason}).`));
      },
      { once: true },
    );
  });

  await player.resume();
  micStreamer = createMicStreamer(mediaStream, (audio) => {
    send({ type: "input_audio", audio });
  });
  await micStreamer.resume();

  logInterviewWs("sending join", { interviewId });
  send({ type: "join", interviewId });
  onConnectionStateChange?.("connected");

  ws.addEventListener("message", (message) => {
    let event: ServerInterviewEvent;
    try {
      event = JSON.parse(String(message.data)) as ServerInterviewEvent;
    } catch {
      logInterviewWs("invalid JSON from server");
      return;
    }

    if (event.type !== "output_audio") {
      logInterviewWs("event", { type: event.type });
    }

    if (event.type === "output_audio") {
      player.playPcm16Base64(event.audio);
    }

    if (event.type === "session.ready") {
      logInterviewWs("session.ready received");
      onConnectionStateChange?.("connected");
    }

    if (event.type === "error") {
      logInterviewWs("server error", { message: event.message });
      onConnectionStateChange?.("failed");
    }

    if (event.type === "interview.ended") {
      onConnectionStateChange?.("closed");
    }

    onEvent?.(event);
  });

  ws.addEventListener("close", (event) => {
    logInterviewWs("socket closed", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    if (closed) return;
    closed = true;
    micStreamer?.stop();
    player.stop();
    onConnectionStateChange?.("closed");
  });

  ws.addEventListener("error", () => {
    logInterviewWs("socket error after connect");
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
