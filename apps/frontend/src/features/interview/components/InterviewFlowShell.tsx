import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import { AppNavbar } from "@/shared/components/layout/AppNavbar";
import { PageShell } from "@/shared/components/PageShell";
import { cn } from "@/shared/lib/utils";

type InterviewFlowShellProps = {
  children: ReactNode;
  showNavbar?: boolean;
  className?: string;
};

export function InterviewFlowShell({ children, showNavbar = true, className }: InterviewFlowShellProps) {
  const { user, isLoading } = useAuth();
  const hasNavbar = showNavbar && !isLoading && Boolean(user);

  return (
    <PageShell>
      {hasNavbar ? <AppNavbar role={user!.role} /> : null}
      <main className={cn(hasNavbar ? "pt-28 pb-10" : "min-h-screen", className)}>{children}</main>
    </PageShell>
  );
}

export const interviewPrimaryButtonClass = "bg-indigo-600 text-white hover:bg-indigo-500";
export const interviewOutlineButtonClass = "border-white/10 bg-white/5 hover:bg-white/10";
export const interviewAccentIconClass = "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
export const interviewSurfaceClass = "border-white/10 bg-white/5";
export const interviewMutedSurfaceClass = "border-white/10 bg-white/[0.03]";
export const interviewUserBubbleClass = "rounded-br-md bg-indigo-600/20 text-indigo-50";
export const interviewAgentBubbleClass = "rounded-bl-md bg-white/5 text-foreground/90";
