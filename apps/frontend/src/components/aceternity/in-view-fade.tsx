import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/utils";

type InViewFadeProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
};

export function InViewFade({ children, className, delay = 0, direction = "up" }: InViewFadeProps) {
  const offset = direction === "up" ? 28 : direction === "down" ? -28 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
