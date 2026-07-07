import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/shared/components/PageShell";

export function LandingPage() {
  return (
    <PageShell>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16">
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium tracking-wide text-teal-400 uppercase">AI Hiring Platform</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Hire smarter. Interview with AI. Move faster.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Candidates build rich profiles and complete proctored AI interviews. Recruiters review fit,
            shortlist talent, and get structured feedback — all in one multi-tenant workspace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>I&apos;m a candidate</CardTitle>
              <CardDescription>
                Discover jobs, apply with your profile, and complete AI interviews when invited.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button asChild className="flex-1">
                <Link to="/register?role=candidate">Create account</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/login?role=candidate">Sign in</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>I&apos;m a recruiter</CardTitle>
              <CardDescription>
                Create your company workspace, post jobs, and review applicant packets with AI insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button asChild className="flex-1">
                <Link to="/register?role=recruiter">Create company</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/login?role=recruiter">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an interview link?{" "}
          <Link to="/legacy" className="text-teal-400 underline-offset-4 hover:underline">
            Use the legacy interview flow
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
