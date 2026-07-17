import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Mic,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { InViewFade } from "@/components/aceternity/in-view-fade";
import { PRODUCT_DEMO_STEPS } from "./landing-data";

const STEP_DURATION_MS = 3_500;

function ProfileMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Alex Morgan</p>
          <p className="text-xs text-muted-foreground">Senior Frontend Engineer</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["React", "TypeScript", "Node.js", "System Design"].map((skill) => (
          <span key={skill} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-indigo-200/90">
            {skill}
          </span>
        ))}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-muted-foreground">Profile completeness</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400"
            initial={{ width: 0 }}
            animate={{ width: "92%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

function ApplyMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Staff Engineer — Platform</p>
            <p className="text-xs text-muted-foreground">Remote · Full-time</p>
          </div>
          <Briefcase className="h-4 w-4 shrink-0 text-indigo-300" />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Build scalable hiring infrastructure with a product-focused engineering team.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
      >
        <span className="text-xs text-emerald-200">Application submitted</span>
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      </motion.div>
    </div>
  );
}

function FitMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Fit analysis</p>
        <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-sm font-semibold text-indigo-200">87</span>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Strengths</p>
        {["Strong React & TypeScript depth", "Platform engineering experience", "Clear communication style"].map(
          (item) => (
            <div key={item} className="flex items-start gap-2 text-xs text-foreground/90">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" />
              {item}
            </div>
          ),
        )}
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-100/80">
        Gap: limited recent Kubernetes exposure
      </div>
    </div>
  );
}

function InterviewMock() {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-slate-900/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5">
            <User className="h-7 w-7 text-white/70" />
          </div>
        </div>
        <motion.div
          className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-medium text-white"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          REC
        </motion.div>
      </div>
      <div className="flex flex-col justify-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <Mic className="h-4 w-4 text-indigo-300" />
          <span className="text-xs">AI interviewer speaking…</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <Video className="h-4 w-4 text-emerald-300" />
          <span className="text-xs">Proctoring active</span>
        </div>
      </div>
    </div>
  );
}

function ReviewMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Fit", value: "87" },
          { label: "Interview", value: "82" },
          { label: "Recommend", value: "Yes" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{metric.label}</p>
            <p className="text-lg font-semibold text-indigo-200">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Strong technical depth and clear reasoning on system design. Recommend moving to final round.
        </p>
      </div>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white"
      >
        Select candidate
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const MOCK_COMPONENTS = {
  profile: ProfileMock,
  apply: ApplyMock,
  fit: FitMock,
  interview: InterviewMock,
  review: ReviewMock,
} as const;

export function LandingProductDemo() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % PRODUCT_DEMO_STEPS.length);
    }, STEP_DURATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  const activeStep = PRODUCT_DEMO_STEPS[activeIndex] ?? PRODUCT_DEMO_STEPS[0]!;
  const MockComponent = MOCK_COMPONENTS[activeStep.id];

  return (
    <section id="product" className="scroll-mt-28">
      <InViewFade className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium tracking-[0.25em] text-indigo-300 uppercase">See it in action</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One platform, end to end
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            From profile to proctored interview to hiring decision — watch how GetHired connects candidates and recruiters.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/50 p-1 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5" />

          <div className="relative grid gap-0 lg:grid-cols-[220px_1fr]">
            <div className="border-b border-white/10 p-4 lg:border-r lg:border-b-0">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Workflow</p>
              <div className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col">
                {PRODUCT_DEMO_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      index === activeIndex
                        ? "bg-indigo-500/20 text-indigo-100"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        index === activeIndex ? "bg-indigo-500 text-white" : "bg-white/10"
                      }`}
                    >
                      {index + 1}
                    </span>
                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[280px] p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{activeStep.title}</h3>
                    <p className="text-sm text-muted-foreground">{activeStep.subtitle}</p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/60">
                    <MockComponent />
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 flex gap-1.5">
                {PRODUCT_DEMO_STEPS.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"
                  >
                    <motion.div
                      className="h-full bg-indigo-500"
                      initial={{ width: "0%" }}
                      animate={{
                        width: index < activeIndex ? "100%" : index === activeIndex ? "100%" : "0%",
                      }}
                      transition={{
                        duration: index === activeIndex ? STEP_DURATION_MS / 1000 : 0.2,
                        ease: "linear",
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </InViewFade>
    </section>
  );
}
