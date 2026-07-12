import { Link } from "react-router";
import { InViewFade } from "@/components/aceternity/in-view-fade";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingAudience() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <InViewFade className="mb-12 text-center">
          <p className="text-xs font-medium tracking-[0.25em] text-indigo-300 uppercase">Get started</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Choose your path</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Whether you&apos;re hiring or looking for your next role, GetHired has a workspace for you.
          </p>
        </InViewFade>

        <div className="grid gap-6 md:grid-cols-2">
          <InViewFade delay={0.05}>
            <GlowingCard delay={0}>
              <CardHeader>
                <CardTitle>I&apos;m a candidate</CardTitle>
                <CardDescription>
                  Build your profile, discover matched jobs, complete proctored AI interviews, and track every
                  application.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                  <Link to="/register?role=candidate">Create account</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-white/10 bg-white/5">
                  <Link to="/login?role=candidate">Sign in</Link>
                </Button>
              </CardContent>
            </GlowingCard>
          </InViewFade>

          <InViewFade delay={0.1}>
            <GlowingCard delay={0}>
              <CardHeader>
                <CardTitle>I&apos;m a recruiter</CardTitle>
                <CardDescription>
                  Launch your company workspace, post roles, review AI applicant packets, and make data-informed
                  hiring decisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                  <Link to="/register?role=recruiter">Create company</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-white/10 bg-white/5">
                  <Link to="/login?role=recruiter">Sign in</Link>
                </Button>
              </CardContent>
            </GlowingCard>
          </InViewFade>
        </div>

        <InViewFade delay={0.15} className="mt-8 text-center text-sm text-muted-foreground">
          Invited to an interview?{" "}
          <Link to="/login?role=candidate" className="text-indigo-300 underline-offset-4 hover:underline">
            Sign in to your candidate account
          </Link>{" "}
          and open the application from your dashboard.
        </InViewFade>
      </div>
    </section>
  );
}
