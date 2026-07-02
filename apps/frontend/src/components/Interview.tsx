import type { PreInterviewResponse } from "@/lib/types";
import { PageShell } from "./PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, User } from "lucide-react";

type InterviewProps = {
  profile: PreInterviewResponse | null;
};

export function Interview({ profile }: InterviewProps) {
  if (!profile) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center p-6">
          <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>No profile data</CardTitle>
              <CardDescription>Go back and upload your resume to start an interview.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageShell>
    );
  }

  const candidateName = profile.resume.name ?? profile.github.username;

  return (
    <PageShell>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 py-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10">
              <MessageSquare className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Interview session</h1>
              <p className="text-sm text-muted-foreground">Personalized for {candidateName}</p>
            </div>
          </div>
        </div>

        <Card className="border-border/60 bg-card/70 backdrop-blur-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                <User className="h-5 w-5 text-teal-300" />
              </div>
              <div>
                <CardTitle>{candidateName}</CardTitle>
                <CardDescription>{profile.github.profileUrl}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {profile.resume.summary && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">Summary</h2>
                <p className="text-sm leading-relaxed">{profile.resume.summary}</p>
              </div>
            )}
            {profile.resume.skills.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.resume.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border/50 bg-secondary/40 px-3 py-1 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">GitHub</h2>
              <p className="text-sm">{profile.github.repos.length} public repositories loaded</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Interview questions will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export default Interview;
