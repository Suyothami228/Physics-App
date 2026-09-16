import type { ReactNode } from "react";
import "../styles/dimensions.css";
const scenes: Record<string, string[]> = {
  "dim-meaning": ["ruler", "powers", "ratio"],
  "dim-rules": ["combine", "balance", "wave"],
  "dim-limits": ["twins", "coefficient"],
};
export function DimensionArt({
  blockKey,
  index,
}: {
  blockKey: string;
  index: number;
}) {
  const scene = scenes[blockKey]?.[index];
  let art: ReactNode;
  switch (scene) {
    case "ruler":
      art = (
        <>
          <path d="M30 50h180M30 85h180" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${30 + i * 30} 50v12M${30 + i * 30} 85v8`} />
          ))}
          <text x="26" y="31">
            m
          </text>
          <text x="26" y="111">
            cm
          </text>
          <g className="art-breathe">
            <rect x="96" y="21" width="50" height="29" rx="8" fill="#e3eccf" />
            <text x="114" y="43">
              L
            </text>
          </g>
        </>
      );
      break;
    case "powers":
      art = (
        <>
          <text x="34" y="35">
            L / T²
          </text>
          <path
            d="M45 50v29h85m-6-6 6 6-6 6"
            className="art-draw"
            pathLength="1"
          />
          <rect x="145" y="50" width="75" height="47" rx="12" fill="#dfe8fa" />
          <text x="158" y="81">
            LT⁻²
          </text>
        </>
      );
      break;
    case "ratio":
      art = (
        <>
          <path d="M28 32h140M28 58h70" strokeWidth="9" stroke="#8da66a" />
          <text x="179" y="40">
            L
          </text>
          <text x="113" y="65">
            L
          </text>
          <g className="art-glow">
            <path d="M81 91h65" />
            <text x="156" y="98">
              = 1
            </text>
          </g>
        </>
      );
      break;
    case "combine":
      art = (
        <>
          <rect x="13" y="24" width="78" height="52" rx="12" fill="#e0e8fc" />
          <text x="20" y="56">
            MLT⁻²
          </text>
          <text x="105" y="56">
            ×
          </text>
          <rect x="139" y="24" width="36" height="52" rx="12" fill="#dfebbc" />
          <text x="150" y="56">
            L
          </text>
          <path d="M38 89h149" className="art-current" strokeDasharray="4 10" />
          <text x="74" y="111">
            ML²T⁻²
          </text>
        </>
      );
      break;
    case "balance":
      art = (
        <>
          <path d="M120 58v44m-25 0h50" />
          <g className="dim-sweep">
            <path
              d="M40 58h160M50 58l-22 28h44ZM190 58l-22 28h44Z"
              fill="#e5eccf"
            />
            <text x="43" y="45">
              L
            </text>
            <text x="182" y="45">
              L
            </text>
          </g>
        </>
      );
      break;
    case "wave":
      art = (
        <>
          <path d="M18 61h206" stroke="#b5c4dd" />
          <path
            d="M20 60q20-62 40 0t40 0t40 0t40 0t40 0"
            className="art-draw"
            pathLength="1"
            strokeWidth="3"
          />
          <text x="80" y="107">
            ωt → 1
          </text>
        </>
      );
      break;
    case "twins":
      art = (
        <>
          <path d="M25 70h62m-8-7 8 7-8 7" />
          <circle cx="46" cy="38" r="16" fill="#dce6fa" />
          <path
            d="M145 58a30 30 0 1 1 48 20m-2-12 2 12 12-2"
            className="art-draw"
            pathLength="1"
          />
          <text x="30" y="110">
            ML²T⁻² = ML²T⁻²
          </text>
        </>
      );
      break;
    case "coefficient":
      art = (
        <>
          <text x="30" y="35">
            mv²
          </text>
          <text x="139" y="35">
            ½mv²
          </text>
          <path d="M62 47v30m108-30v30" />
          <rect
            x="46"
            y="81"
            width="149"
            height="29"
            rx="10"
            fill="#e0edc2"
            className="art-breathe"
          />
          <text x="71" y="103">
            ML²T⁻²
          </text>
        </>
      );
      break;
    default:
      return null;
  }
  return (
    <svg
      className="concept-art dimension-art"
      data-scene={`dim-${scene}`}
      viewBox="0 0 240 116"
      fill="none"
      stroke="#6d82bd"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
}
