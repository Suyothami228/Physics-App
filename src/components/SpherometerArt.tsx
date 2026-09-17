import "../styles/spherometer.css";
export function SpherometerArt({
  blockKey,
  index,
}: {
  blockKey: string;
  index: number;
}) {
  const mode = blockKey.includes("geometry")
    ? index + 6
    : blockKey.includes("scale")
      ? index + 3
      : index;
  return (
    <svg
      viewBox="0 0 240 120"
      className="sphere-art"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {mode === 0 ? (
        <>
          <path d="M25 95H215M85 76H155V95H85Z" />
          <g className="sphere-bob">
            <path d="M120 15V70M108 20H132" />
            <circle cx="120" cy="70" r="4" fill="#55c9ad" />
          </g>
        </>
      ) : mode === 1 ? (
        <>
          <path d="M30 98Q120 5 210 98M30 98H210" />
          <path className="sphere-dash" d="M120 98V52" stroke="#36bca0" />
          <text x="128" y="80" stroke="none" fill="currentColor">
            h
          </text>
        </>
      ) : mode === 2 ? (
        <>
          <path d="M120 15L40 100H200ZM120 65L40 100M120 65L200 100M120 65V15" />
          {[
            [120, 15],
            [40, 100],
            [200, 100],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="5" fill="#49bca9" />
          ))}
        </>
      ) : mode === 3 ? (
        <>
          <path d="M105 15V105M135 15V105" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M105 ${20 + i * 10}l30 8`} />
          ))}
          <path className="sphere-bob" d="M155 30V70l-5 -8m5 8l5 -8" />
        </>
      ) : mode === 4 ? (
        <g className="sphere-spin" style={{ transformOrigin: "120px 60px" }}>
          <circle cx="120" cy="60" r="43" />
          {Array.from({ length: 20 }, (_, i) => (
            <path
              key={i}
              transform={`rotate(${i * 18} 120 60)`}
              d="M120 17v8"
            />
          ))}
        </g>
      ) : mode === 5 ? (
        <>
          <path d="M50 20V100M45 40H75M45 60H75M45 80H75" />
          <circle cx="150" cy="60" r="35" />
          <path className="sphere-dash" d="M150 60V25" />
          <text x="95" y="65" stroke="none" fill="currentColor">
            +
          </text>
        </>
      ) : mode === 6 ? (
        <>
          <path d="M25 95Q120 -10 215 95M25 95H215M120 95V42" />
          <text x="127" y="77" stroke="none" fill="currentColor">
            h
          </text>
          <text x="65" y="109" stroke="none" fill="currentColor">
            d
          </text>
        </>
      ) : (
        <>
          <path d="M120 12L40 105H200ZM120 68L40 105" />
          <text x="120" y="117" stroke="none" fill="currentColor">
            a
          </text>
          <text x="74" y="78" stroke="none" fill="currentColor">
            d
          </text>
        </>
      )}
    </svg>
  );
}
