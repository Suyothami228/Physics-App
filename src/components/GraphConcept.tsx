import { useState } from "react";
import { useApp } from "../state";
import { GraphPlot, sample } from "./GraphPlot";
import "../styles/graphs.css";
export function GraphConcept({ concept }: { concept: string }) {
  const { T } = useApp();
  const [v, setV] = useState(1);
  const mode =
    concept === "graph-origin"
      ? "slope"
      : concept === "graph-intercept"
        ? "intercept"
        : concept === "graph-parallel"
          ? "parallel"
          : concept === "graph-inverse"
            ? "inverse"
            : concept === "graph-powers"
              ? "powers"
              : concept === "graph-vt"
                ? "motion"
                : null;
  if (!mode) return null;
  const fn = (x: number) =>
    mode === "inverse"
      ? v / x
      : mode === "powers"
        ? v * x * x
        : mode === "intercept"
          ? x + v
          : mode === "motion"
            ? 4 - v * x
            : v * x;
  const bounds: [number, number, number, number] =
    mode === "inverse"
      ? [0, 6, 0, 8]
      : mode === "motion"
        ? [0, 8, -8, 8]
        : [-5, 5, -8, 8];
  const curves = [
    {
      points: sample(fn, mode === "inverse" ? 0.15 : bounds[0], bounds[1]),
      color: "#58c4dd",
    },
    ...(mode === "parallel"
      ? [{ points: sample((x) => v * x + 3, -5, 5), color: "#ff8080" }]
      : []),
  ];
  return (
    <div className="graph-preview">
      <GraphPlot
        bounds={bounds}
        curves={curves}
        label={T("Interactive concept graph", "ஊடாடும் கருத்து வரைபு")}
        xLabel={mode === "motion" ? "t (s)" : "x"}
        yLabel={mode === "motion" ? "v (m/s)" : "y"}
      />
      <label>
        {mode === "intercept"
          ? T("Move the intercept c", "வெட்டுத்துண்டு c ஐ மாற்றுக")
          : mode === "slope" || mode === "parallel"
            ? T("Change gradient m", "படித்திறன் m ஐ மாற்றுக")
            : T("Change the coefficient", "குணகத்தை மாற்றுக")}{" "}
        = {v.toFixed(1)}
        <input
          type="range"
          min={mode === "inverse" || mode === "powers" ? 0.5 : -3}
          max={3}
          step={0.1}
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
