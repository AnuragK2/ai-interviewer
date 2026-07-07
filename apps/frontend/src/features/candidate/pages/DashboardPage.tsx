import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/shared/components/PageShell";
import { useAuth } from "@/features/auth/context/auth-context";

export function CandidateDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-teal-400">Candidate dashboard</p>
            <h1 className="text-3xl font-semibold">Welcome{user?.name ? `, ${user.name}` : ""}</h1>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete your profile</CardTitle>
            <CardDescription>
              Phase 2 will add the full profile portal here — skills, experience, resume upload, and links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Signed in as {user?.email}</p>
            <p>
              Browse jobs and track applications from this dashboard once Phase 2–4 are live. For now, you can
              still use the{" "}
              <Link to="/legacy" className="text-teal-400 underline-offset-4 hover:underline">
                legacy AI interview flow
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
