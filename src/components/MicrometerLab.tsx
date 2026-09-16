import { useId, useRef, useState } from "react";
import { useApp } from "../state";
import {
  micrometerParts,
  micrometerReading,
  clampSpindle,
} from "../domain/micrometer";
import "../styles/micrometer.css";
type P = [number, number, number];
type Face = { points: P[]; color: string; turn?: boolean };
function cylinder(
  x: number,
  length: number,
  r: number,
  color: string,
  rotation = 0,
): Face[] {
  const point = (i: number, end: number): P => [
    x + end,
    r * Math.cos((i * Math.PI) / 12 + rotation),
    r * Math.sin((i * Math.PI) / 12 + rotation),
  ];
  return [
    ...Array.from({ length: 24 }, (_, i) => ({
      points: [
        point(i, 0),
        point(i + 1, 0),
        point(i + 1, length),
        point(i, length),
      ],
      color: `color-mix(in srgb, ${color} ${65 + 30 * Math.sin((i * Math.PI) / 12 + rotation)}%, #18222b)`,
    })),
    {
      points: Array.from({ length: 24 }, (_, i) => point(i, 0)),
      color: "#dae4ea",
    },
    { points: Array.from({ length: 24 }, (_, i) => point(i, length)), color },
  ];
}
function frame(): Face[] {
  const outline: [[number, number], ...Array<[number, number]>] = [[-6, 3]];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + (i * Math.PI) / 24;
    outline.push([12.5 + 22 * Math.cos(a), 22 * Math.sin(a)]);
  }
  outline.push([34, 3], [28, 3]);
  for (let i = 24; i >= 0; i--) {
    const a = Math.PI + (i * Math.PI) / 24;
    outline.push([12.5 + 16 * Math.cos(a), 16 * Math.sin(a)]);
  }
  outline.push([-3, 3]);
  const front = outline.map(([x, y]) => [x, y, 4] as P),
    back = outline.map(([x, y]) => [x, y, -4] as P);
  return [
    { points: front, color: "#67765f" },
    { points: back, color: "#2c3a31" },
    ...outline.map((_, i) => ({
      points: [
        front[i],
        front[(i + 1) % front.length],
        back[(i + 1) % front.length],
        back[i],
      ],
      color: "#465547",
    })),
  ];
}
const objects = [
  { en: "Wire", ta: "கம்பி", size: 0.82, r: 4 },
  { en: "Thin sheet", ta: "மெல்லிய தகடு", size: 0.28, r: 9 },
  { en: "Small rod", ta: "சிறிய தண்டு", size: 5.97, r: 5 },
  { en: "Pin", ta: "முள்", size: 3.46, r: 4 },
  { en: "Block", ta: "கட்டி", size: 7.69, r: 8 },
];
export function MicrometerLab({ anatomy = false }: { anatomy?: boolean }) {
  const { T } = useApp(),
    uid = useId();
  const [gap, setGap] = useState(8),
    [pitch, setPitch] = useState(0.5),
    [zero, setZero] = useState(0),
    [selected, setSelected] = useState<number | null>(null),
    [yaw, setYaw] = useState(-12),
    [tilt, setTilt] = useState(20),
    [part, setPart] = useState(0),
    [zoom, setZoom] = useState(false),
    [answer, setAnswer] = useState(""),
    [feedback, setFeedback] = useState(""),
    [reveal, setReveal] = useState(false),
    [assisted, setAssisted] = useState(false),
    [locked, setLocked] = useState(false),
    [ratchet, setRatchet] = useState(false),
    [notes, setNotes] = useState<string[]>([]);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    gap: number;
    yaw: number;
    tilt: number;
    turn: boolean;
    scale: number;
    axis?: "slide" | "fine";
  } | null>(null);
  const item = selected === null ? null : objects[selected],
    reading = micrometerReading(gap, zero, pitch),
    contact = item !== null && Math.abs(gap - item.size) < 0.005;
  const invalidate = () => {
    setAnswer("");
    setFeedback("");
    setReveal(false);
    setRatchet(false);
  };
  const move = (n: number) => {
    if (!locked) {
      setGap(clampSpindle(n, item?.size ?? null));
      invalidate();
    }
  };
  const project = ([x, y, z]: P) => {
    const a = (yaw * Math.PI) / 180,
      b = (tilt * Math.PI) / 180,
      X = (x - 42) * Math.cos(a) + z * Math.sin(a),
      Z = -(x - 42) * Math.sin(a) + z * Math.cos(a);
    return [
      375 + X * 6,
      150 - (y * Math.cos(b) - Z * Math.sin(b)) * 6,
      y * Math.sin(b) + Z * Math.cos(b),
    ];
  };
  const edge = 42 + gap,
    rotation = (gap / pitch) * 2 * Math.PI;
  const faces = [
    ...frame(),
    ...cylinder(-6, 6, 2.5, "#c4d1d8"),
    ...cylinder(gap, 34 - gap, 2.5, "#cad6dc"),
    ...cylinder(32, 10 + gap, 5, "#d2dce2"),
    ...cylinder(edge, 5, 7, "#d8dfe3", rotation).map((f) => ({
      ...f,
      turn: true,
    })),
    ...cylinder(edge + 5, 15, 8, "#8b9c7e", rotation).map((f) => ({
      ...f,
      turn: true,
    })),
    ...cylinder(edge + 20, 7, 4, "#93a6b5", rotation),
    ...cylinder(edge + 27, 7, 5, "#c0d0da", rotation).map((f) => ({
      ...f,
      turn: true,
    })),
  ];
  if (item) {
    const objectStart = faces.length;
    // A transverse cylindrical wire/rod has its diameter along the measuring axis.
    if (selected === 0 || selected === 2 || selected === 3) {
      const r = item.size / 2;
      faces.push(
        ...cylinder(-9, 18, r, "#e3b65d").map((f) => ({
          ...f,
          points: f.points.map(([x, y, z]) => [r + y, x, z] as P),
        })),
      );
    } else {
      const q: P[] = [
        [0, -8, -5],
        [item.size, -8, -5],
        [item.size, 8, -5],
        [0, 8, -5],
        [0, -8, 5],
        [item.size, -8, 5],
        [item.size, 8, 5],
        [0, 8, 5],
      ];
      faces.push(
        ...[
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [0, 4, 7, 3],
          [1, 5, 6, 2],
          [3, 7, 6, 2],
          [0, 4, 5, 1],
        ].map((ids) => ({ points: ids.map((i) => q[i]), color: "#dbb96c" })),
      );
    }
    if (contact)
      for (let i = objectStart; i < faces.length; i++)
        faces[i].color = "#54d896";
  }
  const sorted = faces
    .map((f) => ({ ...f, p: f.points.map(project) }))
    .sort(
      (a, b) =>
        a.p.reduce((s, p) => s + p[2], 0) / a.p.length -
        b.p.reduce((s, p) => s + p[2], 0) / b.p.length,
    );
  const handle = project([edge + 12, 0, 9]);
  const start = Math.floor(reading.main) - 1;
  const scaleEdge = 45 + (reading.observed - start) * 120;
  return (
    <div className="micro-lab">
      {!anatomy && (
        <div className="micro-toolbar">
          <label>
            {T("Screw type", "திருகு வகை")}
            <select
              value={pitch}
              onChange={(e) => {
                setPitch(Number(e.target.value));
                invalidate();
              }}
            >
              <option value="0.5">0.5 mm / 50</option>
              <option value="1">1 mm / 100</option>
            </select>
          </label>
          <label>
            {T("Zero error (mm)", "பூச்சிய வழு (mm)")}
            <select
              value={zero}
              onChange={(e) => {
                setZero(Number(e.target.value));
                invalidate();
              }}
            >
              {[-0.05, -0.03, 0, 0.03, 0.05].map((n) => (
                <option key={n} value={n}>
                  {n.toFixed(2)}
                </option>
              ))}
            </select>
          </label>
          <button aria-pressed={locked} onClick={() => setLocked(!locked)}>
            {locked ? T("Unlock", "பூட்டைத் திறக்க") : T("Lock", "பூட்டுக")}
          </button>
          <button aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
            {T("Zoom scales", "அளவிடைகளைப் பெரிதாக்குக")}
          </button>
        </div>
      )}
      {!anatomy && (
        <div
          className="micro-objects"
          role="group"
          aria-label={T("Practice objects", "பயிற்சிப் பொருட்கள்")}
        >
          {objects.map((o, i) => (
            <button
              key={o.en}
              aria-pressed={selected === i}
              onClick={() => {
                setSelected(i);
                setGap(12);
                setLocked(false);
                setAssisted(false);
                invalidate();
              }}
            >
              {T(o.en, o.ta)}
            </button>
          ))}
          <button
            onClick={() => {
              setSelected(null);
              setLocked(false);
              setGap(1);
              setAssisted(false);
              invalidate();
            }}
          >
            {T("Remove / check zero", "நீக்குக / பூச்சியத்தைச் சோதிக்க")}
          </button>
        </div>
      )}
      <div className={"micro-scene" + (anatomy ? " micro-anatomy-scene" : "")}>
        {!anatomy && (
          <div
            className={"micro-contact" + (contact ? " ready" : "")}
            aria-live="polite"
          >
            {contact
              ? T(
                  "✓ Measuring faces in contact",
                  "✓ அளவிடும் முகங்கள் பொருளைத் தொடுகின்றன",
                )
              : item
                ? T(
                    "Turn to bring the spindle into contact",
                    "கதிர்க்கோலைப் பொருளைத் தொடச் செய்யச் சுழற்றுக",
                  )
                : T(
                    "Close the spindle onto the anvil to check zero",
                    "பூச்சியத்தைச் சோதிக்க கதிர்க்கோலைப் பட்டையைத் தொடச் செய்க",
                  )}
            {ratchet && (
              <span>
                {" "}
                ·{" "}
                {T(
                  "Ratchet slips · contact maintained",
                  "பற்சுழற்றி வழுக்குகிறது · தொடுகை பேணப்படுகிறது",
                )}
              </span>
            )}
          </div>
        )}
        <svg
          viewBox="0 0 820 360"
          role="group"
          aria-label={T(
            "Rotatable 3D micrometer",
            "சுழற்றக்கூடிய முப்பரிமாண நுண்மானித் திருகுக் கணிச்சி",
          )}
          onPointerDown={(e) => {
            if (drag.current || e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              id: e.pointerId,
              x: e.clientX,
              y: e.clientY,
              gap,
              yaw,
              tilt,
              turn: !!(e.target as Element).closest("[data-thimble]"),
              scale: Math.min(
                e.currentTarget.getBoundingClientRect().width / 820,
                e.currentTarget.getBoundingClientRect().height / 360,
              ),
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            if (d.turn) {
              const dx = e.clientX - d.x,
                dy = e.clientY - d.y;
              if (!d.axis && Math.hypot(dx, dy) > 3)
                d.axis = Math.abs(dx) >= Math.abs(dy) ? "slide" : "fine";
              if (d.axis === "slide" && d.scale > 0) {
                const a = (d.yaw * Math.PI) / 180,
                  b = (d.tilt * Math.PI) / 180;
                const ux = Math.cos(a),
                  uy = -Math.sin(a) * Math.sin(b);
                move(
                  d.gap +
                    (dx * ux + dy * uy) / (6 * d.scale * (ux * ux + uy * uy)),
                );
              } else if (d.axis === "fine") move(d.gap - (dy * pitch) / 100);
            } else {
              setYaw(
                Math.max(-35, Math.min(35, d.yaw + (e.clientX - d.x) * 0.25)),
              );
              setTilt(
                Math.max(-15, Math.min(55, d.tilt + (e.clientY - d.y) * 0.25)),
              );
            }
          }}
          onPointerUp={(e) => {
            if (drag.current?.id === e.pointerId) {
              drag.current = null;
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
        >
          {sorted.map((f, i) => (
            <polygon
              key={i}
              data-thimble={f.turn ? "true" : undefined}
              points={f.p.map((p) => `${p[0]},${p[1]}`).join(" ")}
              fill={f.color}
              stroke="#597481"
              strokeWidth=".4"
            />
          ))}
          {Array.from({ length: 51 }, (_, i) => {
            const n = i / 2;
            if (n > reading.observed || (pitch === 1 && i % 2)) return null;
            const p = project([42 + n - zero, 0, 5.2]),
              q = project([42 + n - zero, i % 2 ? -2 : 3, 5.2]),
              label = project([42 + n - zero, 4, 5.2]);
            return (
              <g key={i} pointerEvents="none">
                <line
                  x1={p[0]}
                  y1={p[1]}
                  x2={q[0]}
                  y2={q[1]}
                  stroke="#294151"
                />
                {n % 5 === 0 && (
                  <text
                    x={label[0]}
                    y={label[1]}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#142e3d"
                  >
                    {n}
                  </text>
                )}
              </g>
            );
          })}
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i * Math.PI) / 12 + rotation;
            const endAngle = a + (i < 24 ? 0.7 : -0.7);
            if (Math.sin(a) < 0 || Math.sin(endAngle) < 0) return null;
            const p = project([edge + 6, 8.1 * Math.cos(a), 8.1 * Math.sin(a)]),
              q = project([
                edge + 19,
                8.1 * Math.cos(endAngle),
                8.1 * Math.sin(endAngle),
              ]);
            return (
              <line
                key={i}
                x1={p[0]}
                y1={p[1]}
                x2={q[0]}
                y2={q[1]}
                stroke="#34493c"
                strokeWidth="1.6"
                pointerEvents="none"
              />
            );
          })}
          {Array.from({ length: 17 }, (_, i) => {
            const delta = i - 8,
              n = (reading.circular + delta + pitch * 100) % (pitch * 100),
              a = Math.PI / 2 + (delta * 2 * Math.PI) / (pitch * 100);
            const p = project([edge, 7.1 * Math.cos(a), 7.1 * Math.sin(a)]),
              q = project([
                edge + (n % 5 === 0 ? 2.4 : 1.3),
                7.1 * Math.cos(a),
                7.1 * Math.sin(a),
              ]),
              label = project([
                edge + 3.6,
                7.1 * Math.cos(a),
                7.1 * Math.sin(a),
              ]);
            return (
              <g key={i} pointerEvents="none">
                <line
                  x1={p[0]}
                  y1={p[1]}
                  x2={q[0]}
                  y2={q[1]}
                  stroke="#20394c"
                />
                {n % 5 === 0 && (
                  <text
                    x={label[0]}
                    y={label[1] + 3}
                    fontSize="8"
                    fill="#20394c"
                  >
                    {n}
                  </text>
                )}
              </g>
            );
          })}
          {contact &&
            [0, gap].map((x) => {
              const p = project([x, 3, 5]),
                q = project([x, -3, 5]);
              return (
                <line
                  key={x}
                  x1={p[0]}
                  y1={p[1]}
                  x2={q[0]}
                  y2={q[1]}
                  stroke="#63efa6"
                  strokeWidth="4"
                />
              );
            })}
          <g
            data-thimble="true"
            role="slider"
            tabIndex={0}
            aria-label={T("Rotate circular scale", "வட்ட அளவிடையைச் சுழற்றுக")}
            aria-valuemin={item?.size ?? 0}
            aria-valuemax={25}
            aria-valuenow={gap}
            aria-disabled={locked}
            onKeyDown={(e) => {
              if (
                [
                  "ArrowUp",
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                ].includes(e.key)
              ) {
                e.preventDefault();
                const step = e.shiftKey ? pitch : 0.01;
                move(
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 25
                      : gap +
                        (["ArrowUp", "ArrowRight"].includes(e.key)
                          ? step
                          : -step),
                );
              }
            }}
          >
            <rect
              x={handle[0] - 48}
              y={handle[1] - 38}
              width="96"
              height="76"
              rx="12"
              fill="transparent"
            />
            <circle cx={handle[0]} cy={handle[1]} r="18" fill="#daf7e8" />
            <text
              x={handle[0]}
              y={handle[1] + 6}
              textAnchor="middle"
              fill="#245f57"
              fontSize="24"
              pointerEvents="none"
            >
              ↔
            </text>
          </g>
          {anatomy && (
            <g pointerEvents="none">
              <defs>
                <marker
                  id={`${uid}-arrow`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0 0L10 5L0 10Z" fill="#b9f7d8" />
                </marker>
              </defs>
              {micrometerParts.map((p, i) => {
                const point = [...p.point] as P;
                if (i === 1) point[0] = (gap + 32) / 2;
                if (i === 3) point[0] = edge + 2;
                if (i === 4) point[0] = edge + 30;
                const target = project(point),
                  label = [
                    [85, 25],
                    [225, 65],
                    [375, 25],
                    [590, 25],
                    [680, 315],
                  ][i];
                return (
                  <g key={p.en}>
                    <path
                      d={`M${label[0]} ${label[1] + 6}L${target[0]} ${target[1]}`}
                      stroke="#b9f7d8"
                      strokeWidth={part === i ? 2.5 : 1.2}
                      markerEnd={`url(#${uid}-arrow)`}
                    />
                    <rect
                      x={label[0] - 100}
                      y={label[1] - 21}
                      width="200"
                      height="26"
                      rx="5"
                      fill="#183c47"
                    />
                    <text
                      x={label[0]}
                      y={label[1] - 3}
                      textAnchor="middle"
                      fill="#e0ffee"
                      fontSize="13"
                    >
                      {T(p.en, p.ta)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
        <p>
          {T(
            "Drag the barrel left/right to open or close · Up/down for fine turns · Drag background to rotate",
            "திறக்க/மூட உருளையை இடம்/வலம் இழுக்கவும் · நுண்ணிய சுழற்சிக்கு மேலே/கீழே இழுக்கவும் · காட்சியைச் சுழற்ற பின்னணியை இழுக்கவும்",
          )}
        </p>
      </div>
      <div className="micro-toolbar">
        <button
          onClick={() => {
            setYaw(-12);
            setTilt(20);
          }}
        >
          {T("3D view", "3D காட்சி")}
        </button>
        <button
          onClick={() => {
            setYaw(0);
            setTilt(0);
          }}
        >
          {T("Front view", "முன் காட்சி")}
        </button>
        {!anatomy && (
          <>
            <button disabled={locked} onClick={() => move(gap - 0.01)}>
              {T("Close 0.01 mm", "0.01 mm மூடுக")}
            </button>
            <button disabled={locked} onClick={() => move(gap + 0.01)}>
              {T("Open 0.01 mm", "0.01 mm திறக்க")}
            </button>
            <button
              disabled={locked}
              onClick={() => {
                move(item?.size ?? 0);
                setRatchet(true);
              }}
            >
              {T("Use ratchet to contact", "பற்சுழற்றியால் தொடச் செய்க")}
            </button>
          </>
        )}
      </div>
      {anatomy ? (
        <>
          <div className="micro-objects">
            {micrometerParts.map((p, i) => (
              <button
                key={p.en}
                aria-pressed={part === i}
                onClick={() => setPart(i)}
              >
                {T(p.en, p.ta)}
              </button>
            ))}
          </div>
          <p>
            <strong>
              {T(micrometerParts[part].en, micrometerParts[part].ta)}
            </strong>{" "}
            ·{" "}
            {T(micrometerParts[part].enDetail, micrometerParts[part].taDetail)}
          </p>
        </>
      ) : (
        <>
          <h4>
            {T(
              "Sleeve and circular scale · straight-on reading",
              "காப்புறை அளவிடையும் வட்ட அளவிடையும் · நேரான வாசிப்பு",
            )}
          </h4>
          <div
            className="micro-scale"
            tabIndex={0}
            aria-label={T("Scale reader", "அளவு வாசிப்பு")}
          >
            <svg
              viewBox="0 0 680 260"
              style={{
                width: zoom ? "180%" : "100%",
                minWidth: zoom ? 1000 : 580,
              }}
              role="img"
              aria-label={T(
                "Main scale and circular scale with datum line",
                "குறிப்புக் கோட்டுடன் பிரதான அளவிடையும் வட்ட அளவிடையும்",
              )}
            >
              <defs>
                <linearGradient id={uid}>
                  <stop stopColor="#e9eef3" />
                  <stop offset=".5" stopColor="#bccbd6" />
                  <stop offset="1" stopColor="#eef2f6" />
                </linearGradient>
              </defs>
              <rect
                x="20"
                y="45"
                width={scaleEdge - 20}
                height="165"
                rx="8"
                fill={`url(#${uid})`}
              />
              <path
                d={`M25 130H${scaleEdge + 110}`}
                stroke="#28526b"
                strokeWidth="2"
              />
              {Array.from({ length: 9 }, (_, i) => {
                const n = start + i * 0.5,
                  x = 45 + i * 60;
                if (n < 0) return null;
                if (pitch === 1 && n % 1 !== 0) return null;
                const exposed = n <= reading.observed;
                if (!exposed) return null;
                return (
                  <g key={i} opacity={exposed ? 1 : 0.15}>
                    <line
                      x1={x}
                      y1="130"
                      x2={x}
                      y2={n % 1 ? 151 : 95}
                      stroke="#264d68"
                      strokeWidth="2"
                    />
                    {n % 1 === 0 && (
                      <text x={x} y="84" textAnchor="middle">
                        {n}
                      </text>
                    )}
                  </g>
                );
              })}
              <path
                d={`M${scaleEdge} 30L${scaleEdge + 80} 45V220L${scaleEdge} 240Z`}
                fill="#e4d6b5"
                stroke="#8e846f"
              />
              {Array.from({ length: 17 }, (_, i) => {
                const delta = i - 8,
                  n = (reading.circular + delta + pitch * 100) % (pitch * 100),
                  y = 130 - delta * 11;
                return (
                  <g key={i}>
                    <line
                      x1={scaleEdge}
                      y1={y}
                      x2={scaleEdge + (n % 5 === 0 ? 37 : 24)}
                      y2={y}
                      stroke={reveal && delta === 0 ? "#d64b51" : "#264d68"}
                      strokeWidth={delta === 0 ? 2 : 1}
                    />
                    {n % 5 === 0 && (
                      <text x={scaleEdge + 45} y={y + 4}>
                        {n}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x="25" y="248">
                {T("Main scale: mm", "பிரதான அளவிடை: mm")}
              </text>
              <text x="475" y="200">
                {T("Circular divisions", "வட்ட அளவிடைப் பிரிவுகள்")}
              </text>
            </svg>
          </div>
          <p>
            {T("Pitch", "புரியிடைத் தூரம்")}: {pitch} mm · {pitch * 100}{" "}
            {T("divisions", "பிரிவுகள்")} · {T("Least count", "இழிவெண்ணிக்கை")}:
            0.01 mm
          </p>
          <div className="micro-toolbar">
            <label>
              {T("Corrected measurement (mm)", "திருத்தப்பட்ட பெறுமானம் (mm)")}
              <input
                type="number"
                step=".01"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setFeedback("");
                }}
              />
            </label>
            <button
              disabled={!contact || answer.trim() === ""}
              onClick={() => {
                const ok = Math.abs(Number(answer) - item!.size) < 0.005;
                setFeedback(
                  ok
                    ? T(
                        "Correct! Recorded in your session notebook.",
                        "சரி! இவ்வமர்வின் குறிப்பேட்டில் பதிவு செய்யப்பட்டது.",
                      )
                    : T(
                        "Add both scales, then subtract the signed zero error.",
                        "இரு அளவிடை வாசிப்புகளையும் கூட்டி, குறியுடனான பூச்சிய வழுவைக் கழிக்கவும்.",
                      ),
                );
                if (ok)
                  setNotes([
                    ...notes,
                    `${T(item!.en, item!.ta)} · ${item!.size.toFixed(2)} mm · ${assisted ? T("assisted", "உதவியுடன்") : T("independent", "உதவியின்றி")}`,
                  ]);
              }}
            >
              {T("Check measurement", "அளவீட்டைச் சோதிக்க")}
            </button>
            <button
              onClick={() => {
                setReveal(true);
                if (item) setAssisted(true);
              }}
            >
              {T("Reveal reading", "வாசிப்பைக் காட்டு")}
            </button>
          </div>
          {feedback && <p role="status">{feedback}</p>}
          {reveal && (
            <div className="micro-solution" role="status">
              {reading.main.toFixed(2)} + {reading.circular} × 0.01 ={" "}
              {reading.observed.toFixed(2)} mm
              <br />
              {reading.observed.toFixed(2)} − ({zero.toFixed(2)}) ={" "}
              {reading.corrected.toFixed(2)} mm
              {!contact && (
                <p>
                  {T(
                    "An instrument reading is not an object measurement until contact.",
                    "தொடுகைக்கு முன் கருவியின் வாசிப்பு பொருளின் அளவீடு அல்ல.",
                  )}
                </p>
              )}
            </div>
          )}
          {notes.length > 0 && (
            <section>
              <h4>{T("Session notebook", "இவ்வமர்வின் குறிப்பேடு")}</h4>
              <ul>
                {notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <button onClick={() => setNotes([])}>
                {T("Clear notebook", "குறிப்பேட்டை அழிக்க")}
              </button>
            </section>
          )}
          <p className="micro-note">
            {T(
              "Ideal outside micrometer: 0–25 mm. Ratchet contact is simplified; deformation, pressure and calibration uncertainty are not simulated. Use the enlarged scale for readings. Practice stays in this session.",
              "இலட்சிய வெளி அளவீட்டுக் கருவி: 0–25 mm. பற்சுழற்றித் தொடுகை எளிமைப்படுத்தப்பட்டுள்ளது; உருமாற்றம், அழுத்தம், அளவுத்திருத்த நிச்சயமின்மை மாதிரியாக்கப்படவில்லை. வாசிப்பிற்கு பெரிதாக்கிய அளவிடையைப் பயன்படுத்துக. பயிற்சி இவ்வமர்வில் மட்டும் இருக்கும்.",
            )}
          </p>
        </>
      )}
    </div>
  );
}
