import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { saveInterviewEndState } from "@/shared/lib/interview-end-state";
import { stopMediaStream } from "@/shared/lib/media-stream";
import { useProctoring } from "@/features/proctoring/hooks/use-proctoring";
import * as applicationApi from "@/features/applications/services/application-api";
import type { InterviewAccessResponse } from "@ai-interviewer/api-types";
import { useInterviewRecording } from "@/features/interview/hooks/use-interview-recording";
import { captureVideoFrame } from "@/features/interview/lib/capture-video-frame";
import * as interviewApi from "@/features/interview/services/interview-api";
import { InterviewFlowShell } from "@/features/interview/components/InterviewFlowShell";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageLoader } from "@/shared/components/loading";
import { Button } from "@/components/ui/button";
import {
  connectRealtimeInterview,
  type BackendInterviewEvent,
  type CheatSignal,
  type RealtimeConnection,
} from "@/features/interview/services/realtime-interview";
import { MediaCheck } from "./MediaCheck";
import { InterviewRoom, type TranscriptMessage } from "./InterviewRoom";
import { toast } from "sonner";

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
  const [accessChecked, setAccessChecked] = useState(false);
  const [access, setAccess] = useState<InterviewAccessResponse | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const realtimeRef = useRef<RealtimeConnection | null>(null);
  const agentMessageIdRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const accessRef = useRef<InterviewAccessResponse | null>(null);

  const isInterviewSessionActive = checksPassed && connectionStatus === "connected";
  const { stopAndGetBlob } = useInterviewRecording(mediaStream, isInterviewSessionActive);

  async function uploadProctoringEvidence(signal: CheatSignal) {
    if (!id || !videoRef.current) return;
    try {
      const frame = await captureVideoFrame(videoRef.current);
      if (!frame) {
        console.warn("[interview] Proctoring snapshot skipped — video frame not ready.", { signal });
        return;
      }
      await interviewApi.uploadProctoringSnapshot(id, frame, signal);
    } catch (error) {
      console.error("[interview] Proctoring snapshot upload failed:", { signal, error });
    }
  }

  async function uploadSessionRecording() {
    if (!id) return;
    try {
      const blob = await stopAndGetBlob();
      if (!blob || blob.size === 0) {
        console.warn("[interview] Recording upload skipped — no captured media.", { interviewId: id });
        return;
      }
      await interviewApi.uploadInterviewRecording(id, blob);
    } catch (error) {
      console.error("[interview] Recording upload failed:", { interviewId: id, error });
    }
  }

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    void (async () => {
      try {
        let nextAccess = await applicationApi.getInterviewAccess(id);

        if (nextAccess.application.status === "INTERVIEW_INVITED") {
          await applicationApi.markInterviewPending(nextAccess.application.id);
          nextAccess = await applicationApi.getInterviewAccess(id);
        }

        if (cancelled) return;
        setAccess(nextAccess);
        accessRef.current = nextAccess;
      } catch {
        if (!cancelled) setAccess(null);
      } finally {
        if (!cancelled) setAccessChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const proctoring = useProctoring({
    videoRef,
    enabled: checksPassed && !!mediaStream,
    cameraEnabled: isCameraEnabled,
    onViolation: (signal) => {
      void uploadProctoringEvidence(signal);
      realtimeRef.current?.sendCheatSignal(signal);
    },
    onSoftWarning: (message) => {
      toast.warning(message);
    },
  });

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
    if (!checksPassed || !mediaStream || !id || !access?.canStartInterview) return;

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
            if (state === "failed") {
              setConnectionStatus("failed");
              setConnectionError("Realtime connection failed.");
            }
          },
          onEvent(event) {
            handleBackendEvent(event);
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

    function handleBackendEvent(event: BackendInterviewEvent) {
      switch (event.type) {
        case "agent_speaking":
          setAgentSpeaking(event.speaking);
          if (!event.speaking) agentMessageIdRef.current = null;
          break;
        case "user_speaking":
          setUserSpeaking(event.speaking);
          break;
        case "transcript":
          if (event.role === "agent") {
            if (event.final) {
              agentMessageIdRef.current = null;
              setTranscript((current) => {
                const last = current[current.length - 1];
                if (last?.role === "agent") {
                  return current.map((message, index) =>
                    index === current.length - 1 ? { ...message, text: event.text } : message,
                  );
                }
                return [...current, { id: createMessageId(), role: "agent", text: event.text }];
              });
            } else {
              setTranscript((current) => {
                const activeId = agentMessageIdRef.current;
                if (activeId) {
                  return current.map((message) =>
                    message.id === activeId
                      ? { ...message, text: `${message.text}${event.text}` }
                      : message,
                  );
                }
                const messageId = createMessageId();
                agentMessageIdRef.current = messageId;
                return [...current, { id: messageId, role: "agent", text: event.text }];
              });
            }
          } else if (event.final) {
            setTranscript((current) => [
              ...current,
              { id: createMessageId(), role: "user", text: event.text },
            ]);
          }
          break;
        case "error":
          setConnectionStatus("failed");
          setConnectionError(event.message);
          break;
        case "proctoring.warning":
          toast.warning(event.message);
          break;
        case "interview.ended":
          handleInterviewEnded(event);
          break;
        default:
          break;
      }
    }

    function cleanupMedia() {
      realtimeRef.current?.close();
      realtimeRef.current = null;
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
      setMediaStream(null);
      setChecksPassed(false);
      setAgentSpeaking(false);
      setUserSpeaking(false);
    }

    function handleInterviewEnded(event: Extract<BackendInterviewEvent, { type: "interview.ended" }>) {
      const currentAccess = accessRef.current;
      const applicationId = currentAccess?.application.id;
      const candidateName = currentAccess?.application.candidateName ?? currentAccess?.jobTitle ?? "Candidate";
      const recordingUpload = uploadSessionRecording();

      void recordingUpload.finally(() => {
        cleanupMedia();

        if (event.reason === "cheat") {
          saveInterviewEndState({
            reason: "cheat",
            message: event.message,
            score: event.score,
            interviewId: id!,
            applicationId,
            candidateName,
          });
          navigate(`/interview/${id}/proctoring-ended`, { replace: true });
          return;
        }

        if (event.reason === "completed" || event.reason === "client_end") {
          saveInterviewEndState({
            reason: event.reason,
            message: event.message,
            score: event.score,
            interviewId: id!,
            applicationId,
            candidateName,
          });
          navigate(`/interview/${id}/complete`, { replace: true });
          return;
        }

        if (applicationId) {
          navigate(`/candidate/applications/${applicationId}`, { replace: true });
          return;
        }

        navigate(`/results/${id}`, { replace: true });
      });
    }

    void startRealtime();

    return () => {
      cancelled = true;
      realtimeRef.current?.close();
      realtimeRef.current = null;
    };
  }, [checksPassed, mediaStream, id, access?.canStartInterview, navigate]);

  useEffect(() => {
    if (!checksPassed || connectionStatus !== "connected") return;

    const sendCheat = (signal: CheatSignal) => {
      realtimeRef.current?.sendCheatSignal(signal);
    };

    let lastFocusSignalAt = 0;
    const sendFocusCheat = (signal: "tab_hidden" | "window_blur") => {
      const now = Date.now();
      if (now - lastFocusSignalAt < 2_000) return;
      lastFocusSignalAt = now;
      void uploadProctoringEvidence(signal);
      sendCheat(signal);
    };

    const onVisibility = () => {
      if (document.hidden) sendFocusCheat("tab_hidden");
    };
    const onBlur = () => sendFocusCheat("window_blur");
    const onCopy = () => sendCheat("copy");
    const onPaste = () => sendCheat("paste");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [checksPassed, connectionStatus]);

  if (!id || !accessChecked) {
    return (
      <InterviewFlowShell>
        <PageContainer>
          <PageLoader message="Checking interview access…" />
        </PageContainer>
      </InterviewFlowShell>
    );
  }

  if (!access?.canStartInterview) {
    const applicationId = access?.application.id;
    return (
      <InterviewFlowShell>
        <PageContainer size="md">
          <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
            <h1 className="text-xl font-semibold">Interview not available</h1>
            <p className="text-sm text-muted-foreground">
              {access
                ? "This interview has not been opened for you yet, or it has already finished."
                : "You do not have access to this interview. Only invited candidates can join."}
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link to={applicationId ? `/candidate/applications/${applicationId}` : "/candidate/applications"}>
                Back to applications
              </Link>
            </Button>
          </div>
        </PageContainer>
      </InterviewFlowShell>
    );
  }

  const candidateName = access.application.candidateName ?? access.jobTitle ?? "Candidate";
  const interviewId = access.application.interviewId ?? id;

  function exitInterview() {
    realtimeRef.current?.endInterview();
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
      interviewId={interviewId}
      mediaStream={mediaStream}
      videoRef={videoRef}
      proctoring={proctoring}
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
