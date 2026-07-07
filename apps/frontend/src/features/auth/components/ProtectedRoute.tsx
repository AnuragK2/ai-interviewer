import type { UserRole } from "@ai-interviewer/api-types";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/auth-context";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, getDashboardPath } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading your session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
