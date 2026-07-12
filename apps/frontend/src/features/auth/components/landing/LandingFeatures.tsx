import type { ReactNode } from "react";
import { InViewFade } from "@/components/aceternity/in-view-fade";
import { cn } from "@/shared/lib/utils";
import { LANDING_FEATURES } from "./landing-data";

function FeatureCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "group relative h-full rounded-2xl border border-white/10 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-xl transition-colors hover:border-indigo-500/25",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <InViewFade className="mb-12 text-center">
          <p className="text-xs font-medium tracking-[0.25em] text-indigo-300 uppercase">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to hire smarter
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Purpose-built for technical hiring — from first application to final decision, with AI at every step.
          </p>
        </InViewFade>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_FEATURES.map((feature, index) => (
            <InViewFade key={feature.title} delay={index * 0.06}>
              <FeatureCard>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </FeatureCard>
            </InViewFade>
          ))}
        </div>
      </div>
    </section>
  );
}
