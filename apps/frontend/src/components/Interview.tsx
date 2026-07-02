import type { PreInterviewResponse } from "@/lib/types";
import { PageShell } from "./PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";

type InterviewProps = {
  profile: PreInterviewResponse | null;
  onExit?: () => void;
};

export function Interview({ profile, onExit }: InterviewProps) {
  const candidateName = profile?.resume.name ?? profile?.github.username ?? "Candidate";

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
            <p className="text-sm text-muted-foreground">
              The interactive interview experience will be built here — questions, answers, and scoring.
            </p>
            {onExit && (
              <Button variant="outline" onClick={onExit} className="border-border/60 bg-secondary/20">
                Exit interview
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export default Interview;
