import { BACKEND_URL } from "./config";

export type RealtimeServerEvent = {
  type: string;
  [key: string]: unknown;
};

export type RealtimeConnection = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  audioElement: HTMLAudioElement;
  sendEvent: (event: Record<string, unknown>) => void;
  close: () => void;
};

type ConnectOptions = {
  interviewId: string;
  mediaStream: MediaStream;
  onEvent?: (event: RealtimeServerEvent | string) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
};

export async function connectRealtimeInterview({
  interviewId,
  mediaStream,
  onEvent,
  onConnectionStateChange,
}: ConnectOptions): Promise<RealtimeConnection> {
  const pc = new RTCPeerConnection();

  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;

  pc.ontrack = (event) => {
    audioElement.srcObject = event.streams[0] ?? null;
  };

  const audioTrack = mediaStream.getAudioTracks()[0];
  if (!audioTrack) {
    pc.close();
    throw new Error("No microphone track available for the interview.");
  }

  pc.addTrack(audioTrack, mediaStream);

  const dc = pc.createDataChannel("oai-events");

  dc.addEventListener("message", (event) => {
    try {
      onEvent?.(JSON.parse(String(event.data)) as RealtimeServerEvent);
    } catch {
      onEvent?.(String(event.data));
    }
  });

  pc.onconnectionstatechange = () => {
    onConnectionStateChange?.(pc.connectionState);
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  if (!offer.sdp) {
    pc.close();
    throw new Error("Failed to create WebRTC offer.");
  }

  const sdpResponse = await fetch(`${BACKEND_URL}/api/v1/interview/${interviewId}/session`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      "Content-Type": "application/sdp",
    },
  });

  if (!sdpResponse.ok) {
    const details = await sdpResponse.text();
    pc.close();
    throw new Error(details || "Failed to start realtime interview session.");
  }

  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };

  await pc.setRemoteDescription(answer);

  return {
    pc,
    dc,
    audioElement,
    sendEvent(event) {
      if (dc.readyState === "open") {
        dc.send(JSON.stringify(event));
      }
    },
    close() {
      try {
        dc.close();
      } catch {
        // ignore
      }
      pc.close();
      audioElement.pause();
      audioElement.srcObject = null;
      audioElement.remove();
    },
  };
}
