import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { PageShell } from "@/shared/components/PageShell";
import { PageLoader } from "@/shared/components/loading";
import { useAuth } from "../context/auth-context";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { completeOAuthLogin, getDashboardPath } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const error = searchParams.get("error");
    const token = searchParams.get("token");

    if (error) {
      toast.error(`OAuth sign-in failed: ${decodeURIComponent(error)}`);
      setFailed(true);
      return;
    }

    if (!token) {
      toast.error("Missing OAuth token.");
      setFailed(true);
      return;
    }

    void completeOAuthLogin(token)
      .then((user) => setRedirectPath(getDashboardPath(user.role)))
      .catch((callbackError) => {
        toast.error(callbackError instanceof Error ? callbackError.message : "OAuth sign-in failed.");
        setFailed(true);
      });
  }, [searchParams, completeOAuthLogin, getDashboardPath]);

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  if (failed) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PageShell>
      <PageLoader message="Completing sign-in…" minHeight="min-h-screen" />
    </PageShell>
  );
}
