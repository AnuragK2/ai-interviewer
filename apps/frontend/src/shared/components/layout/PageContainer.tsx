import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
};

const sizeClass = {
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
} as const;

export function PageContainer({ children, className, size = "lg" }: PageContainerProps) {
  return <div className={cn("mx-auto space-y-8 px-6 py-8 sm:px-8", sizeClass[size], className)}>{children}</div>;
}
