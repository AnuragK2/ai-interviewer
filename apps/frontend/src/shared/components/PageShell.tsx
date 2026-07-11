import type { ReactNode } from "react";
import { BackgroundGrid } from "@/components/aceternity/background-grid";
import { Spotlight } from "@/components/aceternity/spotlight";
import { cn } from "@/shared/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-background text-foreground", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(59,130,246,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(79,70,229,0.1),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      <BackgroundGrid />
      <Spotlight />
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
