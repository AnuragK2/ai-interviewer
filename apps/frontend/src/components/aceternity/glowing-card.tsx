import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/utils";

type GlowingCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function GlowingCard({ children, className, delay = 0 }: GlowingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative rounded-2xl p-[1px]", className)}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-slate-500/10 to-blue-500/20 opacity-60 blur-sm transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative space-y-6 rounded-2xl border border-white/10 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-8 [&_[data-slot=card-content]]:px-0 [&_[data-slot=card-footer]]:px-0 [&_[data-slot=card-header]]:px-0">
        {children}
      </div>
    </motion.div>
  );
}
