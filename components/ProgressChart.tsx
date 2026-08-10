import type { ProgressPoint } from "@/lib/study-pages";
import { formatDisplayDate } from "@/lib/hebrew-date";

const WIDTH = 320;
const HEIGHT = 110;
const PAD = 8;

export function ProgressChart({
  points,
  dateDisplay,
}: {
  points: ProgressPoint[];
  dateDisplay: "hebrew" | "both";
}) {
  if (points.length < 2) {
    return <p className="text-ink/50 text-sm py-6 text-center">עדיין אין מספיק נתונים להצגת גרף התקדמות.</p>;
  }

  const innerW = WIDTH - PAD * 2;
  const innerH = HEIGHT - PAD * 2;
  const step = innerW / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: PAD + i * step,
    y: PAD + innerH - (p.percent / 100) * innerH,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${HEIGHT - PAD} L${coords[0].x.toFixed(1)},${HEIGHT - PAD} Z`;

  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="progress-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#progress-fill)" />
        <path d={linePath} fill="none" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 4 : 2.5}
            fill={i === coords.length - 1 ? "var(--color-gold)" : "var(--color-navy)"}
          />
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2 text-xs text-ink/50">
        <span>{formatDisplayDate(points[0].date, dateDisplay)}</span>
        <span className="font-semibold text-navy">{last.percent}% היום</span>
        <span>{formatDisplayDate(last.date, dateDisplay)}</span>
      </div>
    </div>
  );
}
