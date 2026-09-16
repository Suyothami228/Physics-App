import { useId, useState } from "react";
import { useApp } from "../state";
import type { ContentBlock } from "./ManagedLesson";
import "../styles/unit-learning.css";
import { UnitStudio } from "./UnitStudio";

export function UnitReference({ block }: { block: ContentBlock }) {
  const { T, language } = useApp();
  const id = useId();
  const [search, setSearch] = useState("");
  const [reference, setReference] = useState(false);
  const [recall, setRecall] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const chunks = (block[language === "ta" ? "body_ta" : "body_en"] ?? "")
    .split(/\n\s*\n/)
    .filter(Boolean);
  const [headers, ...rows] = chunks.map((chunk) => {
    const [heading, ...body] = chunk.split("\n");
    return [
      heading,
      ...body
        .join(" ")
        .split("|")
        .map((x) => x.trim()),
    ];
  });
  const visible = rows.filter((row) =>
    row
      .join(" ")
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase().trim()),
  );
  return (
    <div className="unit-reference">
      <div className="reference-switch">
        <button
          className="text-link"
          aria-expanded={reference}
          onClick={() => setReference(!reference)}
        >
          {reference
            ? T("← Back to activities", "← பயிற்சிகளுக்குத் திரும்புக")
            : T("Open full reference table ↗", "முழு அட்டவணையைத் திறக்க ↗")}
        </button>
      </div>
      {!reference ? (
        <UnitStudio
          key={language + (block.body_en ?? "") + (block.body_ta ?? "")}
          rows={rows}
          headers={headers}
          kind={block.key}
        />
      ) : (
        <>
          <div className="unit-table-tools">
            <label htmlFor={id}>
              {T(
                "Find a quantity, symbol or prefix",
                "கணியம், குறியீடு அல்லது முன்னொட்டைத் தேடுக",
              )}
              <input
                id={id}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={T("Try kg, force, micro…", "kg, விசை, micro…")}
              />
            </label>
            <button
              className="btn btn-white"
              aria-pressed={recall}
              onClick={() => {
                setRecall(!recall);
                setRevealed([]);
              }}
            >
              {recall
                ? T("Show reference", "அட்டவணையைக் காட்டுக")
                : T("Practise recall", "நினைவுகூர்ந்து பயில்க")}
            </button>
          </div>
          <p className="unit-table-hint">
            {recall
              ? T(
                  "Say the unit and its relationship first, then reveal each row. This is practice, not a mastery score.",
                  "முதலில் அலகையும் அதன் தொடர்பையும் கூறிவிட்டு ஒவ்வொரு வரியையும் திறக்கவும். இது நினைவுப் பயிற்சி; தேர்ச்சி மதிப்பெண் அல்ல.",
                )
              : T(
                  "Search the table or hide the answers to test your recall.",
                  "அட்டவணையில் தேடுக அல்லது விடைகளை மறைத்து நினைவாற்றலைச் சோதிக்கவும்.",
                )}
          </p>
          <div
            className="unit-table-scroll"
            role="region"
            aria-label={block[language === "ta" ? "title_ta" : "title_en"]}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  {headers?.map((h, i) => (
                    <th scope="col" key={i}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => (
                  <tr key={row[0]}>
                    <th scope="row">
                      <span className="unit-row-index">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {row[0]}
                    </th>
                    {recall && !revealed.includes(row[0]) ? (
                      <td colSpan={Math.max(1, headers.length - 1)}>
                        <button
                          className="unit-reveal"
                          onClick={() => setRevealed([...revealed, row[0]])}
                        >
                          {T("Reveal", "விடையைக் காண்க")} · {row[0]}
                        </button>
                      </td>
                    ) : (
                      row.slice(1).map((cell, j) => (
                        <td key={j} className={j === 1 ? "unit-symbol" : ""}>
                          {cell}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visible.length && (
            <p role="status">
              {T(
                "No matches. Try another term.",
                "பொருத்தம் இல்லை. வேறு சொல்லை முயல்க.",
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function angleMeasures(radius: number, theta: number) {
  return { arc: radius * theta, solid: 2 * Math.PI * (1 - Math.cos(theta)) };
}
export function AngleLab() {
  const { T } = useApp();
  const [radius, setRadius] = useState(2);
  const [theta, setTheta] = useState(1);
  const [mode, setMode] = useState("plane");
  const r = 70,
    cx = 120,
    cy = 100;
  const x = cx + r * Math.cos(theta),
    y = cy - r * Math.sin(theta);
  const { arc, solid } = angleMeasures(radius, theta);
  return (
    <div className="angle-lab">
      <div
        className="filters"
        role="group"
        aria-label={T("Angle model", "கோண மாதிரி")}
      >
        {[
          ["plane", T("Plane angle", "தளக்கோணம்")],
          ["solid", T("Solid angle", "திண்மக்கோணம்")],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={mode === key}
            className={mode === key ? "selected" : ""}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="angle-lab-grid">
        <svg
          viewBox="0 0 300 205"
          role="img"
          aria-label={T(
            "Angle geometry, schematic",
            "கோண வடிவியல் விளக்கப்படம்",
          )}
        >
          {mode === "plane" ? (
            <>
              <circle cx={cx} cy={cy} r={r} fill="#eef1ff" stroke="#bac6e9" />
              <path
                d={`M${cx} ${cy}L${cx + r} ${cy}A${r} ${r} 0 0 0 ${x} ${y}Z`}
                fill="#cddc9a"
                stroke="#739345"
                strokeWidth="2"
              />
              <path
                d={`M${cx + r} ${cy}A${r} ${r} 0 0 0 ${x} ${y}`}
                fill="none"
                stroke="#546cda"
                strokeWidth="5"
              />
              <text x="140" y="121">
                r
              </text>
              <text x="140" y="92">
                θ
              </text>
              <text x="28" y="188">
                θ = s / r
              </text>
            </>
          ) : (
            <>
              <ellipse
                cx="172"
                cy="98"
                rx="45"
                ry="76"
                fill="#e3e9fa"
                stroke="#acbadd"
              />
              <path
                d={`M45 98L172 ${98 - 25 - theta * 20}Q${210 + theta * 8} 98 172 ${98 + 25 + theta * 20}Z`}
                fill="#d2e2aa"
                stroke="#799946"
              />
              <ellipse
                cx="172"
                cy="98"
                rx={14 + theta * 10}
                ry={25 + theta * 20}
                fill="#b7cd7c"
                stroke="#799946"
              />
              <path d="M45 98h127" stroke="#6477bc" strokeDasharray="4 4" />
              <text x="99" y="91">
                r
              </text>
              <text x="174" y="103">
                A
              </text>
              <text x="28" y="188">
                Ω = A / r²
              </text>
            </>
          )}
        </svg>
        <div className="widget-controls">
          <label>
            {T("Radius (m)", "ஆரை (m)")}
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <strong>{radius} m</strong>
          </label>
          <label>
            {mode === "plane"
              ? T("Angle θ (rad)", "கோணம் θ (rad)")
              : T("Cone half-angle θ (rad)", "கூம்பின் அரைக் கோணம் θ (rad)")}
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={theta}
              onChange={(e) => setTheta(Number(e.target.value))}
            />
            <strong>{theta.toFixed(1)} rad</strong>
          </label>
          <button
            className="btn btn-white"
            onClick={() => {
              setRadius(2);
              setTheta(1);
              setMode("plane");
            }}
          >
            {T("Reset model", "மாதிரியை மீட்டமைக்க")}
          </button>
        </div>
      </div>
      <output className="widget-result" aria-live="polite">
        {mode === "plane"
          ? `s = ${arc.toFixed(2)} m · θ = ${arc.toFixed(2)} / ${radius} = ${theta.toFixed(2)} rad`
          : `A = ${(solid * radius * radius).toFixed(2)} m² · Ω = ${solid.toFixed(2)} sr`}
      </output>
      <p>
        {mode === "plane"
          ? T(
              "Keep θ fixed and change r: the arc length changes, but s/r stays the same. One radian means arc length equals radius.",
              "θ மாறாமல் r ஐ மாற்றுக: வில்லின் நீளம் மாறும்; s/r மாறாது. வில்லின் நீளம் ஆரைக்குச் சமமானால் கோணம் ஒரு ஆரையன்.",
            )
          : T(
              "A is a spherical cap, not a flat disc. For this circular cone, Ω = 2π(1 − cos θ). A full sphere subtends 4π sr. Drawing is schematic; outputs use the formula.",
              "A என்பது கோள மேற்பரப்பின் பகுதி; தட்டையான வட்டம் அல்ல. இவ்வட்டக் கூம்பிற்கு Ω = 2π(1 − cos θ). முழுக் கோளம் 4π sr கோணத்தைத் தாங்கும். படம் விளக்கத்திற்கானது; பெறுமானங்கள் சூத்திரத்தால் கணிக்கப்படுகின்றன.",
            )}
      </p>
    </div>
  );
}
