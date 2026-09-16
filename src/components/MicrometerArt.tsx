export function MicrometerArt({
  blockKey,
  index,
}: {
  blockKey: string;
  index: number;
}) {
  const pitch = blockKey === "micrometer-pitch";
  return (
    <div className="concept-art" aria-hidden="true">
      <svg viewBox="0 0 280 120" className="micro-art">
        {pitch ? (
          index === 0 ? (
            <>
              <path d="M30 60H245" stroke="#aac4d1" strokeWidth="12" />
              <g className="micro-art-advance">
                {Array.from({ length: 9 }, (_, i) => (
                  <path
                    key={i}
                    d={`M${45 + i * 15} 48l10 24`}
                    stroke="#246c83"
                    strokeWidth="4"
                  />
                ))}
                <path
                  d="M200 60h35m-8-7 8 7-8 7"
                  fill="none"
                  stroke="#246c83"
                  strokeWidth="3"
                />
              </g>
              <text x="90" y="105">
                1 ↻ → pitch
              </text>
            </>
          ) : (
            <>
              <g
                className="micro-art-turn"
                style={{ transformOrigin: "80px 60px" }}
              >
                <circle
                  cx="80"
                  cy="60"
                  r="43"
                  fill="#d4eae4"
                  stroke="#277567"
                />
                {Array.from({ length: index === 1 ? 50 : 100 }, (_, i) => {
                  const a = (i * 2 * Math.PI) / (index === 1 ? 50 : 100);
                  return (
                    <line
                      key={i}
                      x1={80 + 35 * Math.cos(a)}
                      y1={60 + 35 * Math.sin(a)}
                      x2={80 + 43 * Math.cos(a)}
                      y2={60 + 43 * Math.sin(a)}
                      stroke="#277567"
                    />
                  );
                })}
              </g>
              <text x="150" y="48">
                {index === 1 ? "0.5 ÷ 50" : "1 ÷ 100"}
              </text>
              <text x="150" y="80">
                0.01 mm
              </text>
            </>
          )
        ) : index === 0 ? (
          <>
            <path d="M30 60H250" stroke="#d6aa63" strokeWidth="14" />
            {[60, 140, 220].map((x) => (
              <g key={x}>
                <path
                  d={`M${x} 35v16m0 18v16`}
                  stroke="#23716d"
                  strokeWidth="3"
                />
                <circle
                  className="micro-art-pulse"
                  cx={x}
                  cy="60"
                  r="16"
                  fill="none"
                  stroke="#23716d"
                />
              </g>
            ))}
          </>
        ) : index === 1 ? (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M55 ${38 + i * 10}l100-15 65 20-100 15Z`}
                fill="#e7eef5"
                stroke="#548298"
              />
            ))}
            <path
              d="M240 30v65m-5-5 5 5 5-5"
              stroke="#277567"
              fill="none"
              strokeWidth="3"
            />
          </>
        ) : (
          <>
            <path
              d="M40 35v40q30 45 65 0V35"
              fill="none"
              stroke="#247d8b"
              strokeWidth="12"
            />
            <path d="M45 35h20m18 0h80" stroke="#738997" strokeWidth="10" />
            <rect x="145" y="20" width="45" height="30" rx="5" fill="#c4d2db" />
            <text x="200" y="48">
              ↔
            </text>
            <text x="160" y="95">
              mm
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
