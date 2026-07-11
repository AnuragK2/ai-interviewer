import type { UserRole } from "@ai-interviewer/api-types";
import { Navigate, Outlet, useLocation } from "react-router";
import { PageLoader } from "@/shared/components/loading";
import { useAuth } from "../context/auth-context";

function buildLoginRedirect(pathname: string, search: string, role: "candidate" | "recruiter" = "candidate") {
  const target = `${pathname}${search}`;
  const params = new URLSearchParams();
  params.set("role", role);
  params.set("redirect", target);
  return `/login?${params.toString()}`;
}

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, getDashboardPath } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader message="Loading your session…" minHeight="min-h-screen" />;
  }

  if (!user) {
    const loginRole = allowedRoles?.includes("RECRUITER") ? "recruiter" : "candidate";
    return (
      <Navigate
        to={buildLoginRedirect(location.pathname, location.search, loginRole)}
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
