import { VectorText } from "./VectorText";
import { useEffect, useId, useRef, useState } from "react";
import { useApp } from "../state";
import { quantities, resultant, vectorPaths } from "../domain/vectors";
import "../styles/vectors.css";

export function VectorLab({ kind }: { kind: string }) {
  if (kind === "vector-sort") return <SortLab />;
  if (kind === "vector-paths") return <PathLab />;
  return <AdditionLab />;
}
function SortLab() {
  const { T } = useApp();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const item = quantities[index];
  return (
    <div className="vector-lab">
      <div className="vector-sort-card">
        <span>
          {index + 1} / {quantities.length}
        </span>
        <h3>{T(item[0], item[1])}</h3>
        <p>
          {T(
            "Does this quantity require a spatial direction?",
            "இக்கணியத்திற்கு வெளிசார் திசை தேவையா?",
          )}
        </p>
        <div className="vector-actions">
          <button onClick={() => setAnswer(true)}>{T("Vector", "காவி")}</button>
          <button onClick={() => setAnswer(false)}>
            {T("Scalar", "எண்ணி")}
          </button>
        </div>
        {answer !== null && (
          <p
            role="status"
            className={
              answer === item[2] ? "vector-correct" : "vector-incorrect"
            }
          >
            {answer === item[2]
              ? T("Correct.", "சரி.")
              : T(
                  "Try the distinction again.",
                  "வேறுபாட்டை மீண்டும் சிந்திக்கவும்.",
                )}{" "}
            {item[2]
              ? T(
                  "A vector has magnitude and direction and follows vector addition.",
                  "காவிக்கு பருமனும் திசையும் உண்டு; அது காவிக் கூட்டல் விதிகளைப் பின்பற்றும்.",
                )
              : T(
                  "This is a scalar: its value does not specify a spatial direction. A sign or a name containing “force” does not make it a vector.",
                  "இது எண்ணி; இதன் பெறுமதி வெளிசார் திசையைக் குறிக்காது. ஒரு குறியோ பெயரில் “விசை” என்பதோ மட்டும் இதைக் காவியாக்காது.",
                )}
          </p>
        )}
        <button
          className="btn btn-blue"
          onClick={() => {
            setIndex((index + 1) % quantities.length);
            setAnswer(null);
          }}
        >
          {T("Next quantity →", "அடுத்த கணியம் →")}
        </button>
      </div>
      <details>
        <summary>
          {T("Explore all 26 examples", "26 எடுத்துக்காட்டுகளையும் ஆராய்க")}
        </summary>
        <div className="vector-gallery">
          {quantities.map((q, i) => (
            <button
              key={q[0]}
              aria-pressed={index === i}
              onClick={() => {
                setIndex(i);
                setAnswer(null);
              }}
            >
              {T(q[0], q[1])}
            </button>
          ))}
        </div>
      </details>
      <p>
        {T(
          "Electric current is a scalar although a reference direction sets its sign. Current density is a vector. Electromotive force is a potential difference, not a mechanical force. Area here means ordinary scalar area, not a directed area vector.",
          "மின்னோட்டத்தின் குறியை ஒரு குறிப்புத் திசை நிர்ணயித்தாலும் அது எண்ணி; மின்னோட்ட அடர்த்தி காவி. மின்னியக்கவிசை ஒரு அழுத்த வேறுபாடு; பொறியியல் விசை அல்ல. இங்கு பரப்பு என்பது சாதாரண எண்ணிப் பரப்பு; திசையுள்ள பரப்புக் காவி அல்ல.",
        )}
      </p>
    </div>
  );
}
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  label,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label?: string;
  dashed?: boolean;
}) {
  const id = useId();
  const zero = Math.hypot(x2 - x1, y2 - y1) < 0.01;
  return (
    <g>
      <defs>
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" fill={color} />
        </marker>
      </defs>
      {!zero && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={dashed ? "6 5" : undefined}
          markerEnd={`url(#${id})`}
        />
      )}
      {label && (
        <text x={(x1 + x2) / 2 + 8} y={(y1 + y2) / 2 - 10} fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}
function AdditionLab() {
  const { T } = useApp();
  const [a, setA] = useState(4),
    [b, setB] = useState(3),
    [angle, setAngle] = useState(90),
    [subtract, setSubtract] = useState(false),
    [tail, setTail] = useState(true),
    [moving, setMoving] = useState(false);
  const r = resultant(a, b, angle, subtract);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!moving) return;
    const id = setInterval(() => setAngle((v) => (v + 1) % 360), 55);
    return () => clearInterval(id);
  }, [moving]);
  const ox = 250,
    oy = 245,
    scale = 21;
  const endX = ox + r.x * scale,
    endY = oy - r.y * scale;
  function drag(e: React.PointerEvent<SVGCircleElement>) {
    if (
      e.type === "pointermove" &&
      !e.currentTarget.hasPointerCapture(e.pointerId)
    )
      return;
    if (e.type === "pointerdown") {
      e.currentTarget.setPointerCapture(e.pointerId);
      setMoving(false);
    }
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    const dx = (p.x - ox - (tail ? a * scale : 0)) / scale,
      dy = (oy - p.y) / scale;
    setB(Math.min(8, Math.max(0, Math.round(Math.hypot(dx, dy) * 10) / 10)));
    setAngle(
      (Math.round((Math.atan2(dy, dx) * 180) / Math.PI) +
        (subtract ? 180 : 0) +
        360) %
        360,
    );
  }
  return (
    <div className="vector-lab">
      <p>
        {T(
          "Drag the orange tip, or use the sliders. All arrows represent displacements in metres. Blue A points east; the angle of B is measured anticlockwise from east.",
          "செம்மஞ்சள் அம்பின் முனையை இழுக்கவும் அல்லது சறுக்கிகளைப் பயன்படுத்தவும். எல்லா அம்புகளும் மீற்றரில் இடப்பெயர்ச்சிகள். நீல A கிழக்கு நோக்கியது; B இன் கோணம் கிழக்கிலிருந்து எதிர்மணிக்கூட்டுத் திசையில் அளக்கப்படுகிறது.",
        )}
      </p>
      <div className="vector-actions">
        <button aria-pressed={tail} onClick={() => setTail(!tail)}>
          {tail
            ? T("Head-to-tail view", "முடிவு–ஆரம்ப இணைப்பு")
            : T("Common-origin view", "பொது ஆரம்பப் புள்ளி")}
        </button>
        <button aria-pressed={subtract} onClick={() => setSubtract(!subtract)}>
          {subtract ? "A − B" : "A + B"}
        </button>
        <button aria-pressed={moving} onClick={() => setMoving(!moving)}>
          {moving
            ? T("Pause rotation", "சுழற்சியை நிறுத்து")
            : T("Animate direction", "திசையை அசைவூட்டு")}
        </button>
        <button
          onClick={() => {
            setA(4);
            setB(3);
            setAngle(90);
            setSubtract(false);
            setMoving(false);
          }}
        >
          {T("Reset 3–4–5", "3–4–5 மீட்டமை")}
        </button>
      </div>
      <div className="vector-sliders">
        {[
          [T("|A| (m)", "|A| (m)"), a, setA, 8],
          [T("|B| (m)", "|B| (m)"), b, setB, 8],
          [T("Angle θ (°)", "கோணம் θ (°)"), angle, setAngle, 359],
        ].map(([label, value, update, max]) => (
          <label key={String(label)}>
            {String(label)} · {Number(value).toFixed(1)}
            <input
              type="range"
              min="0"
              max={Number(max)}
              step={max === 359 ? 1 : 0.1}
              value={Number(value)}
              onChange={(e) => {
                setMoving(false);
                (update as (n: number) => void)(+e.target.value);
              }}
            />
          </label>
        ))}
      </div>
      <svg
        ref={svg}
        className="vector-board"
        viewBox="0 0 660 470"
        role="img"
        aria-label={T(
          "Interactive displacement vector addition diagram",
          "இடப்பெயர்ச்சிக் காவிக் கூட்டலின் ஊடாடும் வரைபடம்",
        )}
      >
        {Array.from({ length: 15 }, (_, i) => (
          <path
            key={i}
            d={`M${40 + i * 42} 25V445M20 ${35 + i * 28}H640`}
            stroke="#294666"
            strokeWidth="1"
          />
        ))}
        <path d={`M20 ${oy}H635M${ox} 25V445`} stroke="#7892b0" />
        <text x="605" y={oy - 10}>
          +x
        </text>
        <text x={ox + 10} y="40">
          +y
        </text>
        <Arrow
          x1={ox}
          y1={oy}
          x2={ox + a * scale}
          y2={oy}
          color="#74b4ff"
          label="A"
        />
        <Arrow
          x1={ox + (tail ? a * scale : 0)}
          y1={oy}
          x2={ox + (tail ? a * scale : 0) + r.bx * scale}
          y2={oy - r.by * scale}
          color="#ffb283"
          label={subtract ? "−B" : "B"}
        />
        {!tail && (
          <Arrow
            x1={ox + a * scale}
            y1={oy}
            x2={endX}
            y2={endY}
            color="#ffb283"
            dashed
          />
        )}
        <Arrow x1={ox} y1={oy} x2={endX} y2={endY} color="#aeec79" label="R" />
        <circle
          cx={ox + (tail ? a * scale : 0) + r.bx * scale}
          cy={oy - r.by * scale}
          r="14"
          fill="#ffb283"
          stroke="white"
          strokeWidth="2"
          style={{ touchAction: "none", cursor: "grab" }}
          onPointerDown={drag}
          onPointerMove={drag}
        />
      </svg>
      <div className="vector-readouts">
        <div>
          Rₓ<strong>{r.x.toFixed(2)} m</strong>
        </div>
        <div>
          Rᵧ<strong>{r.y.toFixed(2)} m</strong>
        </div>
        <div>
          |R|<strong>{r.magnitude.toFixed(2)} m</strong>
        </div>
        <div>
          {T("Direction from +x", "+x இலிருந்து திசை")}
          <strong>
            {r.direction === null
              ? T(
                  "Undefined (zero vector)",
                  "வரையறுக்கப்படாது (பூச்சியக் காவி)",
                )
              : `${r.direction.toFixed(1)}°`}
          </strong>
        </div>
      </div>
      <p className="vector-note">
        {T(
          "Try θ = 0°, 90°, 180°. Equal opposite vectors cancel. Subtraction reverses B before adding; it does not simply subtract arrow lengths. A zero vector has no defined direction.",
          "θ = 0°, 90°, 180° ஐ முயல்க. சம பருமனுள்ள எதிர்க் காவிகள் நீங்கும். கழித்தலில் B இன் திசையைத் திருப்பிக் கூட்ட வேண்டும்; அம்புகளின் நீளங்களை மட்டும் கழிக்கக் கூடாது. பூச்சியக் காவிக்குத் திசை வரையறுக்கப்படாது.",
        )}
      </p>
    </div>
  );
}
function PathLab() {
  const { T } = useApp();
  const [index, setIndex] = useState(0),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [show, setShow] = useState(false);
  const p = vectorPaths[index];
  const edges = p.paths.flatMap((path, group) =>
    path.slice(1).map((to, i) => ({ from: path[i], to, group })),
  );
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () => setStep((s) => Math.min(edges.length, s + 1)),
      900,
    );
    return () => clearInterval(id);
  }, [playing, edges.length]);
  useEffect(() => {
    if (step === edges.length) setPlaying(false);
  }, [step, edges.length]);
  const coords = Object.values(p.points),
    xs = coords.map((v) => v[0]),
    ys = coords.map((v) => v[1]);
  const minx = Math.min(...xs),
    maxx = Math.max(...xs),
    miny = Math.min(...ys),
    maxy = Math.max(...ys);
  const scale = Math.min(
    470 / Math.max(maxx - minx, 1),
    290 / Math.max(maxy - miny, 1),
  );
  const xy = (name: string) => [
    70 + (p.points[name][0] - minx) * scale,
    350 - (p.points[name][1] - miny) * scale,
  ];
  const colors = ["#83b8ff", "#ffb283", "#d0a5ff"];
  return (
    <div className="vector-lab">
      <label>
        {T("Choose a reference example", "மேற்கோள் எடுத்துக்காட்டைத் தேர்க")}
        <select
          value={index}
          onChange={(e) => {
            setIndex(+e.target.value);
            setStep(0);
            setShow(false);
            setPlaying(false);
          }}
        >
          {vectorPaths.map((v, i) => (
            <option value={i} key={v.en}>
              {T(v.en, v.ta)}
            </option>
          ))}
        </select>
      </label>
      <svg
        className="vector-board"
        viewBox="0 0 650 420"
        role="img"
        aria-label={T(p.en, p.ta)}
      >
        {edges.map((e, i) => {
          const a = xy(e.from),
            b = xy(e.to);
          return (
            <g opacity={i < step ? 1 : 0.18} key={i}>
              <Arrow
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                color={colors[e.group]}
              />
            </g>
          );
        })}
        {show &&
          p.paths.map((path, i) => {
            const a = xy(path[0]),
              b = xy(path[path.length - 1]);
            return (
              <Arrow
                key={i}
                x1={a[0]}
                y1={a[1] - i * 5}
                x2={b[0]}
                y2={b[1] - i * 5}
                color="#aeec79"
                dashed
              />
            );
          })}
        {Object.keys(p.points).map((name) => {
          const q = xy(name);
          return (
            <g key={name}>
              <circle cx={q[0]} cy={q[1]} r="4" fill="white" />
              <text x={q[0] - 15} y={q[1] + 22}>
                {name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="vector-actions">
        <button
          onClick={() => {
            if (step === edges.length) setStep(0);
            setPlaying(!playing);
          }}
        >
          {playing
            ? T("Pause", "இடைநிறுத்து")
            : T("Trace the arrows", "அம்புகளைப் பின்தொடர்")}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep(Math.min(step + 1, edges.length));
          }}
        >
          {T("Next arrow", "அடுத்த அம்பு")} ({step}/{edges.length})
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep(0);
            setShow(false);
          }}
        >
          {T("Reset", "மீட்டமை")}
        </button>
        <button aria-pressed={show} onClick={() => setShow(!show)}>
          {show
            ? T("Hide reasoning", "விளக்கத்தை மறை")
            : T("Reveal reasoning", "விளக்கத்தைக் காட்டு")}
        </button>
      </div>
      {show && (
        <div className="vector-note" role="status">
          <strong><VectorText text={p.formula} /></strong>
          <p>{T(p.noteEn, p.noteTa)}</p>
        </div>
      )}
      <p>
        {T(
          "Blue, orange and purple identify separate paths. Green dashed arrows show each path’s net displacement, not extra arrows to add. Diagrams are schematic.",
          "நீலம், செம்மஞ்சள், ஊதா தனித்தனிப் பாதைகளைக் குறிக்கின்றன. பச்சைத் துண்டு அம்புகள் ஒவ்வொரு பாதையின் நிகர இடப்பெயர்ச்சி; அவற்றை மேலதிகக் காவிகளாகக் கூட்ட வேண்டாம். வரைபுகள் விளக்கத்திற்கானவை.",
        )}
      </p>
    </div>
  );
}
