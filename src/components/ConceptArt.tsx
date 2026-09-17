import { TravellingArt } from "./TravellingArt";
import { SpherometerArt } from "./SpherometerArt";
import type { ReactNode } from "react";
import { MicrometerArt } from "./MicrometerArt";
import { QuantityArt } from "./QuantityArt";
import { DimensionArt } from "./DimensionArt";
import { UncertaintyArt } from "./UncertaintyArt";
import "../styles/concept-art.css";

// Stable content keys keep artwork independent of translated card headings.
const scenes: Record<string, string[]> = {
  "intro-scope": ["matter", "energy", "evidence"],
  "intro-approaches": ["gravity", "gas"],
  "intro-applications": ["communication", "materials", "microscope", "earth"],
  "intro-branches": ["classical", "quantum"],
};

export function ConceptArt({
  blockKey,
  index,
}: {
  blockKey: string;
  index: number;
}) {
  if (blockKey.startsWith("travelling-"))
    return <TravellingArt blockKey={blockKey} index={index} />;
  if (blockKey.startsWith("spherometer-"))
    return <SpherometerArt blockKey={blockKey} index={index} />;
  if (blockKey.startsWith("micrometer-"))
    return <MicrometerArt blockKey={blockKey} index={index} />;
  if (blockKey.startsWith("unc-"))
    return <UncertaintyArt blockKey={blockKey} index={index} />;
  if (blockKey.startsWith("dim-"))
    return <DimensionArt blockKey={blockKey} index={index} />;
  if (blockKey.startsWith("qty-"))
    return <QuantityArt blockKey={blockKey} index={index} />;
  const scene = scenes[blockKey]?.[index];
  let drawing: ReactNode;
  switch (scene) {
    case "matter":
      drawing = (
        <>
          <path d="M31 86 55 39 100 29 123 75 79 95Z" fill="#e2e8ff" />
          {[
            [31, 86],
            [55, 39],
            [100, 29],
            [123, 75],
            [79, 95],
          ].map(([x, y], i) => (
            <circle
              key={i}
              className="art-vibrate"
              style={{ animationDelay: `-${i * 0.4}s` }}
              cx={x}
              cy={y}
              r="9"
              fill="#6279d9"
            />
          ))}
          <path d="M141 58h25m-6-5 6 5-6 5" />
          <g className="art-breathe">
            <circle cx="195" cy="57" r="27" fill="#d9e6fb" stroke="none" />
            <circle cx="195" cy="57" r="15" fill="#8197e6" stroke="none" />
            <circle cx="195" cy="57" r="5" fill="#526bd4" />
          </g>
        </>
      );
      break;
    case "energy":
      drawing = (
        <>
          <path d="M59 66v27h128V65M59 46V24h128v15" />
          <path d="M46 48h26m-21 12h16" strokeWidth="4" />
          <circle cx="187" cy="53" r="17" fill="#f0df8d" className="art-glow" />
          <path d="m178 70 3 10h12l3-10m-18-21 9 14 9-14" />
          <g className="art-glow" stroke="#b68c2e">
            <path d="M187 23v-9m-28 39h-9m65 0h9m-17-22 7-7m-56 7-7-7" />
          </g>
          <path
            className="art-current"
            d="M59 30h110"
            stroke="#6a9c42"
            strokeWidth="4"
            strokeDasharray="3 20"
          />
        </>
      );
      break;
    case "evidence":
      drawing = (
        <>
          <path d="M35 16v82h176" stroke="#aab9db" />
          <path
            d="M44 87Q118 62 203 24"
            className="art-draw"
            pathLength="1"
            strokeWidth="3"
          />
          {[
            [56, 81],
            [90, 74],
            [125, 51],
            [158, 47],
            [192, 26],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#86ad51"
              className="art-breathe"
              style={{ animationDelay: `-${i * 0.6}s` }}
            />
          ))}
        </>
      );
      break;
    case "gravity":
      drawing = (
        <>
          <path d="M21 97h50M46 28v57m-5-6 5 6 5-6" stroke="#a7b6d9" />
          <circle cx="46" cy="31" r="7" fill="#b5cf72" className="art-fall" />
          <circle cx="162" cy="58" r="43" strokeDasharray="3 5" />
          <circle cx="162" cy="58" r="21" fill="#6583dd" />
          <path
            d="m146 51 14-9 10 13-6 16-15-6Z"
            fill="#bdd98a"
            stroke="none"
          />
          <g className="art-orbit">
            <circle cx="205" cy="58" r="6" fill="#97a7c9" />
          </g>
        </>
      );
      break;
    case "gas":
      drawing = (
        <>
          <rect x="24" y="25" width="52" height="69" rx="8" fill="#e3eef6" />
          <path d="M36 25V15h28v10M76 38l48-19M76 81l48 19" stroke="#9eafd1" />
          <rect x="122" y="13" width="98" height="90" rx="13" fill="#e4f0ec" />
          {[
            [140, 31],
            [181, 34],
            [199, 68],
            [148, 78],
            [173, 57],
          ].map(([x, y], i) => (
            <circle
              key={i}
              className={i % 2 ? "art-particle-b" : "art-particle-a"}
              style={{ animationDelay: `-${i * 0.7}s` }}
              cx={x}
              cy={y}
              r="5"
              fill="#5b9c8d"
            />
          ))}
        </>
      );
      break;
    case "communication":
      drawing = (
        <>
          <path d="m30 96 15-56 15 56M34 82h22M37 68h16M45 40V23" />
          <circle cx="45" cy="24" r="4" fill="#657dd5" />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${66 + i * 25} ${23 - i * 3}q${18 + i * 5} 29 0 ${57 + i * 6}`}
              className="art-wave"
              style={{ animationDelay: `${i * 0.55}s` }}
              stroke="#759ec6"
            />
          ))}
          <rect x="179" y="28" width="33" height="64" rx="6" fill="#e1e9ff" />
          <path d="M190 84h10M185 39h21" />
        </>
      );
      break;
    case "materials":
      drawing = (
        <>
          <path
            d="M50 31h140M50 82h140M50 31v51m47-51v51m46-51v51m47-51v51M50 31l47 51 46-51 47 51"
            stroke="#a3afd3"
          />
          {[50, 97, 143, 190].flatMap((x) =>
            [31, 82].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#8293d9" />
            )),
          )}
          <path
            d="M34 57h173"
            className="art-current"
            stroke="#669f79"
            strokeWidth="5"
            strokeDasharray="2 27"
          />
        </>
      );
      break;
    case "microscope":
      drawing = (
        <>
          <path
            d="M61 23h39v12H61zM76 35v19h12V35M95 41q46 4 30 45M62 72h56M92 76v20m-34 3h82"
            strokeWidth="5"
          />
          <path
            d="m80 53-14 17h30Z"
            fill="#d1e7a6"
            stroke="none"
            className="art-glow"
          />
          <path d="m125 66 23-8" strokeDasharray="3 3" />
          <circle cx="183" cy="54" r="32" fill="#e5eee9" />
          <g className="art-specimen" fill="#b1cd93">
            <ellipse cx="173" cy="44" rx="8" ry="5" />
            <ellipse cx="193" cy="57" rx="6" ry="10" />
            <ellipse cx="173" cy="68" rx="8" ry="5" />
          </g>
        </>
      );
      break;
    case "earth":
      drawing = (
        <>
          <path d="M34 56a48 48 0 0 1 96 0Z" fill="#739cd2" />
          <path
            d="m49 32 17-12 14 7-4 17-17 1m37-17 18 12-2 12-13-7"
            fill="#bbd396"
            stroke="none"
          />
          <path d="M34 56a48 48 0 0 0 96 0Z" fill="#e0b68a" />
          <path d="M53 56a29 29 0 0 0 58 0Z" fill="#efd27c" />
          <path d="M70 56a12 12 0 0 0 24 0Z" fill="#dba16f" />
          <path d="M148 21v73h77" stroke="#b2bed7" />
          <path
            className="art-draw"
            pathLength="1"
            d="m153 58 9 0 5-10 6 28 7-44 8 57 7-42 6 15h19"
            strokeWidth="2"
          />
        </>
      );
      break;
    case "classical":
      drawing = (
        <>
          <path d="M30 90h184M34 32v58" stroke="#a3b1ce" />
          <g className="art-spring">
            <path d="m34 61 10 0 6-14 12 28 12-28 12 28 12-28 6 14h12" />
            <rect x="116" y="43" width="36" height="36" rx="6" fill="#8297dd" />
            <circle cx="124" cy="85" r="4" fill="#5067ac" />
            <circle cx="145" cy="85" r="4" fill="#5067ac" />
          </g>
          <path d="M165 28h37m-5-5 5 5-5 5" stroke="#84a15d" />
        </>
      );
      break;
    case "quantum":
      drawing = (
        <>
          <path d="M38 91h87M38 52h87M38 24h87" strokeWidth="3" />
          <path
            d="M83 33v48m-5-5 5 5 5-5"
            stroke="#a4b5d7"
            strokeDasharray="3 4"
          />
          <circle
            cx="65"
            cy="24"
            r="6"
            fill="#7188db"
            className="art-transition"
          />
          <path
            d="M144 69q5-14 10 0t10 0t10 0t10 0t10 0t10 0"
            stroke="#b79546"
            className="art-photon"
          />
        </>
      );
      break;
    default:
      return null;
  }
  return (
    <svg
      className="concept-art"
      data-scene={scene}
      viewBox="0 0 240 116"
      aria-hidden="true"
      fill="none"
      stroke="#637ac0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawing}
    </svg>
  );
}
