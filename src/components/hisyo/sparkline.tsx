import { cn } from "@/lib/cn";

export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const w = 72;
  const h = 18;
  if (values.length < 2) return null;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - Math.max(0, Math.min(1, v)) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = values[values.length - 1] ?? 0;
  const lx = w;
  const ly = h - Math.max(0, Math.min(1, last)) * (h - 2) - 1;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-4 w-16", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <circle className="spark-tip" cx={lx} cy={ly} r="1.7" />
    </svg>
  );
}
