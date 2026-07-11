import { Link } from "react-router";
import { FadeIn } from "@/components/aceternity/fade-in";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";

export function LandingPage() {
  return (
    <PageContainer size="xl" className="flex min-h-[calc(100vh-6rem)] flex-col justify-center gap-12 py-12">
      <FadeIn className="space-y-5 text-center">
        <p className="text-xs font-medium tracking-[0.25em] text-indigo-300 uppercase">AI Hiring Platform</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Get hired smarter.
          <span className="block bg-gradient-to-r from-indigo-300 via-blue-200 to-violet-300 bg-clip-text text-transparent">
            Interview with precision.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
          Candidates build rich profiles and complete proctored AI interviews. Recruiters review fit,
          shortlist talent, and get structured feedback — all in one multi-tenant workspace.
        </p>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2">
        <GlowingCard delay={0.1}>
          <CardHeader>
            <CardTitle>I&apos;m a candidate</CardTitle>
            <CardDescription>
              Discover jobs, apply with your profile, and complete AI interviews when invited.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-500">
              <Link to="/register?role=candidate">Create account</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 border-white/10 bg-white/5">
              <Link to="/login?role=candidate">Sign in</Link>
            </Button>
          </CardContent>
        </GlowingCard>

        <GlowingCard delay={0.2}>
          <CardHeader>
            <CardTitle>I&apos;m a recruiter</CardTitle>
            <CardDescription>
              Create your company workspace, post jobs, and review applicant packets with AI insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-500">
              <Link to="/register?role=recruiter">Create company</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 border-white/10 bg-white/5">
              <Link to="/login?role=recruiter">Sign in</Link>
            </Button>
          </CardContent>
        </GlowingCard>
      </div>

      <FadeIn delay={0.3} className="text-center text-sm text-muted-foreground">
        Already have an interview link?{" "}
        <Link to="/legacy" className="text-indigo-300 underline-offset-4 hover:underline">
          Use the legacy interview flow
        </Link>
      </FadeIn>
    </PageContainer>
  );
}
