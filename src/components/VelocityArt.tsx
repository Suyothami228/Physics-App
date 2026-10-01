import { useApp } from "../state";
export function VelocityArt({ concept }: { concept: string }) {
  const { T } = useApp();
  if (concept === "velocity-basics")
    return (
      <svg
        className="velocity-idea"
        viewBox="0 0 660 150"
        role="img"
        aria-label={T(
          "Travel 60 metres right then 20 metres left; displacement is 40 metres right",
          "60 மீற்றர் வலப்புறம், 20 மீற்றர் இடப்புறம்; இடப்பெயர்ச்சி 40 மீற்றர் வலப்புறம்",
        )}
      >
        <path
          d="M70 65H570L553 55M570 65L553 75M570 95H403L420 85M403 95L420 105"
          stroke="#356cf3"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M70 125H403L385 115M403 125L385 135"
          stroke="#059e81"
          strokeWidth="4"
          fill="none"
        />
        <text x="260" y="43">
          60 m →
        </text>
        <text x="470" y="120">
          ← 20 m
        </text>
        <text x="220" y="148">
          Δx = +40 m
        </text>
        <circle
          className="velocity-trip-dot"
          cx="70"
          cy="65"
          r="9"
          fill="#ef8150"
        />
      </svg>
    );
  if (concept === "velocity-direction")
    return (
      <svg
        className="velocity-idea"
        viewBox="0 0 660 180"
        role="img"
        aria-label={T(
          "A velocity arrow rotates around a circular path",
          "வட்டப் பாதையில் திசை மாறும் வேக அம்பு",
        )}
      >
        <circle
          cx="170"
          cy="90"
          r="62"
          fill="none"
          stroke="#bfd0eb"
          strokeWidth="3"
          strokeDasharray="5 5"
        />
        <g className="velocity-orbit">
          <circle cx="232" cy="90" r="9" fill="#356cf3" />
          <path
            d="M232 90V37L225 49M232 37L239 49"
            fill="none"
            stroke="#07957f"
            strokeWidth="4"
          />
        </g>
        <text x="300" y="85">
          |v| = {T("constant", "மாறிலி")}
        </text>
        <text x="300" y="120">
          {T("Direction changes ↗", "திசை மாறுகிறது ↗")}
        </text>
      </svg>
    );
  if (concept === "velocity-average")
    return (
      <svg
        className="velocity-idea"
        viewBox="0 0 660 140"
        role="img"
        aria-label={T(
          "At half the speed, the same distance takes twice the time",
          "அரை கதியில் அதே தூரத்தைக் கடக்க இருமடங்கு நேரம் தேவை",
        )}
      >
        <text x="25" y="38">
          60 m/s
        </text>
        <rect x="135" y="18" width="190" height="27" rx="10" fill="#5375ef" />
        <text x="345" y="38">
          t
        </text>
        <text x="25" y="88">
          30 m/s
        </text>
        <rect x="135" y="68" width="380" height="27" rx="10" fill="#06a688" />
        <text x="535" y="88">
          2t
        </text>
        <text x="135" y="128">
          {T("Same distance · different time", "ஒரே தூரம் · வெவ்வேறு நேரம்")}
        </text>
      </svg>
    );
  if (concept === "velocity-acceleration")
    return (
      <svg
        className="velocity-idea"
        viewBox="0 0 660 150"
        role="img"
        aria-label={T(
          "Velocity–time graph: a sloping line represents acceleration",
          "வேகம்–நேர வரைபின் சாய்வு ஆர்முடுகலைக் குறிக்கிறது",
        )}
      >
        <path d="M65 15V125H330" fill="none" stroke="#9ab0cd" strokeWidth="2" />
        <path d="M65 125L65 105L310 25L310 125Z" fill="#d3f3e7" />
        <path d="M65 105L310 25" stroke="#356cf3" strokeWidth="4" />
        <text x="30" y="25">
          v
        </text>
        <text x="325" y="145">
          t
        </text>
        <text x="370" y="60">
          a = Δv / Δt
        </text>
        <text x="370" y="100">
          {T("Area → displacement", "பரப்பு → இடப்பெயர்ச்சி")}
        </text>
      </svg>
    );
  if (concept === "velocity-earth-profile")
    return (
      <svg
        className="velocity-idea"
        viewBox="0 0 660 185"
        role="img"
        aria-label={T(
          "Ideal gravity profile: linear inside a uniform sphere and inverse square outside",
          "சீரான கோளத்தினுள் நேர்விகித ஈர்ப்பும் வெளியே நேர்மாறு வர்க்க ஈர்ப்பும்",
        )}
      >
        <path d="M55 20V150H605" stroke="#9ab0cd" strokeWidth="2" fill="none" />
        <path
          d="M235 30V150"
          stroke="#08a082"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <path d="M55 150L235 30" stroke="#356cf3" strokeWidth="4" />
        <polyline
          points={Array.from({ length: 81 }, (_, i) => {
            const r = 1 + i / 40;
            return `${55 + 180 * r},${150 - 120 / (r * r)}`;
          }).join(" ")}
          fill="none"
          stroke="#ba4aae"
          strokeWidth="4"
        />
        <text x="20" y="25">
          g
        </text>
        <text x="615" y="155">
          r
        </text>
        <text x="230" y="176">
          R
        </text>
        <text x="105" y="60">
          g ∝ r
        </text>
        <text x="350" y="70">
          g ∝ 1/r²
        </text>
        <text x="42" y="176">
          0
        </text>
      </svg>
    );
  return null;
}
