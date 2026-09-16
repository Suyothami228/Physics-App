import { useId, useState } from "react";
import { useApp } from "../state";
import { caliperParts } from "../domain/caliper-parts";
import { Caliper3D } from "./Caliper3D";
export function CaliperAnatomy() {
  const { T } = useApp();
  const arrowId = useId();
  const [mode, setMode] = useState("2d"),
    [active, setActive] = useState(0);
  const part = caliperParts[active];
  return (
    <section className="caliper-anatomy">
      <h3>
        {T("Know your vernier caliper", "வேணியர் இடுக்கிமானியின் பகுதிகள்")}
      </h3>
      <div
        className="caliper-camera"
        role="group"
        aria-label={T("Parts diagram view", "பகுதிப் படக் காட்சி")}
      >
        <button aria-pressed={mode === "2d"} onClick={() => setMode("2d")}>
          {T("2D · labelled photograph", "2D · பெயரிடப்பட்ட படம்")}
        </button>
        <button aria-pressed={mode === "3d"} onClick={() => setMode("3d")}>
          {T("3D · inspect the parts", "3D · பகுதிகளை ஆராய்க")}
        </button>
      </div>
      {mode === "3d" ? (
        <Caliper3D anatomyOnly />
      ) : (
        <>
          <div className="caliper-photo">
            <svg
              viewBox="0 0 1482 590"
              role="img"
              aria-label={T(
                "Original vernier photograph with part markers",
                "பகுதிக் குறிகளுடன் வேணியர் இடுக்கிமானியின் படம்",
              )}
            >
              <defs>
                <marker
                  id={arrowId}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 L10 5 L0 10 Z" fill="#5976b4" />
                </marker>
              </defs>
              <image
                href="/images/vernier-reference.jpg"
                x="0"
                y="80"
                width="1482"
                height="446"
              />
              {caliperParts.map((p, i) => (
                <g key={p.id}>
                  {p.photoTargets ? (
                    p.photoTargets.map(([x, y]) => (
                      <line
                        key={x}
                        x1={p.photo[0]}
                        y1={i === 0 ? 535 : 55}
                        x2={x}
                        y2={y + 80}
                        stroke="#5976b4"
                        strokeWidth="3"
                        markerEnd={`url(#${arrowId})`}
                      />
                    ))
                  ) : (
                    <line
                      x1={p.photo[0]}
                      y1={p.photo[1] + 80}
                      x2={p.photo[0]}
                      y2={i === 0 || i === 4 ? 555 : 35}
                      stroke={i === active ? "#5976b4" : "#9dabc3"}
                      strokeWidth="3"
                    />
                  )}
                  <circle
                    cx={p.photo[0]}
                    cy={p.photoTargets ? (i === 0 ? 535 : 55) : p.photo[1] + 80}
                    r="17"
                    fill={i === active ? "#5875b4" : "#344b6b"}
                  />
                  <text
                    x={p.photo[0]}
                    y={p.photoTargets ? (i === 0 ? 541 : 61) : p.photo[1] + 86}
                    textAnchor="middle"
                    fill="white"
                    fontSize="16"
                  >
                    {p.id}
                  </text>
                  <text
                    x={p.photo[0]}
                    y={i === 0 || i === 4 ? 578 : 25}
                    textAnchor={i === 5 ? "end" : i === 1 ? "start" : "middle"}
                    fill="#324766"
                    fontSize="24"
                  >
                    {T(p.en, p.ta)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="caliper-part-picker">
            {caliperParts.map((p, i) => (
              <button
                key={p.id}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
              >
                {p.id} · {T(p.en, p.ta)}
              </button>
            ))}
          </div>
          <div className="caliper-part-detail" aria-live="polite">
            <strong>{T(part.en, part.ta)}</strong>
            <p>{T(part.detail, part.detailTa)}</p>
          </div>
        </>
      )}
      <p className="caliper-reference-note">
        {T(
          "The photographed instrument is marked 0.05 mm. The worked exercise and measurement lab use a separate 0.1 mm teaching scale (10 vernier divisions = 9 mm). The 3D geometry is reconstructed from the photograph; it is not a 3D scan.",
          "படத்திலுள்ள கருவியில் 0.05 mm எனக் குறிக்கப்பட்டுள்ளது. விளக்கக் கணக்கும் அளவீட்டுப் பயிற்சியும் தனியான 0.1 mm கற்றல் அளவிடையைப் பயன்படுத்துகின்றன (10 வேணியர் பிரிவுகள் = 9 mm). 3D வடிவம் படத்தைப் பார்த்து மீளுருவாக்கப்பட்டது; 3D வருடல் அல்ல.",
        )}
      </p>
    </section>
  );
}
