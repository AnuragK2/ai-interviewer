import type { AuthUser, UserRole } from "@ai-interviewer/api-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/shared/lib/auth-storage";
import * as authApi from "../services/auth-api";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  registerCandidate: (input: { email: string; password: string; name: string }) => Promise<AuthUser>;
  registerRecruiter: (input: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    title?: string;
  }) => Promise<AuthUser>;
  completeOAuthLogin: (token: string) => Promise<AuthUser>;
  logout: () => void;
  getDashboardPath: (role?: UserRole) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function dashboardPathForRole(role: UserRole): string {
  return role === "RECRUITER" ? "/recruiter/dashboard" : "/candidate/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.fetchCurrentUser();
      setUser(currentUser);
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  const persistAuth = useCallback((accessToken: string, nextUser: AuthUser) => {
    setAccessToken(accessToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    return persistAuth(result.accessToken, result.user);
  }, [persistAuth]);

  const registerCandidate = useCallback(
    async (input: { email: string; password: string; name: string }) => {
      const result = await authApi.registerCandidate(input);
      toast.success("Account created.");
      return persistAuth(result.accessToken, result.user);
    },
    [persistAuth],
  );

  const registerRecruiter = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      companyName: string;
      title?: string;
    }) => {
      const result = await authApi.registerRecruiter(input);
      toast.success("Company workspace created.");
      return persistAuth(result.accessToken, result.user);
    },
    [persistAuth],
  );

  const completeOAuthLogin = useCallback(
    async (token: string) => {
      setAccessToken(token);
      const currentUser = await authApi.fetchCurrentUser();
      setUser(currentUser);
      toast.success("Signed in successfully.");
      return currentUser;
    },
    [],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  const getDashboardPath = useCallback(
    (role?: UserRole) => dashboardPathForRole(role ?? user?.role ?? "CANDIDATE"),
    [user?.role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      registerCandidate,
      registerRecruiter,
      completeOAuthLogin,
      logout,
      getDashboardPath,
    }),
    [user, isLoading, login, registerCandidate, registerRecruiter, completeOAuthLogin, logout, getDashboardPath],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
