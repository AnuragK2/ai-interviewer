import type { ApplicationStatus, ApplicationStatusCount } from "@ai-interviewer/api-types";
import { getApplicationPipelineLabel } from "@/features/applications/lib/application-status-labels";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SUBMITTED: "var(--chart-1)",
  ANALYZING: "var(--chart-2)",
  ANALYZED: "var(--chart-3)",
  INTERVIEW_INVITED: "var(--chart-4)",
  INTERVIEW_PENDING: "var(--chart-5)",
  INTERVIEW_IN_PROGRESS: "oklch(0.72 0.12 200)",
  INTERVIEW_COMPLETED: "oklch(0.7 0.14 150)",
  INTERVIEW_CANCELLED: "oklch(0.62 0.18 25)",
  SELECTED: "oklch(0.72 0.16 145)",
};

type ApplicationStatusPieChartProps = {
  data: ApplicationStatusCount[];
};

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

export function ApplicationStatusPieChart({ data }: ApplicationStatusPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No applications yet.</p>;
  }

  const cx = 100;
  const cy = 100;
  const outerRadius = 88;
  const innerRadius = 52;
  let currentAngle = 0;

  const slices = data.map((item) => {
    const sliceAngle = (item.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
    const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
    const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const path = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
      "Z",
    ].join(" ");

    return {
      ...item,
      path,
      color: STATUS_COLORS[item.status],
      label: getApplicationPipelineLabel(item.status),
      percentage: Math.round((item.count / total) * 100),
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <div className="relative shrink-0">
        <svg viewBox="0 0 200 200" className="h-52 w-52" role="img" aria-label="Applications by status">
          {slices.map((slice) => (
            <path key={slice.status} d={slice.path} fill={slice.color} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-semibold">{total}</p>
          <p className="text-xs text-muted-foreground">Applications</p>
        </div>
      </div>

      <ul className="grid w-full flex-1 gap-2 sm:grid-cols-2">
        {slices.map((slice) => (
          <li
            key={slice.status}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate text-sm">{slice.label}</span>
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{slice.count}</span>
              <span className="ml-1">({slice.percentage}%)</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
