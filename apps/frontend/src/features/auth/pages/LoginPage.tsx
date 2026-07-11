import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { OAuthButtons } from "../components/OAuthButtons";
import { useAuth } from "../context/auth-context";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") === "recruiter" ? "RECRUITER" : "CANDIDATE";
  const { login, user, isLoading, getDashboardPath } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const nextUser = await login(email, password);
      navigate(getDashboardPath(nextUser.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer size="md" className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <GlowingCard className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            {role === "RECRUITER"
              ? "Access your company hiring workspace."
              : "Continue to your candidate dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <OAuthButtons role={role} />

          <div className="relative text-center text-xs uppercase tracking-wide text-muted-foreground">
            <span className="relative z-10 bg-card/80 px-2">or email</span>
            <div className="absolute inset-x-0 top-1/2 border-t border-border" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="border-white/10 bg-white/5"
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              to={`/register?role=${role === "RECRUITER" ? "recruiter" : "candidate"}`}
              className="text-indigo-300 underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </GlowingCard>
    </PageContainer>
  );
}
