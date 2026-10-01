import { VectorText } from "./VectorText";
import { useApp } from "../state";
export function VectorArt({ concept }: { concept: string }) {
  const { T } = useApp();
  const paths: Record<string, { d: string; result: string; label: string }> = {
    "vector-identity": {
      d: "M80 100H260L245 90M260 100L245 110",
      result: "",
      label: "5 m →",
    },
    "vector-arrows": {
      d: "M80 55H290L275 45M290 55L275 65 M290 115H80L95 105M80 115L95 125",
      result: "",
      label: "A⃗ + (−A⃗) = 0⃗",
    },
    "vector-triangle": {
      d: "M70 140H360L345 130M360 140L345 150M360 140L230 40L235 58M230 40L249 42",
      result: "M70 140L230 40",
      label: "AB⃗ + BC⃗ = AC⃗",
    },
    "vector-polygon": {
      d: "M80 130L160 160L300 130L330 50L200 20L80 50",
      result: "M80 130V50",
      label: "A → B → C → D → E → F",
    },
    "vector-walk": {
      d: "M90 150V35H350L335 25M350 35L335 45",
      result: "M90 150L350 35",
      label: "10 m + 10 m; |R⃗| = 10√2 m",
    },
    "vector-southwest": {
      d: "M210 155V25H300L90 155",
      result: "M210 155H90",
      label: "R⃗ = 40 m ←",
    },
    "vector-components": {
      d: "M80 150H360V40",
      result: "M80 150L360 40",
      label: "Rₓ, Rᵧ → R⃗",
    },
  };
  const p = paths[concept];
  if (!p) return null;
  return (
    <svg
      className="vector-concept"
      viewBox="0 0 660 190"
      role="img"
      aria-label={T("Vector diagram: ", "காவி வரைபு: ") + p.label}
    >
      <path d={p.d} fill="none" stroke="#5774f7" strokeWidth="4" />
      <path
        className="vector-trace"
        d={p.result || p.d}
        fill="none"
        stroke="#0f9b78"
        strokeWidth="4"
        strokeDasharray="8 5"
      />
      <foreignObject x="390" y="75" width="265" height="65"><div style={{fontSize:14}}><VectorText text={p.label} /></div></foreignObject>
    </svg>
  );
}
