import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { PageShell } from "@/shared/components/PageShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { ProctoringState } from "@/features/proctoring/hooks/use-proctoring";
import {
  Bot,
  Camera,
  CameraOff,
  Eye,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";

export type TranscriptMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
};

type ConnectionStatus = "idle" | "connecting" | "connected" | "failed";

type InterviewRoomProps = {
  candidateName: string;
  interviewId: string;
  mediaStream: MediaStream;
  videoRef: RefObject<HTMLVideoElement | null>;
  proctoring: ProctoringState;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  transcript: TranscriptMessage[];
  agentSpeaking: boolean;
  userSpeaking: boolean;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndInterview: () => void;
};

export function InterviewRoom({
  candidateName,
  interviewId,
  mediaStream,
  videoRef,
  proctoring,
  connectionStatus,
  connectionError,
  transcript,
  agentSpeaking,
  userSpeaking,
  isMicEnabled,
  isCameraEnabled,
  onToggleMic,
  onToggleCamera,
  onEndInterview,
}: InterviewRoomProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = mediaStream;
    void video.play().catch(() => {
      // Autoplay can fail briefly during track toggles.
    });
  }, [mediaStream, isCameraEnabled, videoRef]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <PageShell>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border/50 bg-background/40 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10">
              <Sparkles className="h-5 w-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold sm:text-base">AI Interview Session</h1>
              <p className="truncate text-xs text-muted-foreground">
                {candidateName} · <span className="font-mono">{interviewId.slice(0, 8)}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ProctoringBadge proctoring={proctoring} />
            <ConnectionBadge status={connectionStatus} />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-4 pb-28 sm:p-6 sm:pb-32">
          <div className="flex w-full max-w-5xl flex-col items-center gap-5">
            <div className="grid w-full max-w-3xl grid-cols-1 justify-items-center gap-5 sm:grid-cols-2">
              <ParticipantTile
                label="AI Interviewer"
                subtitle={agentSpeaking ? "Speaking..." : "Listening"}
                active={agentSpeaking}
                accent="agent"
              >
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-teal-950 via-emerald-950 to-amber-950">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.25),transparent_45%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,191,36,0.18),transparent_40%)]" />
                  <div
                    className={cn(
                      "relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-teal-400/30 bg-teal-500/10 shadow-[0_0_60px_rgba(45,212,191,0.25)] transition-transform duration-300 sm:h-28 sm:w-28",
                      agentSpeaking && "scale-105 border-teal-300/60 shadow-[0_0_80px_rgba(45,212,191,0.45)]",
                    )}
                  >
                    <Bot className="h-10 w-10 text-teal-200 sm:h-12 sm:w-12" />
                    {agentSpeaking && (
                      <span className="absolute inset-0 animate-ping rounded-full border border-teal-300/40" />
                    )}
                  </div>
                  {agentSpeaking && <AudioBars className="absolute bottom-5" />}
                </div>
              </ParticipantTile>

              <ParticipantTile
                label="You"
                subtitle={userSpeaking ? "Speaking..." : isMicEnabled ? "Mic on" : "Mic muted"}
                active={userSpeaking}
                accent="user"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-black/50">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "h-full w-full scale-x-[-1] object-cover",
                      !isCameraEnabled && "invisible",
                    )}
                  />
                  {proctoring.status === "warning" && isCameraEnabled && (
                    <div className="absolute inset-x-3 top-3 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-950/80 px-3 py-2 text-xs text-amber-100 backdrop-blur-sm">
                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{proctoring.message ?? "Stay focused on the camera."}</span>
                    </div>
                  )}
                  {!isCameraEnabled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/40">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/50 bg-secondary/60">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Camera is off</p>
                    </div>
                  )}
                  {userSpeaking && isMicEnabled && (
                    <div className="absolute bottom-4 left-4 rounded-full border border-teal-400/30 bg-black/50 px-3 py-1 text-xs text-teal-200 backdrop-blur-sm">
                      Speaking
                    </div>
                  )}
                </div>
              </ParticipantTile>
            </div>

            {connectionStatus === "failed" && (
              <div className="w-full max-w-3xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {connectionError ?? "Connection failed."}
              </div>
            )}

            <aside className="flex h-56 w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl sm:h-64">
              <div className="border-b border-border/50 px-4 py-3">
                <h2 className="text-sm font-medium">Live transcript</h2>
                <p className="text-xs text-muted-foreground">Conversation appears here in real time</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {transcript.length === 0 ? (
                  <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2 text-center">
                    {connectionStatus === "connecting" ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
                        <p className="text-sm text-muted-foreground">Connecting to interviewer...</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Waiting for conversation to start...</p>
                    )}
                  </div>
                ) : (
                  transcript.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          message.role === "user"
                            ? "rounded-br-md bg-teal-600/20 text-teal-50"
                            : "rounded-bl-md bg-secondary/70 text-foreground/90",
                        )}
                      >
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {message.role === "user" ? "You" : "Interviewer"}
                        </p>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </aside>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-background/80 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center justify-center gap-3">
            <ControlButton
              active={isMicEnabled}
              label={isMicEnabled ? "Mute" : "Unmute"}
              onClick={onToggleMic}
            >
              {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton
              active={isCameraEnabled}
              label={isCameraEnabled ? "Stop camera" : "Start camera"}
              onClick={onToggleCamera}
            >
              {isCameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </ControlButton>
            <Button
              onClick={onEndInterview}
              className="h-12 rounded-full bg-red-600 px-6 text-white shadow-lg shadow-red-950/40 hover:bg-red-500"
            >
              <PhoneOff className="h-5 w-5" />
              End interview
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ParticipantTile({
  label,
  subtitle,
  active,
  accent,
  children,
}: {
  label: string;
  subtitle: string;
  active: boolean;
  accent: "agent" | "user";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border bg-card/40 shadow-2xl backdrop-blur-xl transition-colors",
        active
          ? accent === "agent"
            ? "border-teal-400/50 shadow-teal-950/30"
            : "border-amber-400/40 shadow-amber-950/20"
          : "border-border/50",
      )}
    >
      <div className="relative w-full">{children}</div>
      <div className="flex items-center justify-between gap-3 border-t border-border/40 bg-background/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            active ? "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)]" : "bg-muted-foreground/40",
          )}
        />
      </div>
    </div>
  );
}

function ControlButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "h-12 w-12 rounded-full border-border/60 p-0",
        active ? "bg-secondary/40 text-foreground" : "bg-secondary/20 text-muted-foreground",
      )}
    >
      {children}
    </Button>
  );
}

function ProctoringBadge({ proctoring }: { proctoring: ProctoringState }) {
  if (proctoring.status === "inactive") return null;

  if (proctoring.status === "initializing") {
    return (
      <span className="hidden items-center gap-2 rounded-full border border-border/50 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Proctoring
      </span>
    );
  }

  if (proctoring.status === "unavailable") {
    return (
      <span className="hidden items-center gap-2 rounded-full border border-border/50 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
        <Eye className="h-3.5 w-3.5" />
        Partial
      </span>
    );
  }

  if (proctoring.status === "warning") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
        <ShieldAlert className="h-3.5 w-3.5" />
        Proctoring alert
      </span>
    );
  }

  return (
    <span className="hidden items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs text-teal-300 sm:inline-flex">
      <Eye className="h-3.5 w-3.5" />
      Proctored
    </span>
  );
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Connecting
      </span>
    );
  }

  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs text-teal-300">
        <span className="h-2 w-2 rounded-full bg-teal-400" />
        Live
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
        Disconnected
      </span>
    );
  }

  return null;
}

function AudioBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-1", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-teal-300/80"
          style={{
            height: `${10 + (index % 3) * 8}px`,
            animation: `interview-bar 0.8s ease-in-out ${index * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes interview-bar {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default InterviewRoom;
