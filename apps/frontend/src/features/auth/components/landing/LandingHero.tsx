import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import { FadeIn } from "@/components/aceternity/fade-in";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24">
      <motion.div
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <FadeIn className="mx-auto max-w-4xl text-center">
          <motion.p
            className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-indigo-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            AI hiring platform for modern teams
          </motion.p>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Hire with clarity.
            <span className="mt-2 block bg-gradient-to-r from-indigo-300 via-blue-200 to-violet-300 bg-clip-text text-transparent">
              Interview with confidence.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            GetHired connects candidates and recruiters through rich profiles, AI fit scoring, proctored voice
            interviews, and structured feedback — in one multi-tenant workspace.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 min-w-[180px] bg-indigo-600 hover:bg-indigo-500">
              <Link to="/register">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 min-w-[180px] border-white/10 bg-white/5">
              <a href="#product">
                <Play className="mr-2 h-4 w-4" />
                See how it works
              </a>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mx-auto mt-14 max-w-4xl">
          <div className="relative rounded-2xl border border-white/10 bg-card/40 p-1 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="overflow-hidden rounded-xl border border-white/5 bg-background/80">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-muted-foreground">app.gethired — recruiter dashboard</span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
                {[
                  { label: "Open roles", value: "12", trend: "+2 this week" },
                  { label: "Awaiting review", value: "28", trend: "AI analyzed" },
                  { label: "Interviews done", value: "9", trend: "This month" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.45 }}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-indigo-200">{stat.value}</p>
                    <p className="mt-1 text-xs text-emerald-300/80">{stat.trend}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
