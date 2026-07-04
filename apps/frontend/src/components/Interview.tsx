import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { clearInterviewSession, loadInterviewSession } from "../lib/interviewSession";
import { stopMediaStream } from "../lib/mediaStream";
import {
  connectRealtimeInterview,
  type RealtimeConnection,
  type RealtimeServerEvent,
} from "../lib/realtimeInterview";
import { MediaCheck } from "./MediaCheck";
import { InterviewRoom, type TranscriptMessage } from "./InterviewRoom";

type ConnectionStatus = "idle" | "connecting" | "connected" | "failed";

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [checksPassed, setChecksPassed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const realtimeRef = useRef<RealtimeConnection | null>(null);
  const agentMessageIdRef = useRef<string | null>(null);

  const profile = useMemo(() => (id ? loadInterviewSession(id) : null), [id]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      realtimeRef.current?.close();
      realtimeRef.current = null;
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!checksPassed || !mediaStream || !id || !profile) return;

    let cancelled = false;

    async function startRealtime() {
      setConnectionStatus("connecting");
      setConnectionError(null);
      setTranscript([]);
      setAgentSpeaking(false);
      setUserSpeaking(false);
      agentMessageIdRef.current = null;

      try {
        const connection = await connectRealtimeInterview({
          interviewId: id!,
          mediaStream: mediaStream!,
          onConnectionStateChange(state) {
            if (state === "connected") setConnectionStatus("connected");
            if (state === "failed" || state === "disconnected") {
              setConnectionStatus("failed");
              setConnectionError("Realtime connection was lost.");
              setAgentSpeaking(false);
              setUserSpeaking(false);
            }
          },
          onEvent(event) {
            handleRealtimeEvent(event);
          },
        });

        if (cancelled) {
          connection.close();
          return;
        }

        realtimeRef.current = connection;
        setConnectionStatus("connected");
      } catch (error) {
        if (cancelled) return;
        setConnectionStatus("failed");
        setConnectionError(error instanceof Error ? error.message : "Failed to connect interview.");
      }
    }

    function appendAgentDelta(delta: string) {
      setAgentSpeaking(true);
      setTranscript((current) => {
        const activeId = agentMessageIdRef.current;
        if (activeId) {
          return current.map((message) =>
            message.id === activeId ? { ...message, text: `${message.text}${delta}` } : message,
          );
        }

        const messageId = createMessageId();
        agentMessageIdRef.current = messageId;
        return [...current, { id: messageId, role: "agent", text: delta }];
      });
    }

    function finalizeAgentTranscript(transcriptText: string) {
      agentMessageIdRef.current = null;
      const text = transcriptText.trim();
      if (!text) return;

      setTranscript((current) => {
        const last = current[current.length - 1];
        if (last?.role === "agent") {
          return current.map((message, index) =>
            index === current.length - 1 ? { ...message, text } : message,
          );
        }
        return [...current, { id: createMessageId(), role: "agent", text }];
      });
    }

    function appendUserTranscript(transcriptText: string) {
      setUserSpeaking(false);
      const text = transcriptText.trim();
      if (!text) return;
      setTranscript((current) => [...current, { id: createMessageId(), role: "user", text }]);
    }

    function handleRealtimeEvent(event: RealtimeServerEvent | string) {
      if (typeof event === "string") return;

      switch (event.type) {
        case "response.created":
        case "response.output_audio.delta":
        case "response.audio.delta":
        case "output_audio_buffer.started":
          setAgentSpeaking(true);
          break;
        case "response.done":
        case "response.output_audio.done":
        case "response.audio.done":
        case "output_audio_buffer.stopped":
          setAgentSpeaking(false);
          agentMessageIdRef.current = null;
          break;
        case "input_audio_buffer.speech_started":
          setUserSpeaking(true);
          break;
        case "input_audio_buffer.speech_stopped":
          setUserSpeaking(false);
          break;
        // GA event names
        case "response.output_audio_transcript.delta":
        case "response.output_text.delta":
        // Preview event names
        case "response.audio_transcript.delta":
        case "response.text.delta":
          if (typeof event.delta === "string" && event.delta) {
            appendAgentDelta(event.delta);
          }
          break;
        case "response.output_audio_transcript.done":
        case "response.output_text.done":
        case "response.audio_transcript.done":
        case "response.text.done":
          if (typeof event.transcript === "string") {
            finalizeAgentTranscript(event.transcript);
          } else if (typeof event.text === "string") {
            finalizeAgentTranscript(event.text);
          } else {
            agentMessageIdRef.current = null;
          }
          break;
        case "conversation.item.input_audio_transcription.completed":
        case "conversation.item.input_audio_transcription.delta":
          if (event.type.endsWith(".completed") && typeof event.transcript === "string") {
            appendUserTranscript(event.transcript);
          }
          break;
        default:
          break;
      }
    }

    void startRealtime();

    return () => {
      cancelled = true;
      realtimeRef.current?.close();
      realtimeRef.current = null;
    };
  }, [checksPassed, mediaStream, id, profile]);

  if (!id || !profile) {
    return <Navigate to="/" replace />;
  }

  const candidateName = profile.resume.name ?? profile.github.username ?? "Candidate";

  function exitInterview() {
    realtimeRef.current?.close();
    realtimeRef.current = null;
    stopMediaStream(mediaStreamRef.current);
    mediaStreamRef.current = null;
    setMediaStream(null);
    setChecksPassed(false);
    setConnectionStatus("idle");
    setAgentSpeaking(false);
    setUserSpeaking(false);
    clearInterviewSession(id!);
    navigate("/");
  }

  function toggleMic() {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    const next = !isMicEnabled;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setIsMicEnabled(next);
  }

  function toggleCamera() {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    const next = !isCameraEnabled;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setIsCameraEnabled(next);
  }

  if (!checksPassed || !mediaStream) {
    return (
      <MediaCheck
        candidateName={candidateName}
        onReady={(stream) => {
          mediaStreamRef.current = stream;
          setMediaStream(stream);
          setChecksPassed(true);
          setIsMicEnabled(true);
          setIsCameraEnabled(true);
        }}
        onExit={exitInterview}
      />
    );
  }

  return (
    <InterviewRoom
      candidateName={candidateName}
      interviewId={profile.interview.id}
      mediaStream={mediaStream}
      connectionStatus={connectionStatus}
      connectionError={connectionError}
      transcript={transcript}
      agentSpeaking={agentSpeaking}
      userSpeaking={userSpeaking}
      isMicEnabled={isMicEnabled}
      isCameraEnabled={isCameraEnabled}
      onToggleMic={toggleMic}
      onToggleCamera={toggleCamera}
      onEndInterview={exitInterview}
    />
  );
}

export default Interview;
