import type { ReactNode } from "react";
import "../styles/uncertainty.css";
const scenes: Record<string, string[]> = {
  "unc-meaning": ["interval", "accuracy", "precision"],
  "unc-sources": ["zero", "scatter", "parallax"],
  "unc-reporting": ["percent", "scale"],
};
export function UncertaintyArt({
  blockKey,
  index,
}: {
  blockKey: string;
  index: number;
}) {
  const scene = scenes[blockKey]?.[index];
  let art: ReactNode;
  switch (scene) {
    case "interval":
      art = (
        <>
          <path d="M25 82h190" stroke="#b6c6df" />
          <rect
            x="78"
            y="28"
            width="85"
            height="65"
            rx="10"
            fill="#e6eecf"
            className="art-breathe"
          />
          <path d="M120 19v80M80 53h80m-80-8v16m80-16v16" />
          <text x="99" y="112">
            x ± u
          </text>
        </>
      );
      break;
    case "accuracy":
      art = (
        <>
          <circle cx="125" cy="58" r="43" fill="#edf2dc" />
          <circle cx="125" cy="58" r="24" />
          <circle cx="125" cy="58" r="4" fill="#99b452" />
          <path d="M35 57h56m-7-6 7 6-7 6" />
          <circle cx="103" cy="52" r="6" fill="#5b76bd" className="unc-shift" />
        </>
      );
      break;
    case "precision":
      art = (
        <>
          <path d="M26 85h186" />
          <rect x="126" y="19" width="55" height="71" rx="12" fill="#e0e9ff" />
          {[
            [140, 36],
            [153, 40],
            [161, 52],
            [142, 59],
            [154, 66],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="5"
              fill="#677fc4"
              className="art-breathe"
              style={{ animationDelay: `-${i * 0.5}s` }}
            />
          ))}
          <text x="36" y="50">
            ↔
          </text>
        </>
      );
      break;
    case "zero":
      art = (
        <>
          <rect x="30" y="37" width="85" height="53" rx="10" fill="#e0e8fa" />
          <path d="M41 28h65M72 28v9" />
          <text x="43" y="70">
            +0.2
          </text>
          <path d="M130 60h20" />
          <g className="art-glow">
            <rect x="165" y="37" width="50" height="53" rx="9" fill="#e3edc6" />
            <text x="178" y="70">
              0
            </text>
          </g>
        </>
      );
      break;
    case "scatter":
      art = (
        <>
          <path d="M120 15v90" stroke="#9bb165" />
          {[
            [47, 33],
            [75, 69],
            [104, 46],
            [132, 80],
            [155, 27],
            [181, 55],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="5"
              className="art-vibrate"
              style={{ animationDelay: `-${i * 0.4}s` }}
              fill="#627abb"
            />
          ))}
          <path d="M44 101h150" />
          <text x="101" y="115">
            x̄
          </text>
        </>
      );
      break;
    case "parallax":
      art = (
        <>
          <path d="M29 92h180M100 48v44" />
          {[40, 65, 90, 115, 140, 165, 190].map((x) => (
            <path key={x} d={`M${x} 92v9`} />
          ))}
          <g className="unc-shift">
            <ellipse cx="56" cy="25" rx="17" ry="9" fill="#e2e9ff" />
            <circle cx="56" cy="25" r="4" fill="#5a74bc" />
            <path d="M56 35 100 48 163 91" strokeDasharray="3 4" />
          </g>
        </>
      );
      break;
    case "percent":
      art = (
        <>
          <circle cx="70" cy="55" r="34" fill="#e5edce" />
          <path
            d="M70 21a34 34 0 0 1 34 34"
            stroke="#657dc0"
            strokeWidth="8"
            className="art-glow"
          />
          <text x="129" y="51">
            u / |x|
          </text>
          <text x="131" y="81">
            × 100%
          </text>
        </>
      );
      break;
    case "scale":
      art = (
        <>
          <rect x="40" y="28" width="65" height="17" rx="5" fill="#c4d4ee" />
          <g className="unc-grow">
            <rect x="40" y="67" width="130" height="17" rx="5" fill="#bfd28c" />
            <path d="M170 60v31" stroke="#cd9962" strokeWidth="4" />
          </g>
          <path d="M105 21v31" stroke="#cd9962" strokeWidth="5" />
          <text x="39" y="112">
            u = constant
          </text>
        </>
      );
      break;
    default:
      return null;
  }
  return (
    <svg
      className="concept-art uncertainty-art"
      data-scene={`unc-${scene}`}
      viewBox="0 0 240 116"
      fill="none"
      stroke="#6d81b8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
}
