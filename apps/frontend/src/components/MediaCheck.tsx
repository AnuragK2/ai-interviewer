import { useEffect, useRef, useState, type ReactNode } from "react";
import { PageShell } from "./PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Camera, CheckCircle2, Loader2, Mic, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { cn } from "../lib/utils";

type DeviceStatus = "idle" | "requesting" | "ready" | "error";

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
    setError(null);
    setCameraStatus("requesting");
    setMicStatus("requesting");
    setMicLevel(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      // A newer request (or unmount) started — discard this stream.
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
          // StrictMode / rapid re-requests interrupt play(); tracks can still be live.
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
    void requestMedia();

    return () => {
      // Invalidate in-flight requests so their catch handlers don't kill the next stream.
      requestIdRef.current += 1;
      stopMedia();
    };
    // Intentionally mount-only: StrictMode remounts once; request ids prevent races.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bothReady = cameraStatus === "ready" && micStatus === "ready";

  function handleContinue() {
    const stream = streamRef.current;
    if (!stream || !bothReady) return;

    // Hand ownership of the stream to the parent so tracks stay alive.
    streamRef.current = null;
    onReady(stream);
  }

  function handleExit() {
    requestIdRef.current += 1;
    stopMedia();
    onExit();
  }

  return (
    <PageShell>
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border/60 bg-card/70 shadow-2xl shadow-teal-950/20 backdrop-blur-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10">
                <ShieldAlert className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <CardTitle>Device check required</CardTitle>
                <CardDescription>
                  {candidateName}, enable your camera and microphone before starting the interview.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-black/40">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "aspect-video w-full object-cover",
                  cameraStatus !== "ready" && "opacity-40",
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DeviceStatusCard
                icon={<Camera className="h-4 w-4" />}
                label="Camera"
                status={cameraStatus}
              />
              <DeviceStatusCard
                icon={<Mic className="h-4 w-4" />}
                label="Microphone"
                status={micStatus}
                meter={micLevel}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              You cannot continue without a working camera and microphone. Speak briefly to confirm your mic is active.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleExit} className="border-border/60 bg-secondary/20">
                Exit interview
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row">
                {!bothReady && (
                  <Button variant="secondary" onClick={() => void requestMedia()}>
                    <RefreshCw className="h-4 w-4" />
                    Retry devices
                  </Button>
                )}
                <Button
                  onClick={handleContinue}
                  disabled={!bothReady}
                  className="bg-gradient-to-r from-teal-600 via-emerald-600 to-amber-500 text-white shadow-lg shadow-teal-950/30 hover:from-teal-500 hover:via-emerald-500 hover:to-amber-400 disabled:opacity-40"
                >
                  Continue to interview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
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
    <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <StatusBadge status={status} />
      </div>
      {typeof meter === "number" && status === "ready" && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-amber-400 transition-[width] duration-100"
            style={{ width: `${meter}%` }}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-teal-300">
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
