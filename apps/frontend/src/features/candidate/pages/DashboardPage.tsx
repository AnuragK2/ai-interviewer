import { Link } from "react-router";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useAuth } from "@/features/auth/context/auth-context";

export function CandidateDashboardPage() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Candidate"
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Complete your profile and track applications from one place."
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>
            Add skills, experience, resume, and preferences so recruiters can match you to roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Signed in as {user?.email}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link to="/candidate/profile">Go to profile</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/5">
              <Link to="/candidate/jobs">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/5">
              <Link to="/candidate/applications">My applications</Link>
            </Button>
          </div>
          <p>
            Legacy AI interview flow:{" "}
            <Link to="/legacy" className="text-indigo-300 underline-offset-4 hover:underline">
              start here
            </Link>
          </p>
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
