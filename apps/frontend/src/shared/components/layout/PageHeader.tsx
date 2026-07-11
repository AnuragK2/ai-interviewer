import type { ReactNode } from "react";
import { FadeIn } from "@/components/aceternity/fade-in";
import { cn } from "@/shared/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <FadeIn className={cn("mb-2 flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.2em] text-indigo-300/90 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </FadeIn>
  );
}
