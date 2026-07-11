import { Outlet } from "react-router";
import { AppNavbar } from "@/shared/components/layout/AppNavbar";
import { PageShell } from "@/shared/components/PageShell";

export function CandidateLayout() {
  return (
    <PageShell>
      <AppNavbar role="CANDIDATE" />
      <main className="pt-28 pb-10">
        <Outlet />
      </main>
    </PageShell>
  );
}
