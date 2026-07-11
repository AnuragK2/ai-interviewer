import { Link } from "react-router";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useAuth } from "@/features/auth/context/auth-context";

export function RecruiterDashboardPage() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Recruiter"
        title={user?.company?.name ?? "Your company"}
        description={`Workspace scoped to ${user?.company?.slug ?? "your tenant"}.`}
      />

      <GlowingCard>
        <CardHeader>
          <CardTitle>Company workspace</CardTitle>
          <CardDescription>Manage job postings and review applicant packets with AI insights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Signed in as {user?.email}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link to="/recruiter/jobs">Manage jobs</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/5">
              <Link to="/recruiter/jobs/new">Create job</Link>
            </Button>
          </div>
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
