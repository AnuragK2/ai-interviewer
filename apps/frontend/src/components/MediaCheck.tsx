import { useEffect, useRef, useState, type ReactNode } from "react";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Camera, CheckCircle2, Loader2, Mic, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  InterviewFlowShell,
  interviewOutlineButtonClass,
  interviewPrimaryButtonClass,
  interviewAccentIconClass,
  interviewSurfaceClass,
} from "@/features/interview/components/InterviewFlowShell";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";

type DeviceStatus = "idle" | "requesting" | "ready" | "error";
type CheckPhase = "consent" | "checking";

type MediaCheckProps = {
  candidateName: string;
  onReady: (stream: MediaStream) => void;
  onExit: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && !(error instanceof DOMException)) {
    return error.message || "Could not access your camera and microphone. Please try again.";
  }

  if (!(error instanceof DOMException)) {
    return "Could not access your camera and microphone. Please try again.";
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera and microphone access was blocked. Allow permissions in your browser settings, then retry.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera or microphone was found. Connect a device and retry.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your camera or microphone is already in use by another app. Close it and retry.";
    case "AbortError":
      return "Device setup was interrupted. Please retry.";
    default:
      return error.message || "Could not access your camera and microphone. Please try again.";
  }
}

function isPlayAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function MediaCheck({ candidateName, onReady, onExit }: MediaCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const [phase, setPhase] = useState<CheckPhase>("consent");
  const [cameraStatus, setCameraStatus] = useState<DeviceStatus>("idle");
  const [micStatus, setMicStatus] = useState<DeviceStatus>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function stopTracksOnly() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }

  function clearVideoElement() {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function stopMedia() {
    stopTracksOnly();
    clearVideoElement();
  }

  function startMicMeter(stream: MediaStream) {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      const currentAnalyser = analyserRef.current;
      if (!currentAnalyser) return;

      currentAnalyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      setMicLevel(Math.min(100, Math.round((average / 80) * 100)));
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    void audioContext.resume();
    tick();
  }

  async function requestMedia() {
    const requestId = ++requestIdRef.current;

    stopTracksOnly();
    setPhase("checking");
    setError(null);
    setCameraStatus("requesting");
    setMicStatus("requesting");
    setMicLevel(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (!videoTrack || videoTrack.readyState !== "live") {
        throw new Error("Camera is not available.");
      }

      if (!audioTrack || audioTrack.readyState !== "live") {
        throw new Error("Microphone is not available.");
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch (playError) {
          if (!isPlayAbortError(playError) || videoTrack.readyState !== "live") {
            throw playError;
          }
        }
      }

      if (requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      startMicMeter(stream);
      setCameraStatus("ready");
      setMicStatus("ready");

      videoTrack.addEventListener("ended", () => {
        if (requestId !== requestIdRef.current) return;
        setCameraStatus("error");
        setError("Camera was disconnected. Re-enable it to continue.");
      });

      audioTrack.addEventListener("ended", () => {
        if (requestId !== requestIdRef.current) return;
        setMicStatus("error");
        setError("Microphone was disconnected. Re-enable it to continue.");
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      stopMedia();
      setCameraStatus("error");
      setMicStatus("error");
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    setPhase("consent");
    setCameraStatus("idle");
    setMicStatus("idle");
    setMicLevel(0);
    setError(null);

    return () => {
      requestIdRef.current += 1;
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bothReady = cameraStatus === "ready" && micStatus === "ready";

  function handleContinue() {
    const stream = streamRef.current;
    if (!stream || !bothReady) return;

    streamRef.current = null;
    onReady(stream);
  }

  function handleExit() {
    requestIdRef.current += 1;
    stopMedia();
    onExit();
  }

  function handleRetryFromError() {
    setPhase("consent");
    setCameraStatus("idle");
    setMicStatus("idle");
    setMicLevel(0);
    setError(null);
    stopMedia();
  }

  return (
    <InterviewFlowShell>
      <Modal open={phase === "consent"}>
        <ModalContent
          aria-describedby="permission-description"
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <ModalHeader>
            <ModalTitle>Camera & microphone access</ModalTitle>
            <ModalDescription id="permission-description">
              {candidateName}, we need access to your camera and microphone before the interview can start.
            </ModalDescription>
          </ModalHeader>

          <ModalBody className={cn("space-y-3 rounded-xl p-4", interviewSurfaceClass)}>
            <div className="flex items-start gap-3 text-sm">
              <Camera className={cn("mt-0.5 h-4 w-4 shrink-0", interviewAccentIconClass)} />
              <div>
                <p className="font-medium">Camera</p>
                <p className="text-muted-foreground">Used for your live video during the interview.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Mic className={cn("mt-0.5 h-4 w-4 shrink-0", interviewAccentIconClass)} />
              <div>
                <p className="font-medium">Microphone</p>
                <p className="text-muted-foreground">Used so the interviewer can hear your answers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p>
                Your browser will ask for permission next. You cannot continue without granting both camera and
                microphone access.
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" onClick={handleExit} className={interviewOutlineButtonClass}>
              Exit interview
            </Button>
            <Button onClick={() => void requestMedia()} className={interviewPrimaryButtonClass}>
              Allow camera & microphone
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <PageContainer size="md">
        <PageHeader
          eyebrow="Interview setup"
          title="Device check"
          description={
            phase === "consent"
              ? "Grant permission in the dialog to begin device checks."
              : "Verify your camera and microphone are working before continuing."
          }
        />

        <GlowingCard>
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", interviewAccentIconClass)}>
              <ShieldAlert className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Camera and microphone</h2>
              <p className="text-sm text-muted-foreground">Required for proctored AI interviews.</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "aspect-video w-full object-cover",
                (phase === "consent" || cameraStatus !== "ready") && "opacity-0",
              )}
            />
            {(phase === "consent" || cameraStatus !== "ready") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/5 text-sm text-muted-foreground">
                {cameraStatus === "requesting" ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin opacity-70" />
                    Requesting camera & microphone...
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 opacity-50" />
                    {phase === "consent" ? "Waiting for permission..." : "Camera unavailable"}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DeviceStatusCard icon={<Camera className="h-4 w-4" />} label="Camera" status={cameraStatus} />
            <DeviceStatusCard icon={<Mic className="h-4 w-4" />} label="Microphone" status={micStatus} meter={micLevel} />
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <p className="text-xs leading-relaxed text-muted-foreground">
            You cannot continue without a working camera and microphone. Speak briefly to confirm your mic is active.
          </p>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={handleExit} className={interviewOutlineButtonClass}>
              Exit interview
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              {phase === "checking" && !bothReady ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (cameraStatus === "error" || micStatus === "error") {
                      handleRetryFromError();
                    } else {
                      void requestMedia();
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  {cameraStatus === "error" || micStatus === "error" ? "Request permission again" : "Retry devices"}
                </Button>
              ) : null}
              <Button onClick={handleContinue} disabled={!bothReady} className={interviewPrimaryButtonClass}>
                Continue to interview
              </Button>
            </div>
          </div>
        </GlowingCard>
      </PageContainer>
    </InterviewFlowShell>
  );
}

function DeviceStatusCard({
  icon,
  label,
  status,
  meter,
}: {
  icon: ReactNode;
  label: string;
  status: DeviceStatus;
  meter?: number;
}) {
  return (
    <div className={cn("rounded-xl p-4", interviewSurfaceClass)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <StatusBadge status={status} />
      </div>
      {typeof meter === "number" && status === "ready" ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-indigo-500 transition-[width] duration-100"
            style={{ width: `${meter}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-indigo-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready
      </span>
    );
  }

  if (status === "requesting") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <XCircle className="h-3.5 w-3.5" />
        Failed
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">Waiting</span>;
}

export default MediaCheck;
