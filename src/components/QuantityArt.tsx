import type { ReactNode } from "react";
const maps: Record<string, string[]> = {
  "qty-meaning": ["measurement", "foundation", "speed"],
  "qty-angles": ["arc", "cone"],
  "qty-notation": ["case", "spacing", "square"],
};
export function QuantityArt({
  blockKey,
  index,
}: {
  blockKey: string;
  index: number;
}) {
  const scene = maps[blockKey]?.[index];
  let art: ReactNode;
  switch (scene) {
    case "measurement":
      art = (
        <>
          <rect x="28" y="70" width="185" height="28" rx="5" fill="#e0e8fa" />
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${35 + i * 11} 70v${i % 5 === 0 ? 19 : 10}`} />
          ))}
          <path d="M35 45h137m-6-5 6 5-6 5m-126-5-6 5 6 5" />
          <g className="art-glow">
            <rect x="66" y="16" width="90" height="38" rx="12" fill="#edf2d8" />
            <text x="82" y="42">
              2.5 m
            </text>
          </g>
        </>
      );
      break;
    case "foundation":
      art = (
        <>
          {["m", "kg", "s", "A", "K", "mol", "cd"].map((s, i) => (
            <g
              key={s}
              className="art-breathe"
              style={{ animationDelay: `-${i * 0.5}s` }}
            >
              <rect
                x={23 + (i % 4) * 51}
                y={i < 4 ? 15 : 65}
                width="43"
                height="36"
                rx="8"
                fill={i % 2 ? "#e0ebca" : "#dce5fa"}
              />
              <text
                x={44 + (i % 4) * 51}
                y={i < 4 ? 39 : 89}
                textAnchor="middle"
              >
                {s}
              </text>
            </g>
          ))}
        </>
      );
      break;
    case "speed":
      art = (
        <>
          <path d="M20 93h201" strokeDasharray="4 5" />
          <g className="qty-car">
            <rect x="35" y="61" width="48" height="21" rx="6" fill="#7b94da" />
            <path d="m46 61 7-15h17l8 15" fill="#dfe6fa" />
            <circle cx="46" cy="85" r="6" fill="#354e89" />
            <circle cx="73" cy="85" r="6" fill="#354e89" />
          </g>
          <text x="128" y="33">
            m / s
          </text>
          <path d="M134 52h58m-7-6 7 6-7 6" />
        </>
      );
      break;
    case "arc":
      art = (
        <>
          <circle cx="100" cy="60" r="42" fill="#edf1ff" stroke="#bac5e4" />
          <path d="M100 60h42a42 42 0 0 0-19-35Z" fill="#d1dfab" />
          <path
            d="M142 60a42 42 0 0 0-19-35"
            className="art-draw"
            pathLength="1"
            strokeWidth="5"
          />
          <text x="157" y="49">
            s / r
          </text>
          <text x="108" y="56">
            θ
          </text>
        </>
      );
      break;
    case "cone":
      art = (
        <>
          <ellipse cx="165" cy="59" rx="28" ry="46" fill="#ebeffc" />
          <path d="m40 59 125-40v80Z" fill="#dce8c0" />
          <ellipse
            cx="165"
            cy="59"
            rx="23"
            ry="40"
            fill="#b9d080"
            className="art-breathe"
          />
          <path d="M40 59h125" strokeDasharray="3 5" />
          <text x="87" y="52">
            r
          </text>
          <text x="157" y="65">
            A
          </text>
        </>
      );
      break;
    case "case":
      art = (
        <>
          <rect x="29" y="24" width="75" height="70" rx="15" fill="#e1e9fc" />
          <rect x="136" y="24" width="75" height="70" rx="15" fill="#e2eacb" />
          <text x="66" y="70" textAnchor="middle" fontSize="36">
            m
          </text>
          <text
            x="173"
            y="70"
            textAnchor="middle"
            fontSize="36"
            className="art-breathe"
          >
            M
          </text>
          <text x="112" y="64">
            ≠
          </text>
        </>
      );
      break;
    case "spacing":
      art = (
        <>
          <text x="42" y="61" fontSize="30">
            5
          </text>
          <rect
            x="71"
            y="27"
            width="24"
            height="49"
            rx="6"
            fill="#d6e6b0"
            strokeDasharray="3 3"
            className="art-glow"
          />
          <text x="101" y="61" fontSize="30">
            mm
          </text>
          <path d="M103 83h61m-61-7v7m61-7v7" />
          <path d="m184 53 9 9 16-22" stroke="#729442" strokeWidth="4" />
        </>
      );
      break;
    case "square":
      art = (
        <>
          <rect x="37" y="20" width="72" height="72" rx="4" fill="#dfe9c9" />
          {[1, 2, 3].map((i) => (
            <g key={i}>
              <path
                d={`M${37 + i * 18} 20v72M37 ${20 + i * 18}h72`}
                stroke="#adc282"
              />
            </g>
          ))}
          <g className="art-breathe">
            <text x="129" y="44">
              (10⁻²)²
            </text>
            <text x="129" y="77">
              = 10⁻⁴
            </text>
          </g>
        </>
      );
      break;
    default:
      return null;
  }
  return (
    <svg
      className="concept-art qty-art"
      data-scene={`qty-${scene}`}
      viewBox="0 0 240 116"
      fill="none"
      stroke="#687fbd"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
}
