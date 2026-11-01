import { lazy, Suspense, useEffect, useId, useState } from "react";
import { useApp } from "../state";
import {
  forceExamples,
  radians,
  resultant,
  tensions,
  type Force,
} from "../domain/statics";
import "../styles/graphs.css";
import "../styles/statics.css";
const StaticsScene = lazy(() => import("./StaticsScene"));
const colors = [
  "#58c4dd",
  "#fc8c8c",
  "#a5df83",
  "#d4adff",
  "#ffc370",
  "#8cece0",
  "#ec9bd0",
];
const fmt = (n: number) => (Math.abs(n) < 0.0005 ? "0.00" : n.toFixed(2));
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="math-slider">
      {label} <output>{value.toFixed(step < 1 ? 1 : 0)}</output>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}

export function ForcePlot({
  forces,
  triangle = false,
  progress = 1,
  parallelogram = false,
}: {
  forces: Force[];
  triangle?: boolean;
  progress?: number;
  parallelogram?: boolean;
}) {
  const { T } = useApp(),
    id = useId().replace(/:/g, "");
  const sum = resultant(forces);
  const vectors = forces.map((f) => [
    f.magnitude * Math.cos(radians(f.angle)),
    f.magnitude * Math.sin(radians(f.angle)),
  ]);
  let cursor = [0, 0];
  const segments = vectors.map((v) => {
    const start = triangle ? [...cursor] : [0, 0];
    cursor = [cursor[0] + v[0], cursor[1] + v[1]];
    return { start, end: [start[0] + v[0], start[1] + v[1]] };
  });
  const points = [
    [0, 0],
    [sum.x, sum.y],
    ...segments.flatMap((s) => [s.start, s.end]),
  ];
  const xmin = Math.min(...points.map((v) => v[0]), -1),
    xmax = Math.max(...points.map((v) => v[0]), 1),
    ymin = Math.min(...points.map((v) => v[1]), -1),
    ymax = Math.max(...points.map((v) => v[1]), 1);
  const scale = Math.min(
    420 / Math.max(xmax - xmin, 5),
    220 / Math.max(ymax - ymin, 5),
  );
  const X = (x: number) => 280 + (x - (xmin + xmax) / 2) * scale,
    Y = (y: number) => 170 - (y - (ymin + ymax) / 2) * scale;
  return (
    <svg
      className="math-plot statics-plot"
      viewBox="0 0 560 350"
      role="img"
      aria-label={T(
        "Force vectors, components and resultant",
        "விசைக் காவிகள், கூறுகள், விளையுள்",
      )}
    >
      <defs>
        {[...colors, "#ffff66"].map((c, i) => (
          <marker
            key={i}
            id={`${id}-${i}`}
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M0 0L7 3.5L0 7Z" fill={c} />
          </marker>
        ))}
      </defs>
      {Array.from({ length: 13 }, (_, i) => (
        <line
          key={"x" + i}
          x1={20 + i * 40}
          x2={20 + i * 40}
          y1="25"
          y2="320"
          stroke="#213242"
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={"y" + i}
          x1="20"
          x2="540"
          y1={30 + i * 40}
          y2={30 + i * 40}
          stroke="#213242"
        />
      ))}
      <line x1="22" x2="538" y1={Y(0)} y2={Y(0)} stroke="#788799" />
      <line x1={X(0)} x2={X(0)} y1="20" y2="320" stroke="#788799" />
      <text x="516" y={Math.min(315, Y(0) + 20)}>
        +x
      </text>
      <text x={X(0) + 8} y="26">
        +y
      </text>
      {parallelogram && vectors.length === 2 && (
        <g stroke="#a0adbf" strokeDasharray="6 5" opacity={progress}>
          <line
            x1={X(vectors[0][0])}
            y1={Y(vectors[0][1])}
            x2={X(sum.x)}
            y2={Y(sum.y)}
          />
          <line
            x1={X(vectors[1][0])}
            y1={Y(vectors[1][1])}
            x2={X(sum.x)}
            y2={Y(sum.y)}
          />
        </g>
      )}
      {segments.map((s, i) => {
        const portion = triangle
          ? Math.max(0, Math.min(1, progress * segments.length - i))
          : progress;
        const end = [
          s.start[0] + (s.end[0] - s.start[0]) * portion,
          s.start[1] + (s.end[1] - s.start[1]) * portion,
        ];
        return (
          <g key={i}>
            <line
              x1={X(s.start[0])}
              y1={Y(s.start[1])}
              x2={X(end[0])}
              y2={Y(end[1])}
              stroke={colors[i % colors.length]}
              strokeWidth="3"
              markerEnd={
                portion > 0 ? `url(#${id}-${i % colors.length})` : undefined
              }
            />
            {portion > 0.95 && (
              <text
                x={X(s.end[0]) + 7}
                y={Y(s.end[1]) - 10}
                style={{ fill: colors[i % colors.length] }}
              >
                {forces[i].name || `F${i + 1}`}
              </text>
            )}
          </g>
        );
      })}
      {sum.magnitude > 1e-8 && (
        <g opacity={progress}>
          <path
            d={`M${X(sum.x)} ${Y(0)}V${Y(sum.y)}H${X(0)}`}
            fill="none"
            stroke="#d6db75"
            strokeDasharray="3 5"
          />
          <line
            x1={X(0)}
            y1={Y(0)}
            x2={X(sum.x)}
            y2={Y(sum.y)}
            stroke="#ffff66"
            strokeWidth="2.5"
            markerEnd={`url(#${id}-7)`}
          />
          <text x={X(sum.x) - 10} y={Y(sum.y) + 24} style={{ fill: "#ffff66" }}>
            R
          </text>
        </g>
      )}
      <circle cx={X(0)} cy={Y(0)} r="4" fill="#fff" />
      <text x="24" y="338">
        {T(
          "Auto-scaled force diagram · N",
          "தானியங்கி அளவுத்திட்ட விசை வரைபு · N",
        )}
      </text>
    </svg>
  );
}

export function StaticsLab({
  kind,
  paused = false,
  compact = false,
}: {
  kind: string;
  paused?: boolean;
  compact?: boolean;
}) {
  const { T, language } = useApp();
  const [p, setP] = useState(8),
    [q, setQ] = useState(6),
    [angle, setAngle] = useState(90);
  const [example, setExample] = useState(5),
    [hidden, setHidden] = useState<number[]>([]);
  const [left, setLeft] = useState(30),
    [right, setRight] = useState(30),
    [weight, setWeight] = useState(100);
  const [separation, setSeparation] = useState(0),
    [force, setForce] = useState(10);
  const [triangle, setTriangle] = useState(false),
    [progress, setProgress] = useState(1),
    [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const change = () => setReduced(m.matches);
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (paused || reduced) setPlaying(false);
  }, [paused, reduced]);
  useEffect(() => {
    if (!playing || paused || reduced) return;
    let raf = 0,
      last = 0;
    const tick = (now: number) => {
      const delta = last ? Math.min(now - last, 80) / 5500 : 0;
      last = now;
      setProgress((x) => Math.min(1, x + delta));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, paused, reduced]);
  useEffect(() => {
    if (progress >= 1) setPlaying(false);
  }, [progress]);
  const tension = kind === "statics-tension",
    components = kind === "statics-components",
    couple = kind === "statics-couple";
  const ts = tensions(weight, left, right)!;
  const forces: Force[] = tension
    ? [
        { magnitude: ts.left, angle: 180 - left, name: "T_L" },
        { magnitude: ts.right, angle: right, name: "T_R" },
        { magnitude: weight, angle: 270, name: "W" },
      ]
    : components
      ? forceExamples[example].forces
          .filter((_, i) => !hidden.includes(i))
          .map((f, i) => ({
            ...f,
            name: `F${forceExamples[example].forces.indexOf(f) + 1}`,
          }))
      : [
          { magnitude: p, angle: 0, name: "P" },
          { magnitude: q, angle, name: "Q" },
        ];
  const r = resultant(forces);
  const play = () => {
    if (progress >= 1) setProgress(0);
    setPlaying((x) => !x);
  };
  return (
    <div
      className={"math-lab statics-lab" + (compact ? " statics-compact" : "")}
    >
      <div className="statics-toolbar">
        <span className="statics-pill">
          {T("PREDICT → CHANGE → EXPLAIN", "முன்னறிவி → மாற்று → விளக்கு")}
        </span>
        <button disabled={paused || reduced} onClick={play}>
          {playing
            ? T("Pause", "நிறுத்துக")
            : T("Animate the explanation", "விளக்கத்தை அசைவூட்டுக")}
        </button>
        <button
          onClick={() => {
            setProgress(0);
            setPlaying(false);
          }}
        >
          {T("Restart", "மீண்டும் தொடங்கு")}
        </button>
      </div>
      {tension ? (
        <Suspense fallback={<p>{T("Loading 3D…", "3D ஏற்றப்படுகிறது…")}</p>}>
          <StaticsScene
            left={left}
            right={right}
            weight={weight}
            phase={progress}
          />
        </Suspense>
      ) : null}
      {couple ? (
        <svg
          viewBox="0 0 560 320"
          className="math-plot"
          role="img"
          aria-label={T(
            "Equal opposite forces: collinear or a couple",
            "சம எதிர்விசைகள்: ஒரே தாக்குக் கோடு அல்லது சுழற்றும் விசைகள்",
          )}
        >
          <defs>
            <marker
              id="statics-couple-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0L7 3.5L0 7Z" fill="#58c4dd" />
            </marker>
          </defs>
          <g
            transform={`translate(280 155) rotate(${separation > 0 ? 22 * progress : 0})`}
          >
            <rect
              x="-120"
              y="-65"
              width="240"
              height="130"
              rx="15"
              fill="#294b63"
              stroke="#88acbf"
            />
            <circle r="5" fill="#fff" />
            <line
              x1="-90"
              x2="205"
              y1={-separation * 60}
              y2={-separation * 60}
              stroke="#58c4dd"
              strokeWidth="4"
              markerEnd="url(#statics-couple-arrow)"
            />
            <line
              x1="90"
              x2="-205"
              y1={separation * 60}
              y2={separation * 60}
              stroke="#58c4dd"
              strokeWidth="4"
              markerEnd="url(#statics-couple-arrow)"
            />
            <text x="145" y={-separation * 60 - 14}>
              {force} N
            </text>
            <text x="-196" y={separation * 60 + 26}>
              {force} N
            </text>
            <line
              x1="0"
              x2="0"
              y1={-separation * 60}
              y2={separation * 60}
              stroke="#ffff66"
              strokeDasharray="4 4"
            />
          </g>
          <text x="24" y="292">
            d = {separation.toFixed(1)} m · ΣF = 0 · τ ={" "}
            {(force * separation).toFixed(1)} N m
          </text>
        </svg>
      ) : (
        <ForcePlot
          forces={forces}
          progress={progress}
          triangle={triangle}
          parallelogram={!tension && !components && !triangle}
        />
      )}
      <div className="statics-controls">
        {tension ? (
          <>
            <Slider
              label={T("Left rope angle a (°)", "இடது கயிற்றுக் கோணம் a (°)")}
              value={left}
              min={10}
              max={80}
              onChange={setLeft}
            />
            <Slider
              label={T("Right rope angle b (°)", "வலது கயிற்றுக் கோணம் b (°)")}
              value={right}
              min={10}
              max={80}
              onChange={setRight}
            />
            <Slider
              label={T("Weight W (N)", "நிறை W (N)")}
              value={weight}
              min={20}
              max={200}
              step={5}
              onChange={setWeight}
            />
          </>
        ) : couple ? (
          <>
            <Slider
              label={T("Each force F (N)", "ஒவ்வொரு விசை F (N)")}
              value={force}
              min={1}
              max={30}
              onChange={setForce}
            />
            <Slider
              label={T(
                "Perpendicular separation d (m)",
                "செங்குத்துப் பிரிவு d (m)",
              )}
              value={separation}
              min={0}
              max={1}
              step={0.1}
              onChange={setSeparation}
            />
          </>
        ) : components ? (
          <label>
            {T("Choose a worked example", "எடுத்துக்காட்டைத் தெரிவுசெய்க")}
            <select
              value={example}
              onChange={(e) => {
                setExample(+e.target.value);
                setHidden([]);
                setProgress(1);
              }}
            >
              {forceExamples.map((v, i) => (
                <option key={i} value={i}>
                  {i + 1}. {v[language]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <Slider
              label={T("Force P (N)", "விசை P (N)")}
              value={p}
              min={0}
              max={30}
              onChange={setP}
            />
            <Slider
              label={T("Force Q (N)", "விசை Q (N)")}
              value={q}
              min={0}
              max={30}
              onChange={setQ}
            />
            <Slider
              label={T("Angle α (°)", "கோணம் α (°)")}
              value={angle}
              min={0}
              max={180}
              onChange={setAngle}
            />
          </>
        )}
      </div>
      <div className="math-preset-row">
        {!tension && !components && !couple && (
          <>
            {[0, 60, 90, 120, 180].map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAngle(a);
                  setProgress(1);
                }}
              >
                {a}°
              </button>
            ))}
            <button
              onClick={() => {
                setQ(p);
                setProgress(1);
              }}
            >
              {T("Equal forces", "சம விசைகள்")}
            </button>
          </>
        )}
        {tension && (
          <>
            <button
              onClick={() => {
                setLeft(30);
                setRight(30);
                setWeight(100);
                setProgress(1);
              }}
            >
              {T("Symmetric 30° ropes", "சமச்சீரான 30° கயிறுகள்")}
            </button>
            <button
              onClick={() => {
                setLeft(15);
                setRight(15);
                setProgress(1);
              }}
            >
              {T("Shallow ropes", "குறைந்த சாய்வுக் கயிறுகள்")}
            </button>
            <button
              onClick={() => {
                setLeft(30);
                setRight(60);
                setProgress(1);
              }}
            >
              {T("Asymmetric support", "சமச்சீரற்ற தாங்கல்")}
            </button>
          </>
        )}
        {couple ? (
          <>
            <button
              onClick={() => {
                setSeparation(0);
                setProgress(1);
              }}
            >
              {T("Same line: equilibrium", "ஒரே கோடு: சமநிலை")}
            </button>
            <button
              onClick={() => {
                setSeparation(0.8);
                setProgress(0);
              }}
            >
              {T(
                "Separated lines: a couple",
                "பிரிந்த கோடுகள்: சுழற்றும் விளைவு",
              )}
            </button>
          </>
        ) : (
          <button
            aria-pressed={triangle}
            onClick={() => {
              setTriangle((x) => !x);
              setProgress(1);
            }}
          >
            {triangle
              ? T("Common-point view", "ஒரே புள்ளித் தோற்றம்")
              : T("Head-to-tail view", "முனை–அடி இணைப்புத் தோற்றம்")}
          </button>
        )}
      </div>
      {components && (
        <div className="statics-force-list">
          {forceExamples[example].forces.map((f, i) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={!hidden.includes(i)}
                onChange={() =>
                  setHidden((h) =>
                    h.includes(i) ? h.filter((x) => x !== i) : [...h, i],
                  )
                }
              />
              <span style={{ color: colors[i] }}>F{i + 1}</span>{" "}
              {fmt(f.magnitude)} N · {f.angle}°
              <small>
                x = {fmt(f.magnitude * Math.cos(radians(f.angle)))} N · y ={" "}
                {fmt(f.magnitude * Math.sin(radians(f.angle)))} N
              </small>
            </label>
          ))}
        </div>
      )}
      <div className="statics-readouts" aria-live="polite">
        {couple ? (
          <>
            <strong>ΣF = 0 N</strong>
            <strong>τ = {fmt(force * separation)} N m</strong>
            <span>
              {separation === 0
                ? T(
                    "Equilibrium: force and moment both balance",
                    "சமநிலை: விசையும் திருப்புத்திறனும் சமப்படுகின்றன",
                  )
                : T(
                    "Not equilibrium: nonzero moment",
                    "சமநிலை இல்லை: திருப்புத்திறன் பூச்சியமல்ல",
                  )}
            </span>
          </>
        ) : tension ? (
          <>
            <strong>T_L = {fmt(ts.left)} N</strong>
            <strong>T_R = {fmt(ts.right)} N</strong>
            <span>
              ΣF_x = {fmt(r.x)} N · ΣF_y = {fmt(r.y)} N
            </span>
          </>
        ) : (
          <>
            <strong>R = {fmt(r.magnitude)} N</strong>
            <strong>
              θ ={" "}
              {r.angle === null
                ? T("undefined", "வரையறுக்கப்படாது")
                : fmt(r.angle) + "°"}
            </strong>
            <span>
              X = {fmt(r.x)} N · Y = {fmt(r.y)} N
            </span>
          </>
        )}
      </div>
      {tension && (
        <div className="statics-lami">
          <h4>
            {T(
              "Lami’s theorem: pair with the other two forces",
              "இலாமியின் தேற்றம்: ஏனைய இரு விசைகளின் கோணத்துடன் இணைக்கவும்",
            )}
          </h4>
          <p>
            α = {90 + right}° (T_R, W) · β = {90 + left}° (W, T_L) · γ ={" "}
            {180 - left - right}° (T_L, T_R)
          </p>
          <p>
            T_L / sin α = {fmt(ts.left / Math.sin(radians(90 + right)))} N<br />
            T_R / sin β = {fmt(ts.right / Math.sin(radians(90 + left)))} N<br />
            W / sin γ = {fmt(weight / Math.sin(radians(180 - left - right)))} N
          </p>
        </div>
      )}
      <Slider
        label={T("Explanation progress", "விளக்க முன்னேற்றம்")}
        value={progress * 100}
        min={0}
        max={100}
        onChange={(v) => {
          setPlaying(false);
          setProgress(v / 100);
        }}
      />
      <p className="statics-note">
        {tension
          ? T(
              "Angles are above horizontal. Ideal massless ropes and a point load; each setting is a new equilibrium. Moving dots trace the ropes; they are not material motion. Arrow lengths use one common force scale.",
              "கோணங்கள் கிடையிலிருந்து அளக்கப்படுகின்றன. நிறையற்ற இலட்சியக் கயிறுகளும் புள்ளிச் சுமையும் கருதப்படுகின்றன. ஒவ்வொரு அமைப்பும் புதிய சமநிலை. புள்ளிகள் கயிற்றை விளக்குகின்றன; பொருளின் இயக்கம் அல்ல. அம்புகள் ஒரே விசை அளவுத்திட்டத்தில் வரையப்படுகின்றன.",
            )
          : couple
            ? T(
                "Rotation is an illustrative cue, not a prediction of angular displacement. d is the full perpendicular gap between the force lines.",
                "சுழற்சி விளக்கத்திற்கானது; கோண இடப்பெயர்ச்சியின் கணிப்பு அல்ல. d என்பது விசைக் கோடுகளுக்கிடையிலான முழுச் செங்குத்துப் பிரிவு.",
              )
            : T(
                "Animation traces the vector construction; it does not show a body moving. θ is measured from +x.",
                "அசைவூட்டம் காவி வரைதலைக் காட்டுகிறது; பொருளின் இயக்கம் அல்ல. θ ஆனது +x இலிருந்து அளக்கப்படுகிறது.",
              )}
        {reduced &&
          " " +
            T(
              "Reduced motion is enabled; use the progress slider.",
              "குறைந்த அசைவு இயக்கப்பட்டுள்ளது; முன்னேற்றக் கட்டுப்பாட்டைப் பயன்படுத்துக.",
            )}
      </p>
    </div>
  );
}

export function StaticsConcept({
  concept,
  paused,
}: {
  concept: string;
  paused: boolean;
}) {
  if (concept === "statics-parallelogram")
    return <StaticsLab kind="statics-resultant" paused={paused} compact />;
  if (concept === "statics-two-equilibrium")
    return <StaticsLab kind="statics-couple" paused={paused} compact />;
  return null;
}
