import "../styles/travelling.css";
export function TravellingArt({
  blockKey,
  index,
}: {
  blockKey: string;
  index: number;
}) {
  const n = blockKey.includes("glass")
    ? index + 6
    : blockKey.includes("scales")
      ? index + 3
      : index;
  return (
    <svg
      viewBox="0 0 240 125"
      className="tm-art"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {n === 0 ? (
        <>
          <path d="M30 103H210M170 20V103" />
          <g className="tm-art-travel">
            <path d="M80 22V65H100V22ZM90 65V80M100 48H170" />
            <path d="M70 18H110" />
          </g>
        </>
      ) : n === 1 ? (
        <>
          <ellipse cx="120" cy="65" rx="64" ry="39" />
          <ellipse cx="120" cy="65" rx="37" ry="22" />
          <path d="M55 18V110M185 18V110" stroke="#38bc9b" />
        </>
      ) : n === 2 ? (
        <>
          <circle cx="120" cy="63" r="46" />
          <circle cx="120" cy="63" r="26" />
          <path
            className="tm-art-travel"
            d="M85 8V117M30 63H210"
            stroke="#d49f49"
          />
        </>
      ) : n === 3 ? (
        <>
          {Array.from({ length: 13 }, (_, i) => (
            <path key={i} d={`M${35 + i * 14} 28v${i % 2 === 0 ? 28 : 15}`} />
          ))}
          <path d="M30 57H210" />
          <text x="40" y="93" stroke="none" fill="currentColor">
            0.50 mm
          </text>
        </>
      ) : n === 4 ? (
        <>
          <path d="M30 40H210M30 80H210" />
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i}>
              <path d={`M${35 + i * 18} 40v-15M${35 + i * 17.64} 80v15`} />
            </g>
          ))}
          <text x="72" y="66" stroke="none" fill="currentColor">
            0.01 mm
          </text>
        </>
      ) : n === 5 ? (
        <>
          <text x="24" y="50" stroke="none" fill="currentColor">
            MS + n × LC
          </text>
          <path
            className="tm-art-travel"
            d="M30 87H210M120 70V107"
            stroke="#38bc9b"
          />
        </>
      ) : (
        <>
          <path d="M30 92H210" />
          {n > 6 && <path d="M45 40H195V91H45Z" fill="#44aaba33" />}
          <path
            d={
              n === 6
                ? "M105 83l20 18m-20 0l20 -18"
                : n === 7
                  ? "M105 62l20 18m-20 0l20 -18"
                  : "M113 37h8v5h-8Z"
            }
            stroke="#d49f49"
          />
          <path className="tm-art-travel" d="M120 5V27" />
          <path d="M155 42V90" strokeDasharray="4 4" />
        </>
      )}
    </svg>
  );
}
