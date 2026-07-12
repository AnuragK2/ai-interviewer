import { InViewFade } from "@/components/aceternity/in-view-fade";
import { LANDING_STEPS } from "./landing-data";

const AUDIENCE_STYLES = {
  candidate: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  recruiter: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  both: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
} as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <InViewFade className="mb-14 text-center">
          <p className="text-xs font-medium tracking-[0.25em] text-indigo-300 uppercase">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            From profile to hiring decision
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            A clear pipeline for candidates and recruiters — with AI analysis at the moments that matter most.
          </p>
        </InViewFade>

        <div className="relative">
          <div className="absolute top-8 bottom-8 left-5 hidden w-px bg-gradient-to-b from-indigo-500/50 via-indigo-500/20 to-transparent sm:block" />

          <div className="space-y-8">
            {LANDING_STEPS.map((step, index) => (
              <InViewFade key={step.step} delay={index * 0.08}>
                <div className="relative flex gap-6 sm:gap-8">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-500/40 bg-background text-sm font-semibold text-indigo-300 shadow-lg shadow-indigo-950/30">
                    {step.step}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-card/40 p-5 backdrop-blur-sm sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${AUDIENCE_STYLES[step.audience]}`}
                      >
                        {step.audience === "both" ? "Everyone" : step.audience}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </InViewFade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
