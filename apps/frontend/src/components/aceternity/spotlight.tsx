import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/shared/lib/utils";

export function Spotlight({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--spot-x", `${x}px`);
      el.style.setProperty("--spot-y", `${y}px`);
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={
        {
          "--spot-x": "50%",
          "--spot-y": "20%",
        } as CSSProperties
      }
    >
      <div
        className="absolute h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl transition-opacity duration-500"
        style={{
          left: "var(--spot-x)",
          top: "var(--spot-y)",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(59,130,246,0.08) 35%, transparent 70%)",
        }}
      />
    </div>
  );
}
