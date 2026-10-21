import { useEffect, useState } from "react";
import { useApp } from "../state";
import { GraphPlot, coordinates, sample } from "./GraphPlot";
import {
  linePresets,
  motionAt,
  transformation,
  transformSample,
  type TransformFamily,
  type TransformMode,
} from "../domain/graphs";
import "../styles/graphs.css";
const blue = "#58c4dd",
  yellow = "#ffff00",
  green = "#83c167",
  pink = "#ff8080";
function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
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
      <span>{label}</span>
      <output>{Number(value.toFixed(2))}</output>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function useTrace() {
  const [t, setT] = useState(1),
    [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    let prev = 0,
      id = 0;
    const tick = (now: number) => {
      if (prev) setT((v) => Math.min(1, v + Math.min(now - prev, 80) / 7000));
      prev = now;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [play]);
  useEffect(() => {
    if (t >= 1) setPlay(false);
  }, [t]);
  return { t, setT, play, setPlay };
}
function TraceControls({ clock }: { clock: ReturnType<typeof useTrace> }) {
  const { T } = useApp();
  return (
    <div className="math-controls">
      <button
        onClick={() => {
          if (clock.t >= 1) clock.setT(0);
          clock.setPlay(!clock.play);
        }}
      >
        {clock.play
          ? T("Pause", "இடைநிறுத்து")
          : T("Animate / replay", "அசைவூட்டு / மீண்டும் இயக்கு")}
      </button>
      <button
        onClick={() => {
          clock.setPlay(false);
          clock.setT(0);
        }}
      >
        {T("Reset", "மீட்டமை")}
      </button>
      <Slider
        label={T("Trace progress", "வரையும் முன்னேற்றம்")}
        min={0}
        max={1}
        step={0.01}
        value={clock.t}
        onChange={(v) => {
          clock.setPlay(false);
          clock.setT(v);
        }}
      />
    </div>
  );
}
export function GraphLab({ kind }: { kind: string }) {
  return kind === "graph-transform" ? (
    <TransformLab />
  ) : kind === "graph-curves" ? (
    <CurveLab />
  ) : kind === "graph-motion" ? (
    <MotionLab />
  ) : (
    <LineLab />
  );
}
function LineLab() {
  const { T } = useApp();
  const [m, setM] = useState(1),
    [c, setC] = useState(0),
    [comparison, setComparison] = useState("none"),
    [triangle, setTriangle] = useState(true);
  const clock = useTrace();
  const bounds: [number, number, number, number] = [-8, 8, -8, 8],
    p = coordinates(bounds);
  const end = -8 + 16 * clock.t;
  const comparisonCurve =
    comparison === "parallel"
      ? sample((x) => m * x + c + 2, -8, 8)
      : m === 0
        ? ([
            [2, -8],
            [2, 8],
          ] as [number, number][])
        : sample((x) => -x / m + c, -8, 8);
  return (
    <div className="math-lab">
      <div className="math-preset-row">
        {linePresets.map(([a, b, label]) => (
          <button
            key={label}
            aria-pressed={m === a && c === b}
            onClick={() => {
              setM(a);
              setC(b);
              clock.setT(1);
              clock.setPlay(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="math-settings">
        <Slider
          label={T("Gradient m · படித்திறன்", "படித்திறன் m")}
          value={m}
          min={-3}
          max={3}
          onChange={setM}
        />
        <Slider
          label={T("Intercept c · வெட்டுத்துண்டு", "வெட்டுத்துண்டு c")}
          value={c}
          min={-7}
          max={7}
          onChange={setC}
        />
      </div>
      <GraphPlot
        bounds={bounds}
        label={T(
          "Straight line with slope triangle and intercept",
          "படித்திறன் முக்கோணமும் வெட்டுத்துண்டும் கொண்ட நேர்கோடு",
        )}
        curves={[
          { points: sample((x) => m * x + c, -8, end), color: blue },
          ...(comparison === "none"
            ? []
            : [{ points: comparisonCurve, color: pink, dashed: true }]),
        ]}
      >
        {triangle && (
          <g>
            <path
              d={`M${p.x(0)} ${p.y(c)}H${p.x(1)}V${p.y(m + c)}`}
              stroke={yellow}
              strokeWidth="2"
              fill="none"
              strokeDasharray="5 3"
            />
            <text
              x={p.x(0.5)}
              y={p.y(c) + (m >= 0 ? 24 : -12)}
              fill={yellow}
              textAnchor="middle"
            >
              Δx = 1
            </text>
            <text x={p.x(1) + 9} y={p.y(c + m / 2)} fill={yellow}>
              Δy = {m.toFixed(2)}
            </text>
          </g>
        )}
        <circle cx={p.x(0)} cy={p.y(c)} r="6" fill={green} />
        <circle cx={p.x(end)} cy={p.y(m * end + c)} r="5" fill={yellow} />
      </GraphPlot>
      <div className="math-readout">
        <strong>
          y = {m.toFixed(2)}x {c < 0 ? "−" : "+"} {Math.abs(c).toFixed(1)}
        </strong>
        <span>m = Δy/Δx = {m.toFixed(2)}</span>
        <span>
          {T("y-intercept", "y வெட்டுத்துண்டு")}: (0, {c})
        </span>
      </div>
      <div className="math-controls">
        <button aria-pressed={triangle} onClick={() => setTriangle(!triangle)}>
          {T("Slope triangle", "படித்திறன் முக்கோணம்")}
        </button>
        <label>
          {T("Compare lines", "நேர்கோடுகளை ஒப்பிடுக")}
          <select
            value={comparison}
            onChange={(e) => setComparison(e.target.value)}
          >
            <option value="none">{T("One line", "ஒரு நேர்கோடு")}</option>
            <option value="parallel">
              {T("Parallel: same gradient", "சமாந்தரம்: ஒரே படித்திறன்")}
            </option>
            <option value="perpendicular">
              {T(
                "Perpendicular: negative reciprocal",
                "செங்குத்து: எதிர்க் குறியுள்ள தலைகீழ்",
              )}
            </option>
          </select>
        </label>
      </div>
      {comparison === "perpendicular" && (
        <p className="math-insight">
          {m === 0
            ? T(
                "A horizontal line is perpendicular to a vertical line. The vertical gradient is undefined.",
                "கிடைக் கோட்டிற்கு நிலைக்குத்துக் கோடு செங்குத்தாகும். நிலைக்குத்துக் கோட்டின் படித்திறன் வரையறுக்கப்படாது.",
              )
            : `m₁ = ${m.toFixed(2)}, m₂ = ${(-1 / m).toFixed(2)}, m₁m₂ = −1`}
        </p>
      )}
      <TraceControls clock={clock} />
      <p className="math-note">
        {T(
          "Read gradient from coordinate changes. The drawn angle depends on the display scales; m = tan θ requires equal axis scales.",
          "படித்திறனைக் கூறுகளின் மாற்றத்திலிருந்து கணிக்கவும். தோன்றும் கோணம் அச்சுகளின் அளவுத்திட்டத்தில் தங்கியுள்ளது; m = tan θ என்பதற்கு சம அச்சு அளவுத்திட்டம் தேவை.",
        )}
      </p>
    </div>
  );
}
function CurveLab() {
  const { T } = useApp();
  const [kind, setKind] = useState("inverse"),
    [k, setK] = useState(4);
  const clock = useTrace();
  const presets = [
    ["inverse", "xy = k"],
    ["side", "y² = 5x"],
    ["parabola", "y = 3x²"],
    ["horizontal", "y = 5"],
    ["vertical", "x = 4"],
  ];
  const bounds: [number, number, number, number] = [-6, 6, -10, 10],
    p = coordinates(bounds);
  const lo = kind === "inverse" ? k / 10 : 0.0;
  const hi = kind === "parabola" ? Math.sqrt(10 / 3) : 6;
  const q = lo + (hi - lo) * clock.t;
  const curves =
    kind === "inverse"
      ? [sample((x) => k / x, -6, -0.2), sample((x) => k / x, 0.2, 6)]
      : kind === "side"
        ? [
            sample((x) => Math.sqrt(5 * x), 0, 6),
            sample((x) => -Math.sqrt(5 * x), 0, 6),
          ]
        : kind === "parabola"
          ? [sample((x) => 3 * x * x, -6, 6)]
          : kind === "horizontal"
            ? [sample(() => 5, -6, 6)]
            : [
                [
                  [4, -10],
                  [4, 10],
                ] as [number, number][],
              ];
  const xy =
    kind === "inverse"
      ? [q, k / q]
      : kind === "side"
        ? [q, Math.sqrt(5 * q)]
        : kind === "parabola"
          ? [q, 3 * q * q]
          : kind === "horizontal"
            ? [q, 5]
            : [4, -10 + 20 * clock.t];
  return (
    <div className="math-lab">
      <div className="math-preset-row">
        {presets.map(([key, name]) => (
          <button
            key={key}
            aria-pressed={kind === key}
            onClick={() => {
              setKind(key);
              clock.setT(0.4);
              clock.setPlay(false);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      {kind === "inverse" && (
        <Slider label="k" min={1} max={8} value={k} onChange={setK} />
      )}
      <GraphPlot
        bounds={bounds}
        label={T(
          "Curve explorer with moving coordinate point",
          "நகரும் புள்ளியுடன் வளைகோட்டு ஆய்வு",
        )}
        curves={curves.map((points, i) => ({ points, color: i ? pink : blue }))}
      >
        <path
          d={`M${p.x(xy[0])} ${p.y(0)}V${p.y(xy[1])}H${p.x(0)}`}
          stroke={yellow}
          fill="none"
          strokeDasharray="4 4"
        />
        <circle cx={p.x(xy[0])} cy={p.y(xy[1])} r="6" fill={yellow} />
      </GraphPlot>
      <div className="math-readout">
        <strong>
          (x, y) = ({xy[0].toFixed(2)}, {xy[1].toFixed(2)})
        </strong>
        {kind === "inverse" && <span>xy = {k}</span>}
      </div>
      <p className="math-insight">
        {kind === "inverse"
          ? T(
              "Rectangular hyperbola: x = 0 and y = 0 are asymptotes. For k > 0, there are branches in quadrants I and III. The graph never includes x = 0.",
              "செவ்வக அதிபரவளைவு: x = 0, y = 0 அணுகுகோடுகள். k > 0 எனில் முதலாம், மூன்றாம் கால்வட்டங்களில் கிளைகள் உண்டு. x = 0 வரைபில் இல்லை.",
            )
          : kind === "side"
            ? T(
                "y² = 5x has two branches: y = ±√(5x), with x ≥ 0. Selecting positive quantities in a physical problem keeps only the upper branch.",
                "y² = 5x இற்கு y = ±√(5x) என இரு கிளைகள் உண்டு; x ≥ 0. பௌதிகக் கணியங்கள் நேராக இருந்தால் மேல் கிளையை மட்டும் பயன்படுத்துக.",
              )
            : kind === "vertical"
              ? T(
                  "x stays 4 while y changes. Δx = 0, so the gradient is undefined, not zero.",
                  "y மாறினாலும் x = 4. Δx = 0 என்பதால் படித்திறன் வரையறுக்கப்படாது; பூச்சியம் அல்ல.",
                )
              : kind === "horizontal"
                ? T(
                    "y stays 5. Δy = 0, so the gradient is zero.",
                    "y = 5 ஆக மாறாது. Δy = 0; எனவே படித்திறன் பூச்சியம்.",
                  )
                : T(
                    "y = 3x² is an upward-opening parabola. Both positive and negative x give positive y.",
                    "y = 3x² மேல்நோக்கிய பரவளைவு. நேர், எதிர் x பெறுமதிகளுக்கு நேர் y பெறுமதிகள் கிடைக்கும்.",
                  )}
      </p>
      <TraceControls clock={clock} />
    </div>
  );
}
function TransformLab() {
  const { T } = useApp();
  const [family, setFamily] = useState<TransformFamily>("inverse"),
    [mode, setMode] = useState<TransformMode>("raw"),
    [k, setK] = useState(2),
    [probe, setProbe] = useState(1);
  const clock = useTrace();
  const details = transformation(family, mode, k);
  const values = Array.from({ length: 121 }, (_, i) =>
    transformSample(family, mode, 0.25 + (1.75 * i) / 120, k),
  );
  const xs = values.map((p) => p[0]),
    ys = values.map((p) => p[1]);
  const minX = Math.min(0, ...xs),
    maxX = Math.max(...xs),
    minY = Math.min(0, ...ys),
    maxY = Math.max(...ys);
  const bounds: [number, number, number, number] = [
    minX - 0.08 * (maxX - minX),
    maxX * 1.1,
    minY - 0.08 * (maxY - minY || 1),
    maxY + Math.max(0.2, (maxY - minY) * 0.15),
  ];
  const p = coordinates(bounds);
  const point = transformSample(family, mode, probe, k);
  return (
    <div className="math-lab">
      <div className="math-preset-row">
        {(["inverse", "direct", "cube", "quartic"] as TransformFamily[]).map(
          (f, i) => (
            <button
              key={f}
              aria-pressed={family === f}
              onClick={() => {
                setFamily(f);
                setK([2, 2, 2, 5][i]);
                clock.setT(1);
              }}
            >
              {["PV = k", "V/T = k", "y = 2x³", "y = 5x⁴"][i]}
            </button>
          ),
        )}
      </div>
      <div className="math-preset-row">
        {(["raw", "linear", "log", "constant"] as TransformMode[]).map(
          (m, i) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                clock.setT(1);
                clock.setPlay(false);
              }}
            >
              {
                [
                  T("Original axes", "மூல அச்சுகள்"),
                  T("Change horizontal axis", "கிடை அச்சை மாற்றுக"),
                  T("Log–log axes", "மடக்கை அச்சுகள்"),
                  T("Constant product / ratio", "மாறா பெருக்கம் / விகிதம்"),
                ][i]
              }
            </button>
          ),
        )}
      </div>
      <div className="math-settings">
        <Slider
          label="k"
          min={0.5}
          max={5}
          step={0.5}
          value={k}
          onChange={setK}
        />
        <Slider
          label={T("Track the same sample", "ஒரே புள்ளியைப் பின்தொடர்க")}
          value={probe}
          min={0.25}
          max={2}
          step={0.05}
          onChange={setProbe}
        />
      </div>
      <GraphPlot
        bounds={bounds}
        label={`${details.y} ${T("versus", "எதிர்")} ${details.x}`}
        xLabel={details.x}
        yLabel={details.y}
        curves={[
          {
            points: values.slice(
              0,
              Math.max(1, Math.ceil(clock.t * values.length)),
            ),
            color: blue,
          },
        ]}
      >
        <circle cx={p.x(point[0])} cy={p.y(point[1])} r="6" fill={yellow} />
      </GraphPlot>
      <div className="math-readout">
        <strong>{details.formula}</strong>
        <span>
          {T("Selected point", "தெரிவுசெய்த புள்ளி")}: ({point[0].toFixed(2)},{" "}
          {point[1].toFixed(2)})
        </span>
        <span>
          {details.slope === null
            ? T("Curve: gradient varies", "வளைகோடு: படித்திறன் மாறும்")
            : `${T("Gradient", "படித்திறன்")} = ${details.slope}`}
        </span>
      </div>
      <p className="math-insight">
        {mode === "log"
          ? T(
              "Logarithms turn a power into a gradient. Both inputs must be positive. Logs use numerical values in fixed reference units; changing those units changes the intercept, not the power.",
              "மடக்கை மூலம் அடுக்கு படித்திறனாக மாறும். இரு உள்ளீடுகளும் நேராக இருக்க வேண்டும். நிலையான குறிப்பலகுகளில் உள்ள எண் பெறுமதிகளுக்கு மடக்கை எடுக்கப்படுகிறது; அலகை மாற்றினால் வெட்டுத்துண்டு மாறும், அடுக்கு மாறாது.",
            )
          : family === "direct" && mode === "linear"
            ? T(
                "Since V = kT, plotting V against 1/T gives an inverse curve—not a straight line. For gas-volume applications, T must be absolute temperature in kelvin.",
                "V = kT என்பதால் V எதிர் 1/T வரைபு செவ்வக அதிபரவளைவு; நேர்கோடு அல்ல. வாயுக் கனவளவிற்கு T கெல்வினில் தனி வெப்பநிலையாக இருக்க வேண்டும்.",
              )
            : T(
                "The yellow point is the same observation in different coordinates. Read the axis labels before identifying a gradient or intercept.",
                "மஞ்சள் புள்ளி வெவ்வேறு அச்சுகளில் அதே அளவீட்டைக் குறிக்கிறது. படித்திறன் அல்லது வெட்டுத்துண்டைக் காணுமுன் அச்சுப் பெயர்களை வாசிக்கவும்.",
              )}
      </p>
      <TraceControls clock={clock} />
    </div>
  );
}
function MotionLab() {
  const { T } = useApp();
  const [u, setU] = useState(4),
    [a, setA] = useState(-1);
  const clock = useTrace();
  const t = clock.t * 8;
  const state = motionAt(u, a, t);
  const bounds: [number, number, number, number] = [0, 8, -24, 24],
    p = coordinates(bounds);
  const split = state.turn > 0 && state.turn < t ? [0, state.turn, t] : [0, t];
  return (
    <div className="math-lab">
      <div className="math-preset-row">
        {[
          [4, 0],
          [0, 2],
          [4, -1],
        ].map(([v, b], i) => (
          <button
            key={i}
            onClick={() => {
              setU(v);
              setA(b);
              clock.setT(0);
              clock.setPlay(false);
            }}
          >
            {
              [
                T("Constant velocity", "மாறா வேகம்"),
                T("Accelerate", "ஆர்முடுகு"),
                T("Stop and reverse", "நிறுத்தித் திரும்பு"),
              ][i]
            }
          </button>
        ))}
      </div>
      <div className="math-settings">
        <Slider
          label={T("Initial velocity u (m/s)", "ஆரம்ப வேகம் u (m/s)")}
          value={u}
          min={-8}
          max={8}
          onChange={setU}
        />
        <Slider
          label={T("Acceleration a (m/s²)", "ஆர்முடுகல் a (m/s²)")}
          value={a}
          min={-2}
          max={2}
          step={0.25}
          onChange={setA}
        />
      </div>
      <GraphPlot
        bounds={bounds}
        xLabel="t (s)"
        yLabel="v (m/s)"
        label={T(
          "Velocity–time graph: signed area and moving point",
          "வேகம்–நேர வரைபு: குறியுள்ள பரப்பும் நகரும் புள்ளியும்",
        )}
        curves={[{ points: sample((x) => u + a * x, 0, 8), color: blue }]}
      >
        {split.slice(1).map((end, i) => {
          const start = split[i],
            positive = u + (a * (start + end)) / 2 >= 0;
          return (
            <polygon
              key={i}
              points={`${p.x(start)},${p.y(0)} ${p.x(start)},${p.y(u + a * start)} ${p.x(end)},${p.y(u + a * end)} ${p.x(end)},${p.y(0)}`}
              fill={positive ? green : pink}
              opacity=".3"
            />
          );
        })}
        <line
          x1={p.x(t)}
          x2={p.x(t)}
          y1={p.y(0)}
          y2={p.y(state.velocity)}
          stroke={yellow}
          strokeDasharray="5 4"
        />
        <circle cx={p.x(t)} cy={p.y(state.velocity)} r="6" fill={yellow} />
      </GraphPlot>
      <svg
        className="math-track"
        viewBox="0 0 660 115"
        role="img"
        aria-label={T("Position along a straight track", "நேர்ப்பாதையில் நிலை")}
      >
        <path d="M35 55H625" stroke="#63758a" />
        {[-128, 0, 128].map((n) => (
          <g key={n}>
            <path d={`M${330 + n * 2.2} 49v12`} stroke="white" />
            <text x={330 + n * 2.2} y="87" textAnchor="middle">
              {n} m
            </text>
          </g>
        ))}
        <circle
          cx={330 + state.displacement * 2.2}
          cy="55"
          r="11"
          fill={yellow}
        />
        <text x="35" y="23">
          {T("Position x₀ = 0", "ஆரம்ப நிலை x₀ = 0")}
        </text>
      </svg>
      <div className="math-readout">
        <span>t = {t.toFixed(2)} s</span>
        <span>v = {state.velocity.toFixed(2)} m/s</span>
        <span>
          {T("Gradient", "படித்திறன்")}: {a} m/s²
        </span>
        <strong>
          {T("Displacement", "இடப்பெயர்ச்சி")}: {state.displacement.toFixed(2)}{" "}
          m
        </strong>
        <strong>
          {T("Distance", "தூரம்")}: {state.distance.toFixed(2)} m
        </strong>
      </div>
      <TraceControls clock={clock} />
      <p className="math-insight">
        {T(
          "Green area adds displacement; red area subtracts it. Distance adds both absolute areas. A negative velocity means motion in the negative direction—not necessarily slowing down. This model assumes constant acceleration.",
          "பச்சைப் பரப்பு இடப்பெயர்ச்சியைக் கூட்டும்; சிவப்புப் பரப்பு கழிக்கும். இரு பரப்புகளின் தனிப் பெறுமதிகளைக் கூட்டினால் தூரம் கிடைக்கும். எதிர் வேகம் எதிர்த் திசை இயக்கத்தைக் குறிக்கும்; எப்போதும் கதி குறைவதைக் குறிக்காது. இம்மாதிரியில் ஆர்முடுகல் மாறாது.",
        )}
      </p>
    </div>
  );
}
