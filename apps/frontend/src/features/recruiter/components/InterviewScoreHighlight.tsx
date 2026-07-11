import { cn } from "@/shared/lib/utils";

type InterviewScoreHighlightProps = {
  score: number;
  label?: string;
  className?: string;
};

function scoreTone(score: number) {
  if (score >= 80) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (score >= 60) return "border-indigo-500/30 bg-indigo-500/10 text-indigo-100";
  if (score >= 40) return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-red-500/30 bg-red-500/10 text-red-200";
}

export function InterviewScoreHighlight({
  score,
  label = "Interview score",
  className,
}: InterviewScoreHighlightProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border px-6 py-5 text-center",
        scoreTone(score),
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-current/70">{label}</p>
      <p className="mt-2 text-5xl font-semibold tracking-tight">{score}</p>
      <p className="mt-1 text-sm text-current/70">out of 100</p>
    </div>
  );
}
