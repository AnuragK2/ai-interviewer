import { Link, Outlet } from "react-router";
import { AppNavbar } from "@/shared/components/layout/AppNavbar";
import { PageShell } from "@/shared/components/PageShell";
import { BillingProvider, useBilling } from "@/features/billing/context/billing-context";

function BillingLockBanner() {
  const { billing, writable } = useBilling();
  if (writable || !billing) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
      Recruiter workspace is read-only
      {billing.lockedReason ? ` (${billing.lockedReason})` : ""}.{" "}
      <Link to="/recruiter/billing" className="font-medium underline underline-offset-2">
        Upgrade billing
      </Link>{" "}
      to restore invites, job edits, and decisions.
    </div>
  );
}

function RecruiterLayoutInner() {
  return (
    <PageShell>
      <AppNavbar role="RECRUITER" />
      <div className="pt-28">
        <BillingLockBanner />
        <main className="pb-10">
          <Outlet />
        </main>
      </div>
    </PageShell>
  );
}

export function RecruiterLayout() {
  return (
    <BillingProvider>
      <RecruiterLayoutInner />
    </BillingProvider>
  );
}
