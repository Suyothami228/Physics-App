import { useState } from "react";
import { useApp } from "../state";

export function UnitStudio({
  rows,
  headers,
  kind,
}: {
  rows: string[][];
  headers: string[];
  kind: string;
}) {
  const { T } = useApp();
  const [active, setActive] = useState(
    kind === "qty-prefixes"
      ? Math.max(
          0,
          rows.findIndex((r) => r[0] === "kilo"),
        )
      : 0,
  );
  const [challenge, setChallenge] = useState(false);
  const [round, setRound] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  if (!rows.length) return null;
  const row = rows[Math.min(active, rows.length - 1)];
  const prefix = kind === "qty-prefixes";
  const systems = kind === "qty-systems";
  const total = Math.min(5, rows.length);
  const target = (active + round) % rows.length;
  const answer = (i: number) =>
    systems ? rows[i].slice(1).join(" · ") : rows[i][2];
  const candidates = [
    target,
    ...rows.map((_, i) => i).filter((i) => answer(i) !== answer(target)),
  ]
    .filter((v, i, a) => a.findIndex((x) => answer(x) === answer(v)) === i)
    .slice(0, 4);
  const rotate = (round + 1) % candidates.length;
  const choices = [...candidates.slice(rotate), ...candidates.slice(0, rotate)];
  const start = () => {
    setChallenge(true);
    setRound(0);
    setChosen(null);
    setScore(0);
    setFinished(false);
  };
  const exponent = Number(row[1]?.replace("10^", ""));
  return (
    <div
      className={
        "unit-studio" + (kind.startsWith("dim-") ? " dimension-studio" : "")
      }
    >
      <div className="studio-topline">
        <span className="eyebrow">
          {T("UNIT STUDIO", "அலகுப் பயிற்சியகம்")}
        </span>
        <div className="filters">
          <button
            aria-pressed={!challenge}
            className={!challenge ? "selected" : ""}
            onClick={() => setChallenge(false)}
          >
            {T("Explore", "ஆராய்க")}
          </button>
          <button
            aria-pressed={challenge}
            className={challenge ? "selected" : ""}
            onClick={start}
          >
            {T("5-question challenge", "5 வினாச் சவால்")}
          </button>
        </div>
      </div>
      {challenge ? (
        <div className="unit-challenge">
          {finished ? (
            <>
              <span className="challenge-score">
                {score} / {total}
              </span>
              <h3>{T("Round complete", "சுற்று முடிந்தது")}</h3>
              <p>
                {T(
                  "Use the explanations to revisit any misses. This short practice does not measure exam readiness.",
                  "தவறிய விடைகளின் விளக்கங்களை மீண்டும் படிக்கவும். இச்சிறு பயிற்சி தேர்வுத் தயார்நிலையை அளவிடாது.",
                )}
              </p>
              <button
                className="btn btn-blue"
                onClick={() => {
                  setActive((active + total) % rows.length);
                  start();
                }}
              >
                {T("Try another round", "மற்றொரு சுற்றை முயல்க")}
              </button>
            </>
          ) : (
            <>
              <div className="challenge-progress">
                <span>
                  {T("Question", "வினா")} {round + 1} / {total}
                </span>
                <progress max={total} value={round} />
              </div>
              <p>
                {systems
                  ? T(
                      "Match this system to its units",
                      "இந்தத் தொகுதிக்குரிய அலகுகளைத் தேர்க",
                    )
                  : T(
                      kind.startsWith("dim-")
                        ? "Choose the matching dimension"
                        : "Choose the matching symbol",
                      kind.startsWith("dim-")
                        ? "பொருத்தமான பரிமாணத்தைத் தேர்க"
                        : "பொருத்தமான குறியீட்டைத் தேர்க",
                    )}
              </p>
              <h3>{rows[target][0]}</h3>
              <div className="unit-answer-grid">
                {choices.map((i) => (
                  <button
                    key={i}
                    disabled={chosen !== null}
                    className={
                      chosen !== null && i === target
                        ? "is-correct"
                        : chosen === i
                          ? "is-wrong"
                          : ""
                    }
                    onClick={() => {
                      setChosen(i);
                      if (i === target) setScore(score + 1);
                    }}
                  >
                    {answer(i)}
                  </button>
                ))}
              </div>
              {chosen !== null && (
                <div className="unit-feedback" role="status">
                  <strong>
                    {chosen === target
                      ? T("That’s right.", "சரியான விடை.")
                      : T(
                          "Let’s connect the pieces.",
                          "தொடர்பைப் புரிந்துகொள்வோம்.",
                        )}
                  </strong>
                  <p>{rows[target].join(" · ")}</p>
                  <button
                    className="btn btn-blue"
                    onClick={() => {
                      if (round + 1 === total) setFinished(true);
                      else {
                        setRound(round + 1);
                        setChosen(null);
                      }
                    }}
                  >
                    {round + 1 === total
                      ? T("See result", "முடிவைக் காண்க")
                      : T("Next question →", "அடுத்த வினா →")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <p className="studio-instruction">
            {prefix
              ? T(
                  "Slide through powers of ten. Watch the unit change.",
                  "பத்தின் அடுக்குகளூடாக நகர்த்தி அலகின் மாற்றத்தைப் பாருங்கள்.",
                )
              : T(
                  "Pick a tile. Connect its name, symbol and meaning.",
                  "ஒரு அட்டையைத் தேர்க. அதன் பெயர், குறியீடு, பொருள் ஆகியவற்றை இணைத்து அறிக.",
                )}
          </p>
          <div className="studio-focus" key={active}>
            <div className="studio-symbol" aria-hidden="true">
              {systems ? row[0].split(" ")[0] : row[2]}
            </div>
            <div className="studio-details">
              <span>
                {String(active + 1).padStart(2, "0")} / {rows.length}
              </span>
              <h3>{row[0]}</h3>
              <dl>
                {headers.slice(1).map((h, i) => (
                  <div key={i}>
                    <dt>{h}</dt>
                    <dd>{row[i + 1]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {prefix && Number.isFinite(exponent) && (
            <div className="prefix-scale">
              <output>
                1 {row[2]}m = 10<sup>{exponent}</sup> m
              </output>
              <label>
                {T(
                  "Move along the prefix scale",
                  "முன்னொட்டு அளவுகோலில் நகர்த்துக",
                )}
                <input
                  type="range"
                  min="0"
                  max={rows.length - 1}
                  value={active}
                  onChange={(e) => setActive(Number(e.target.value))}
                />
              </label>
              <div className="scale-ends">
                <span>{rows[0][0]}</span>
                <span>{rows.at(-1)?.[0]}</span>
              </div>
              <p>
                {T(
                  "Each stop is a named prefix; spacing is not a linear length scale.",
                  "ஒவ்வொரு நிலையமும் ஒரு முன்னொட்டு; இடைவெளிகள் நேரியல் நீள அளவுகோல் அல்ல.",
                )}
              </p>
            </div>
          )}
          <div
            className={"unit-tile-picker" + (prefix ? " prefix-picker" : "")}
            role="group"
            aria-label={T("Choose an entry", "ஒரு பதிவைத் தேர்க")}
          >
            {rows.map((r, i) => (
              <button
                key={i}
                aria-label={`${systems ? r[0].split(" ")[0] : r[2]} ${r[0]}`}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
              >
                <strong>{systems ? r[0].split(" ")[0] : r[2]}</strong>
                <span>{r[0]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
