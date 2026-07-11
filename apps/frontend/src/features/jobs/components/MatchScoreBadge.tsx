type MatchScoreBadgeProps = {
  score: number;
  className?: string;
};

function scoreTone(score: number) {
  if (score >= 80) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (score >= 60) return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
  if (score >= 40) return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-border bg-muted/20 text-muted-foreground";
}

export function MatchScoreBadge({ score, className = "" }: MatchScoreBadgeProps) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${scoreTone(score)} ${className}`}>
      {score}% match
    </span>
  );
}
