import { Outlet } from "react-router";
import { PublicNavbar } from "@/shared/components/layout/PublicNavbar";
import { PageShell } from "@/shared/components/PageShell";

export function PublicLayout() {
  return (
    <PageShell>
      <PublicNavbar />
      <main className="pt-24">
        <Outlet />
      </main>
    </PageShell>
  );
}
