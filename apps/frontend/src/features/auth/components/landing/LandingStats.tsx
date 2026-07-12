import { InViewFade } from "@/components/aceternity/in-view-fade";
import { LANDING_STATS } from "./landing-data";

export function LandingStats() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] py-10">
      <InViewFade>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 sm:grid-cols-4 sm:px-8">
          {LANDING_STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-sm font-semibold text-indigo-200">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </InViewFade>
    </section>
  );
}
