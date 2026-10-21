import { useId, type ReactNode } from "react";
import type { Point } from "../domain/graphs";
export const plotBox = { left: 72, top: 32, width: 520, height: 350 };
function ticks(min: number, max: number) {
  const rough = (max - min) / 6,
    base = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((n) => n * base >= rough) ?? 10) * base;
  const start = Math.ceil(min / step) * step;
  return Array.from({ length: Math.floor((max - start) / step) + 1 }, (_, i) =>
    Number((start + i * step).toPrecision(5)),
  );
}
export function coordinates(bounds: [number, number, number, number]) {
  const [xmin, xmax, ymin, ymax] = bounds;
  return {
    x: (v: number) => 72 + ((v - xmin) / (xmax - xmin)) * 520,
    y: (v: number) => 382 - ((v - ymin) / (ymax - ymin)) * 350,
  };
}
export function GraphPlot({
  bounds,
  curves,
  xLabel = "x",
  yLabel = "y",
  label,
  children,
}: {
  bounds: [number, number, number, number];
  curves: { points: Point[]; color: string; dashed?: boolean }[];
  xLabel?: string;
  yLabel?: string;
  label: string;
  children?: ReactNode;
}) {
  const id = useId();
  const c = coordinates(bounds);
  const [xmin, xmax, ymin, ymax] = bounds;
  const axisX = c.x(Math.max(xmin, Math.min(xmax, 0))),
    axisY = c.y(Math.max(ymin, Math.min(ymax, 0)));
  return (
    <svg
      className="math-plot"
      viewBox="0 0 660 445"
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={id}>
          <rect x="72" y="32" width="520" height="350" />
        </clipPath>
      </defs>
      {ticks(xmin, xmax).map((x) => (
        <g key={`x${x}`}>
          <path className="math-grid" d={`M${c.x(x)} 32V382`} />
          <text x={c.x(x)} y="408" textAnchor="middle">
            {x}
          </text>
        </g>
      ))}
      {ticks(ymin, ymax).map((y) => (
        <g key={`y${y}`}>
          <path className="math-grid" d={`M72 ${c.y(y)}H592`} />
          <text x="61" y={c.y(y) + 5} textAnchor="end">
            {y}
          </text>
        </g>
      ))}
      <path
        className="math-axis"
        d={`M72 ${axisY}H603l-7 -4m7 4l-7 4M${axisX} 382V22l-4 7m4 -7l4 7`}
      />
      <text x="615" y="431" textAnchor="end" className="math-axis-label">
        {xLabel}
      </text>
      <text x="72" y="19" className="math-axis-label">
        {yLabel}
      </text>
      <g clipPath={`url(#${id})`}>
        {curves.map((v, i) => (
          <polyline
            key={i}
            points={v.points
              .filter((p) => p.every(Number.isFinite))
              .map((p) => `${c.x(p[0])},${c.y(p[1])}`)
              .join(" ")}
            fill="none"
            stroke={v.color}
            strokeWidth="3.2"
            strokeDasharray={v.dashed ? "7 6" : undefined}
            strokeLinejoin="round"
          />
        ))}
        {children}
      </g>
    </svg>
  );
}
export function sample(
  fn: (x: number) => number,
  min: number,
  max: number,
  count = 160,
): Point[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const x = min + ((max - min) * i) / count;
    return [x, fn(x)];
  });
}
