import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/shared/components/PageShell";
import { useAuth } from "@/features/auth/context/auth-context";

export function RecruiterDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-amber-400">Recruiter dashboard</p>
            <h1 className="text-3xl font-semibold">{user?.company?.name ?? "Your company"}</h1>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company workspace ready</CardTitle>
            <CardDescription>
              Phase 3 will add job posting here. All data is scoped to your tenant ({user?.company?.slug}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Signed in as {user?.email}</p>
            <p>No jobs or applicants yet — that&apos;s expected at the end of Phase 1.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
