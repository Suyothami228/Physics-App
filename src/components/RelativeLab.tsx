import { useEffect, useState, useId, lazy, Suspense } from "react";
const RelativeScene = lazy(() => import("./RelativeScene"));
import { useApp } from "../state";
import {
  relative,
  river,
  upstreamAngle,
  type Velocity,
} from "../domain/relative";
import "../styles/graphs.css";
import "../styles/relative.css";

function Range({
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
  onChange: (n: number) => void;
}) {
  return (
    <label className="math-slider">
      {label} <output>{value.toFixed(1)}</output>
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
export function RelativeLab({ kind }: { kind: string }) {
  const { T } = useApp(),
    id = useId().replace(/:/g, "");
  const boat = kind === "relative-river";
  const [a, setA] = useState<Velocity>([30, 0]),
    [b, setB] = useState<Velocity>([18, 0]);
  const [frame, setFrame] = useState("E"),
    [unit, setUnit] = useState("m/s");
  const [speed, setSpeed] = useState(5),
    [current, setCurrent] = useState(3),
    [width, setWidth] = useState(1200),
    [angle, setAngle] = useState(0);
  const [p, setP] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 80) : 0;
      last = now;
      setP((v) => Math.min(1, v + dt / 10000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  useEffect(() => {
    if (p >= 1) setPlaying(false);
  }, [p]);
  const reset = () => {
    setP(0);
    setPlaying(false);
  };
  const change = (fn: () => void) => {
    reset();
    fn();
  };
  const r = relative(a, b),
    observer: Velocity = frame === "A" ? a : frame === "B" ? b : [0, 0];
  const av = relative(a, observer),
    bv = relative(b, observer);
  const water = river(speed, current, width, angle),
    straight = upstreamAngle(speed, current);
  const arrow = (
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: string,
    label: string,
  ) => (
    <g>
      <line
        x1={x}
        y1={y}
        x2={x + dx}
        y2={y - dy}
        stroke={color}
        strokeWidth="3"
        markerEnd={`url(#${id})`}
      />
      <title>{label}</title>
    </g>
  );
  const presets = [
    ["30 → / 18 →", [30, 0], [18, 0], "m/s"],
    ["40 ↑ / 12 ↓", [0, 40], [0, -12], "m/s"],
    ["12 → / 11 ←", [12, 0], [-11, 0], "m/s"],
    ["12 ↑ / 7 ↑", [0, 12], [0, 7], "km/h"],
    ["10 ↑ / 10 →", [0, 10], [10, 0], "km/h"],
    ["8 ↓ / 8 →", [0, -8], [8, 0], "km/h"],
  ] as const;
  const scale = boat
    ? Math.min(500 / Math.max(width, Math.abs(water.drift), 1), 260 / width)
    : 65 /
      Math.max(15, ...a.map(Math.abs), ...b.map(Math.abs), ...r.map(Math.abs));
  const elapsed = boat ? water.time * p : 5 * p;
  const startX = 150 - Math.min(0, water.drift * scale);
  return (
    <div className="math-lab">
      <p>
        {T(
          "Press Play to watch the 3D boats move. Pause or scrub time to examine any moment.",
          "முப்பரிமாணக் கப்பல்களின் இயக்கத்தைக் காண இயக்குக பொத்தானை அழுத்துக. நிறுத்தி அல்லது நேரத்தை மாற்றி ஒவ்வொரு நிலையையும் ஆராய்க.",
        )}
      </p>
      <div className="math-preset-row relative-playbar">
        <button
          onClick={() => {
            if (p >= 1) setP(0);
            setPlaying(!playing);
          }}
        >
          {playing ? T("Pause", "நிறுத்துக") : T("Play", "இயக்குக")}
        </button>
        <button onClick={reset}>{T("Reset", "மீட்டமை")}</button>
      </div>
      <Range
        label={T("Time progress", "நேர முன்னேற்றம்")}
        value={p}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => {
          setPlaying(false);
          setP(v);
        }}
      />
      <Suspense
        fallback={
          <p role="status">
            {T("Loading 3D scene…", "முப்பரிமாணக் காட்சி ஏற்றப்படுகிறது…")}
          </p>
        }
      >
        <RelativeScene
          boat={boat}
          a={a}
          b={b}
          observer={observer}
          p={p}
          angle={angle}
          width={width}
          current={current}
          time={water.time}
          drift={water.drift}
        />
      </Suspense>
      <p>
        <strong>
          t = {elapsed.toFixed(1)} {boat || unit === "m/s" ? "s" : "h"}
        </strong>{" "}
        ·{" "}
        {T("Time-compressed simulation", "நேரம் சுருக்கப்பட்ட உருவகப்படுத்தல்")}
      </p>

      {!boat ? (
        <>
          <div className="math-preset-row">
            {presets.map(([label, x, y, u]) => (
              <button
                key={label}
                onClick={() =>
                  change(() => {
                    setA([...x]);
                    setB([...y]);
                    setUnit(u);
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
          <p>
            {T(
              "East is +x; north is +y. Velocities below are relative to Earth E. Ships move in separate lanes; this is a frame demonstration, not a collision model.",
              "கிழக்கு +x; வடக்கு +y. கீழுள்ள வேகங்கள் பூமி E சார்பானவை. கப்பல்கள் வெவ்வேறு பாதைகளில் செல்கின்றன; இது மோதல் மாதிரி அல்ல.",
            )}
          </p>
          <div className="math-settings">
            {(["A", "B"] as const).map((name) => (
              <div key={name}>
                {[0, 1].map((axis) => (
                  <Range
                    key={axis}
                    label={`${name}: ${axis ? "y ↑" : "x →"} (${unit})`}
                    value={(name === "A" ? a : b)[axis]}
                    min={-40}
                    max={40}
                    onChange={(n) =>
                      change(() => {
                        const next: Velocity = [...(name === "A" ? a : b)];
                        next[axis] = n;
                        (name === "A" ? setA : setB)(next);
                      })
                    }
                  />
                ))}
              </div>
            ))}
          </div>
          <label>
            {T("Observer", "நோக்குநர்")}{" "}
            <select
              aria-label={T("Observer", "நோக்குநர்")}
              value={frame}
              onChange={(e) => setFrame(e.target.value)}
            >
              <option value="E">{T("Earth E", "பூமி E")}</option>
              <option value="A">{T("Ship A", "கப்பல் A")}</option>
              <option value="B">{T("Ship B", "கப்பல் B")}</option>
            </select>
          </label>
        </>
      ) : (
        <>
          <div className="math-preset-row">
            <button onClick={() => change(() => setAngle(0))}>
              {T("Shortest time", "மிகக் குறைந்த நேரம்")}
            </button>
            <button
              disabled={straight === null}
              onClick={() => change(() => setAngle(straight!))}
            >
              {T("Land directly opposite", "நேர் எதிரே அடைதல்")}
            </button>
          </div>
          <div className="math-controls">
            <Range
              label={T(
                "Boat relative to water (m/s)",
                "நீர் சார்பான வள்ளத்தின் கதி (m/s)",
              )}
              value={speed}
              min={1}
              max={10}
              onChange={(v) => change(() => setSpeed(v))}
            />
            <Range
              label={T("River current (m/s)", "ஆற்றின் கதி (m/s)")}
              value={current}
              min={0}
              max={8}
              onChange={(v) => change(() => setCurrent(v))}
            />
            <Range
              label={T("River width (m)", "ஆற்றின் அகலம் (m)")}
              value={width}
              min={100}
              max={1600}
              step={100}
              onChange={(v) => change(() => setWidth(v))}
            />
            <Range
              label={T(
                "Upstream angle from across (°)",
                "கரைக்குச் செங்குத்திலிருந்து எதிரோட்டக் கோணம் (°)",
              )}
              value={angle}
              min={-75}
              max={75}
              step={0.1}
              onChange={(v) => change(() => setAngle(v))}
            />
          </div>
          {straight === null && (
            <p role="status">
              {T(
                "Directly opposite is unreachable in finite time when current ≥ boat speed. You can still cross with downstream drift.",
                "ஆற்றின் கதி வள்ளத்தின் கதிக்குச் சமம் அல்லது அதிகம் எனில் முடிவுள்ள நேரத்தில் நேர் எதிரே அடைய முடியாது. கீழோட்டமாக விலகி மறுகரையை அடையலாம்.",
              )}
            </p>
          )}
        </>
      )}
      <details>
        <summary>
          {T("Show 2D vector diagram", "இருபரிமாணக் காவி வரைபைக் காண்க")}
        </summary>
        <div
          className="relative-stage"
          tabIndex={0}
          aria-label={T(
            "Simulation diagram; scroll horizontally on small screens",
            "உருவகப்படுத்தல் வரைபு; சிறிய திரையில் கிடையாக நகர்த்துக",
          )}
        >
          <svg
            className="math-plot"
            viewBox="0 0 760 460"
            role="img"
            aria-label={
              boat
                ? T(
                    "Boat crossing with water and ground velocity vectors",
                    "நீரோட்டமும் வள்ளத்தின் வேகக் காவிகளும்",
                  )
                : T(
                    "Ships viewed from selected observer",
                    "தெரிவுசெய்த நோக்குநரிலிருந்து கப்பல்களின் இயக்கம்",
                  )
            }
          >
            <defs>
              <marker
                id={id}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10z" fill="context-stroke" />
              </marker>
            </defs>
            {boat ? (
              <>
                <rect
                  x="40"
                  y={360 - width * scale}
                  width="670"
                  height={width * scale}
                  fill="#123f56"
                />
                <path
                  d={`M40 360H710 M40 ${360 - width * scale}H710`}
                  stroke="#83c167"
                  strokeWidth="5"
                />
                <line
                  x1={startX}
                  y1="360"
                  x2={startX}
                  y2={360 - width * scale}
                  stroke="#b6c6dc"
                  strokeDasharray="5 6"
                />
                <path
                  d={`M${startX} 360 L${startX + water.drift * scale} ${360 - width * scale}`}
                  stroke="#ffff00"
                  strokeDasharray="6 5"
                  fill="none"
                />
                <g
                  transform={`translate(${startX + water.x * elapsed * scale},${360 - water.y * elapsed * scale}) rotate(${-angle})`}
                >
                  <path d="M0 -19 Q22 0 0 19 Q-22 0 0 -19" fill="#ffff00" />
                  <path d="M-7 0H7" stroke="#10141e" strokeWidth="3" />
                </g>
                <text x="45" y="390">
                  {T("Width", "அகலம்")}: {width} m
                </text>
                <text x="45" y="420">
                  t = {elapsed.toFixed(1)} s
                </text>
                {arrow(540, 330, current * 12, 0, "#fc8c8c", "V_WE")}
                {arrow(
                  540,
                  330,
                  -speed * Math.sin((angle * Math.PI) / 180) * 12,
                  speed * Math.cos((angle * Math.PI) / 180) * 12,
                  "#58c4dd",
                  "V_BW",
                )}
                {arrow(540, 330, water.x * 12, water.y * 12, "#ffff00", "V_BE")}
              </>
            ) : (
              <>
                <text x="25" y="30">
                  {T("Position view", "நிலைத் தோற்றம்")} · {frame} · t ={" "}
                  {(5 * p).toFixed(1)} {unit === "m/s" ? "s" : "h"}
                </text>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1={80 + i * 140 - observer[0] * 5 * p * 0.2}
                    y1="55"
                    x2={80 + i * 140 - observer[0] * 5 * p * 0.2}
                    y2="255"
                    stroke="#273547"
                  />
                ))}
                {(
                  [
                    ["A", av, 155, "#58c4dd"],
                    ["B", bv, 155, "#fc8c8c"],
                  ] as const
                ).map(([name, v, y, color]) => (
                  <g
                    key={name}
                    transform={`translate(${(name === "A" ? 260 : 490) + v[0] * 5 * p * 0.2},${y - v[1] * 5 * p * 0.2})`}
                  >
                    <path d="M-24 0H24L15 12H-15Z" fill={color} />
                    <path d="M-10 0V-17H7V0" fill={color} />
                    <text y="33" textAnchor="middle">
                      {name}
                    </text>
                  </g>
                ))}
                <text x="25" y="280">
                  {T(
                    "Velocity triangle: subtract B, then add",
                    "வேகக் காவிகள்: B ஐக் கழித்துக் கூட்டுக",
                  )}{" "}
                  ({unit})
                </text>
                {arrow(350, 365, a[0] * scale, a[1] * scale, "#58c4dd", "V_AE")}
                {arrow(
                  350 + a[0] * scale,
                  365 - a[1] * scale,
                  -b[0] * scale,
                  -b[1] * scale,
                  "#fc8c8c",
                  "−V_BE",
                )}
                {arrow(350, 365, r[0] * scale, r[1] * scale, "#ffff00", "V_AB")}
              </>
            )}
          </svg>
        </div>
      </details>
      <p>
        {boat
          ? T(
              "Cyan: boat relative to water · Coral: current · Yellow: boat relative to Earth. W = water, B = boat, E = Earth.",
              "நீலம்: நீர் சார்பான வள்ளம் · பவளம்: நீரோட்டம் · மஞ்சள்: பூமி சார்பான வள்ளம். W = நீர், B = வள்ளம், E = பூமி.",
            )
          : T(
              "Cyan: V_AE · Coral: −V_BE · Yellow: V_AB. The lower arrows are velocity vectors; the upper ships show position.",
              "நீலம்: V_AE · பவளம்: −V_BE · மஞ்சள்: V_AB. கீழுள்ள அம்புகள் வேகக் காவிகள்; மேலுள்ள கப்பல்கள் நிலையைக் காட்டுகின்றன.",
            )}
      </p>
      <div className="math-readout">
        {boat ? (
          <>
            <strong>
              V_BE = ({water.x.toFixed(2)}, {water.y.toFixed(2)}) m/s
            </strong>
            <span>
              {T("Crossing time", "கடக்கும் நேரம்")}: {water.time.toFixed(1)} s
            </span>
            <span>
              {T("Downstream drift", "கீழோட்ட இடப்பெயர்ச்சி")}:{" "}
              {water.drift.toFixed(1)} m
            </span>
          </>
        ) : (
          <>
            <strong>
              V_AB = ({r[0]}, {r[1]}) {unit}
            </strong>
            <span>
              |V_AB| = {Math.hypot(...r).toFixed(2)} {unit}
            </span>
            <span>
              V_A{frame} = ({av.join(", ")}) · V_B{frame} = ({bv.join(", ")})
            </span>
          </>
        )}
      </div>
      <p>
        {T(
          "Playback is time-compressed. Read the labelled time and numerical values; the objects are not drawn to physical size.",
          "அசைவூட்டத்தில் நேரம் சுருக்கப்பட்டுள்ளது. காட்டப்படும் நேரத்தையும் எண் பெறுமதிகளையும் வாசிக்கவும்; பொருட்கள் உண்மை அளவில் வரையப்படவில்லை.",
        )}
      </p>
    </div>
  );
}
