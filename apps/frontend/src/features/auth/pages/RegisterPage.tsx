import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/shared/components/PageShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { useAuth } from "../context/auth-context";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRecruiter = searchParams.get("role") === "recruiter";
  const role = isRecruiter ? "RECRUITER" : "CANDIDATE";
  const { registerCandidate, registerRecruiter, user, isLoading, getDashboardPath } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const nextUser = isRecruiter
        ? await registerRecruiter({ name, email, password, companyName, title: title || undefined })
        : await registerCandidate({ name, email, password });

      navigate(getDashboardPath(nextUser.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>{isRecruiter ? "Create company workspace" : "Create candidate account"}</CardTitle>
            <CardDescription>
              {isRecruiter
                ? "Register as a recruiter and set up your company tenant."
                : "Build your profile and apply to recommended jobs."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <OAuthButtons role={role} />

            <div className="relative text-center text-xs uppercase tracking-wide text-muted-foreground">
              <span className="bg-card relative z-10 px-2">or email</span>
              <div className="absolute inset-x-0 top-1/2 border-t border-border" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {isRecruiter ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job title (optional)</Label>
                    <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
                  </div>
                </>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                to={`/login?role=${isRecruiter ? "recruiter" : "candidate"}`}
                className="text-teal-400 underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
