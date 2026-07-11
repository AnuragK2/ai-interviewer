import type { ReactNode } from "react";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { cn } from "@/shared/lib/utils";
import { Spinner } from "./Spinner";

type PageLoaderProps = {
  message?: string;
  className?: string;
  minHeight?: string;
};

export function PageLoader({
  message = "Loading…",
  className,
  minHeight = "min-h-[40vh]",
}: PageLoaderProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", minHeight, className)}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

type CardLoaderProps = {
  message?: string;
  className?: string;
};

export function CardLoader({ message = "Loading…", className }: CardLoaderProps) {
  return (
    <GlowingCard className={className}>
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </GlowingCard>
  );
}

type ButtonLoadingProps = {
  loading: boolean;
  children: ReactNode;
  loadingText?: ReactNode;
};

export function ButtonLoading({ loading, children, loadingText }: ButtonLoadingProps) {
  if (!loading) return <>{children}</>;

  return (
    <>
      <Spinner size="sm" className="text-current" />
      {loadingText ?? children}
    </>
  );
}
