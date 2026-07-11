import { Outlet } from "react-router";
import { AppNavbar } from "@/shared/components/layout/AppNavbar";
import { PageShell } from "@/shared/components/PageShell";

export function RecruiterLayout() {
  return (
    <PageShell>
      <AppNavbar role="RECRUITER" />
      <main className="pt-28 pb-10">
        <Outlet />
      </main>
    </PageShell>
  );
}
