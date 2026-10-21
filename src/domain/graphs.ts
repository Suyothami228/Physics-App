export type Point = [number, number];
export const linePresets = [
  [Math.sqrt(3), 0, "y = √3 x"],
  [1, 0, "y = x"],
  [1 / Math.sqrt(3), 0, "y = x/√3"],
  [2, 3, "y = 2x + 3"],
  [3, -4, "y = 3x − 4"],
  [-2, 7, "y = −2x + 7"],
  [-2, -3, "y = −2x − 3"],
] as const;
export function motionAt(u: number, a: number, t: number) {
  const s = (q: number) => u * q + 0.5 * a * q * q;
  const turn = a === 0 ? Infinity : -u / a;
  const displacement = s(t);
  const distance =
    turn > 0 && turn < t
      ? Math.abs(s(turn)) + Math.abs(s(t) - s(turn))
      : Math.abs(displacement);
  return { velocity: u + a * t, displacement, distance, turn };
}
export type TransformFamily = "inverse" | "direct" | "cube" | "quartic";
export type TransformMode = "raw" | "linear" | "log" | "constant";
export function transformSample(
  family: TransformFamily,
  mode: TransformMode,
  q: number,
  k: number,
): Point {
  const n =
    family === "inverse"
      ? -1
      : family === "direct"
        ? 1
        : family === "cube"
          ? 3
          : 4;
  const v = k * q ** n;
  if (mode === "log") return [Math.log10(q), Math.log10(v)];
  if (mode === "constant") return [q, v / q ** n];
  if (mode === "linear") return [family === "direct" ? 1 / q : q ** n, v];
  return [q, v];
}
export function transformation(
  f: TransformFamily,
  m: TransformMode,
  k: number,
) {
  const logK = Math.log10(k).toFixed(2);
  const axes =
    f === "inverse" ? ["V", "P"] : f === "direct" ? ["T", "V"] : ["x", "y"];
  const n = f === "inverse" ? -1 : f === "direct" ? 1 : f === "cube" ? 3 : 4;
  if (m === "log")
    return {
      x: `log₁₀ ${axes[0]}`,
      y: `log₁₀ ${axes[1]}`,
      formula: `log₁₀ ${axes[1]} = ${n} log₁₀ ${axes[0]} + ${logK}`,
      slope: n,
    };
  if (m === "constant")
    return {
      x: axes[0],
      y:
        f === "inverse"
          ? "PV"
          : f === "direct"
            ? "V/T"
            : `y/x${n === 3 ? "³" : "⁴"}`,
      formula: `${f === "inverse" ? "PV" : f === "direct" ? "V/T" : n === 3 ? "y/x³" : "y/x⁴"} = ${k}`,
      slope: 0,
    };
  if (m === "linear")
    return {
      x:
        f === "inverse"
          ? "1/V"
          : f === "direct"
            ? "1/T"
            : n === 3
              ? "x³"
              : "x⁴",
      y: axes[1],
      formula:
        f === "direct"
          ? `V = ${k} / (1/T)`
          : `${axes[1]} = ${k} × (${f === "inverse" ? "1/V" : n === 3 ? "x³" : "x⁴"})`,
      slope: f === "direct" ? null : k,
    };
  return {
    x: axes[0],
    y: axes[1],
    formula:
      f === "inverse"
        ? `PV = ${k}`
        : f === "direct"
          ? `V = ${k} T`
          : `y = ${k} x${n === 3 ? "³" : "⁴"}`,
    slope: f === "direct" ? k : null,
  };
}
