import type { BillingMeResponse } from "@ai-interviewer/api-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import * as billingApi from "@/features/billing/services/billing-api";

type BillingContextValue = {
  billing: BillingMeResponse | null;
  loading: boolean;
  error: string | null;
  refresh: (openJobs?: number) => Promise<void>;
  writable: boolean;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (openJobs = 0) => {
    if (!user || user.role !== "RECRUITER") {
      setBilling(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const me = await billingApi.getBillingMe(openJobs);
      setBilling(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      billing,
      loading,
      error,
      refresh,
      writable: billing?.writable ?? true,
    }),
    [billing, loading, error, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error("useBilling must be used within BillingProvider");
  }
  return ctx;
}
