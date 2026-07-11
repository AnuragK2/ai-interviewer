import { Loader2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

type SpinnerProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
  label?: string;
};

export function Spinner({ size = "md", className, label = "Loading" }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn(sizeClasses[size], "animate-spin text-indigo-300", className)}
    />
  );
}
