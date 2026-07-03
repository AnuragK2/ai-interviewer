import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { clearInterviewSession, loadInterviewSession } from "../lib/interviewSession";
import { stopMediaStream } from "../lib/mediaStream";
import { MediaCheck } from "./MediaCheck";
import { PageShell } from "./PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";

export function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [checksPassed, setChecksPassed] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const profile = useMemo(() => (id ? loadInterviewSession(id) : null), [id]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  // Always release camera/mic when leaving the interview route.
  useEffect(() => {
    return () => {
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    };
  }, []);

  if (!id || !profile) {
    return <Navigate to="/" replace />;
  }

  const candidateName = profile.resume.name ?? profile.github.username ?? "Candidate";

  function exitInterview() {
    stopMediaStream(mediaStreamRef.current);
    mediaStreamRef.current = null;
    setMediaStream(null);
    setChecksPassed(false);
    clearInterviewSession(id!);
    navigate("/");
  }

  if (!checksPassed || !mediaStream) {
    return (
      <MediaCheck
        candidateName={candidateName}
        onReady={(stream) => {
          mediaStreamRef.current = stream;
          setMediaStream(stream);
          setChecksPassed(true);
        }}
        onExit={exitInterview}
      />
    );
  }

  return (
    <PageShell>
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg border-border/60 bg-card/70 backdrop-blur-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10">
                <MessageSquare className="h-5 w-5 text-teal-300" />
              </div>
              <div>
                <CardTitle>Interview session</CardTitle>
                <CardDescription>Live interview for {candidateName}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-xs text-muted-foreground">
              Interview ID: <span className="font-mono text-foreground/80">{profile.interview.id}</span>
            </p>
            <p className="text-sm text-teal-300">Camera and microphone checks passed.</p>
            <p className="text-sm text-muted-foreground">
              The interactive interview experience will be built here — questions, answers, and scoring.
            </p>
            <Button variant="outline" onClick={exitInterview} className="border-border/60 bg-secondary/20">
              Exit interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export default Interview;
