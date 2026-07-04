import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-background text-foreground", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(45,212,191,0.16),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_50%,rgba(251,146,60,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_0%_80%,rgba(52,211,153,0.1),transparent_55%)]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-rose-400/5 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-[-4rem] h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] left-[-3rem] h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(45,212,191,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_75%)]" />
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
