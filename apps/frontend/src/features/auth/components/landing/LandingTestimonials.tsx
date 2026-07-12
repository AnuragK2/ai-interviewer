import type { ReactNode } from "react";
import { InViewFade } from "@/components/aceternity/in-view-fade";
import { LANDING_TESTIMONIALS } from "./landing-data";

function TestimonialCard({ children }: { children: ReactNode }) {
  return (
    <div className="group relative h-full rounded-2xl border border-white/10 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 opacity-60" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <InViewFade className="mb-12 text-center">
          <p className="text-xs font-medium tracking-[0.25em] text-indigo-300 uppercase">Testimonials</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Trusted by hiring teams & candidates
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Faster screening for recruiters. Clearer feedback for candidates. Better outcomes for everyone.
          </p>
        </InViewFade>

        <div className="grid gap-6 md:grid-cols-3">
          {LANDING_TESTIMONIALS.map((testimonial, index) => (
            <InViewFade key={testimonial.name} delay={index * 0.1}>
              <TestimonialCard>
                <div className="flex h-full flex-col gap-5">
                  <p className="flex-1 text-sm leading-relaxed text-foreground/90">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-semibold text-white">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                        {testimonial.company !== "Candidate" ? ` · ${testimonial.company}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </TestimonialCard>
            </InViewFade>
          ))}
        </div>
      </div>
    </section>
  );
}
