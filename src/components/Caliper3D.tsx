import { useRef, useState } from "react";
import { useApp } from "../state";
import "../styles/caliper.css";
import { caliperParts } from "../domain/caliper-parts";
type Point = [number, number, number];
type Face = { points: Point[]; color: string };
function profile(points: [number, number][], depth: number): Face[] {
  const front = points.map(([x, y]) => [x, y, depth] as Point),
    back = points.map(([x, y]) => [x, y, 0] as Point);
  return [
    { points: back, color: "#8995a1" },
    { points: front, color: "#cbd1d5" },
    ...points.map((_, i) => ({
      points: [
        back[i],
        back[(i + 1) % points.length],
        front[(i + 1) % points.length],
        front[i],
      ],
      color: i % 2 ? "#8d989f" : "#b5c0c6",
    })),
  ];
}
function screw(x: number): Face[] {
  const point = (i: number, y: number): Point => [
    x + 1.5 * Math.cos((i * Math.PI) / 8),
    y,
    2.5 + 1.5 * Math.sin((i * Math.PI) / 8),
  ];
  return [
    ...Array.from({ length: 16 }, (_, i) => ({
      points: [point(i, 11), point(i + 1, 11), point(i + 1, 14), point(i, 14)],
      color: i % 2 ? "#64717a" : "#c5cdd4",
    })),
    {
      points: Array.from({ length: 16 }, (_, i) => point(i, 14)),
      color: "#bbc5cc",
    },
  ];
}
function box(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: string,
): Face[] {
  const p: Point[] = [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + h, z],
    [x, y + h, z],
    [x, y, z + d],
    [x + w, y, z + d],
    [x + w, y + h, z + d],
    [x, y + h, z + d],
  ];
  return [
    [0, 1, 2, 3],
    [4, 7, 6, 5],
    [0, 4, 5, 1],
    [3, 2, 6, 7],
    [0, 3, 7, 4],
    [1, 5, 6, 2],
  ].map((indices, i) => ({
    points: indices.map((j) => p[j]),
    color: i === 1 ? color : i % 2 ? "#8293a8" : "#b7c4d3",
  }));
}
function cylinder(diameter: number): Face[] {
  const r = diameter / 2;
  const p = (i: number, z: number): Point => [
    r + r * Math.cos((i * Math.PI) / 16),
    -13 + r * Math.sin((i * Math.PI) / 16),
    z,
  ];
  return [
    ...Array.from({ length: 32 }, (_, i) => ({
      points: [p(i, 1), p(i + 1, 1), p(i + 1, 7), p(i, 7)],
      color: i % 2 ? "#cc9e5a" : "#b88545",
    })),
    { points: Array.from({ length: 32 }, (_, i) => p(i, 7)), color: "#e1b873" },
  ];
}
export function vernierReading(gap: number, zero: number) {
  const tenths = Math.round((gap + zero) * 10);
  const main = Math.floor(tenths / 10);
  return {
    main,
    aligned: tenths - main * 10,
    observed: tenths / 10,
    corrected: (tenths - Math.round(zero * 10)) / 10,
  };
}
type MeasurementMode = "external" | "internal" | "depth";
export function clampMeasurement(
  requested: number,
  size: number | null,
  mode: MeasurementMode,
) {
  const min = size !== null && mode === "external" ? size : 0;
  const max = size !== null && mode !== "external" ? size : 60;
  return Math.round(Math.max(min, Math.min(max, requested)) * 10) / 10;
}
export function clampJaw(requested: number, objectSize: number | null) {
  return (
    Math.round(Math.max(objectSize ?? 0, Math.min(60, requested)) * 10) / 10
  );
}
function ring(size: number, sides = 32): Face[] {
  const radius = sides === 6 ? size / Math.sqrt(3) : size / 2;
  const point = (i: number, inner: boolean, z: number): Point => {
    const a = (2 * Math.PI * i) / sides + (sides === 6 ? Math.PI / 6 : 0);
    const r = inner ? size / 4 : radius;
    return [size / 2 + r * Math.cos(a), -13 + r * Math.sin(a), z];
  };
  return Array.from({ length: sides }, (_, i) => [
    {
      points: [
        point(i, false, 1),
        point(i + 1, false, 1),
        point(i + 1, false, 7),
        point(i, false, 7),
      ],
      color: "#859baa",
    },
    {
      points: [
        point(i, false, 7),
        point(i + 1, false, 7),
        point(i + 1, true, 7),
        point(i, true, 7),
      ],
      color: "#d1dee6",
    },
    {
      points: [
        point(i, true, 1),
        point(i + 1, true, 1),
        point(i + 1, true, 7),
        point(i, true, 7),
      ],
      color: "#526574",
    },
    {
      points: [
        point(i, false, 1),
        point(i + 1, false, 1),
        point(i + 1, true, 1),
        point(i, true, 1),
      ],
      color: "#b0c0ca",
    },
  ]).flat();
}
function ball(size: number): Face[] {
  const r = size / 2;
  const point = (i: number, j: number): Point => {
    const a = (i * Math.PI) / 12,
      b = (j * Math.PI) / 12;
    return [
      r + r * Math.sin(a) * Math.cos(b),
      -13 + r * Math.cos(a),
      4 + r * Math.sin(a) * Math.sin(b),
    ];
  };
  return Array.from({ length: 12 }, (_, i) =>
    Array.from({ length: 24 }, (_, j) => ({
      points: [
        point(i, j),
        point(i + 1, j),
        point(i + 1, j + 1),
        point(i, j + 1),
      ],
      color: `hsl(205 18% ${48 + 25 * Math.sin((i * Math.PI) / 12) * Math.cos((j * Math.PI) / 12)}%)`,
    })),
  ).flat();
}
type PracticeObject = {
  en: string;
  ta: string;
  size: number;
  shape: string;
  icon: string;
  mode?: MeasurementMode;
};
const objects: PracticeObject[] = [
  {
    en: "Metal cylinder",
    ta: "உலோக உருளை",
    size: 12.5,
    shape: "round",
    icon: "◯",
  },
  {
    en: "Rectangular block",
    ta: "செவ்வகக் கட்டி",
    size: 24.8,
    shape: "block",
    icon: "▬",
  },
  { en: "Small pin", ta: "சிறிய முள்", size: 8.3, shape: "round", icon: "│" },
  {
    en: "Cylinder · length",
    ta: "உருளை · நீளம்",
    size: 32.4,
    shape: "long-cylinder",
    icon: "▰",
  },
  { en: "Ball", ta: "கோளம்", size: 15.8, shape: "ball", icon: "●" },
  { en: "Cube", ta: "கனசதுரம்", size: 20, shape: "cube", icon: "◆" },
  {
    en: "Hex nut · across flats",
    ta: "அறுகோண மரை · எதிர் முகங்களுக்கிடையில்",
    size: 18,
    shape: "nut",
    icon: "⬡",
  },
  {
    en: "Plate · thickness",
    ta: "தகடு · தடிப்பு",
    size: 4.6,
    shape: "plate",
    icon: "▯",
  },
  {
    en: "Ring · outside diameter",
    ta: "வளையம் · வெளிவிட்டம்",
    size: 19.2,
    shape: "ring",
    icon: "◎",
  },
  {
    en: "Ring · inside diameter",
    ta: "வளையம் · உள்விட்டம்",
    size: 12.6,
    shape: "bore",
    icon: "◎",
    mode: "internal",
  },
  {
    en: "Tube · inside diameter",
    ta: "குழாய் · உள்விட்டம்",
    size: 18.4,
    shape: "bore",
    icon: "◉",
    mode: "internal",
  },
  {
    en: "Slot · depth",
    ta: "பள்ளம் · ஆழம்",
    size: 17.6,
    shape: "slot",
    icon: "⊔",
    mode: "depth",
  },
  {
    en: "Recess · depth",
    ta: "குழிவு · ஆழம்",
    size: 26.4,
    shape: "slot",
    icon: "⊏",
    mode: "depth",
  },
];
function objectFaces(item: (typeof objects)[number]): Face[] {
  if (item.mode === "internal") {
    // The bore lies in the x/z plane around the upper jaws, rather than
    // standing upright in front of them. Its diameter spans x=0..size.
    const r = item.size / 2;
    return ring(item.size * 2).map((f) => ({
      ...f,
      points: f.points.map(([x, y, z]) => {
        const dx = x - item.size,
          dy = y + 13,
          oldR = Math.hypot(dx, dy);
        const newR = oldR > r * 1.5 ? r + 3 : r;
        return [
          r + (dx * newR) / oldR,
          19 - ((item.en.startsWith("Tube") ? 6 : 3) * (7 - z)) / 6,
          2 + (dy * newR) / oldR,
        ] as Point;
      }),
    }));
  }
  if (item.mode === "depth") {
    // Sectioned recess: the beam end seats at x=78; the floor is at 78+depth.
    return [
      ...box(78, -8, 0, item.size, 8, 8, "#c6a677"),
      ...box(78, 7, 0, item.size, 8, 8, "#c6a677"),
      ...box(78 + item.size, -8, 0, 4, 23, 8, "#dbc39f"),
    ];
  }
  if (item.shape === "ball") return ball(item.size);
  if (item.shape === "nut") return ring(item.size, 6);
  if (item.shape === "ring") return ring(item.size);
  if (item.shape === "long-cylinder") {
    return cylinder(10).map((f) => ({
      ...f,
      points: f.points.map(
        ([x, y, z]) => [((z - 1) * item.size) / 6, y, x] as Point,
      ),
    }));
  }
  if (item.shape === "cube")
    return box(0, -23, 1, item.size, 20, 20, "#a7cebe");
  if (item.shape === "plate")
    return box(0, -23, 1, item.size, 20, 14, "#d4bfa0");
  if (item.shape === "block")
    return box(0, -19, 1, item.size, 10, 6, "#d9aa62");
  return cylinder(item.size);
}
export function Caliper3D({ anatomyOnly = false }: { anatomyOnly?: boolean }) {
  const { T } = useApp();
  const [object, setObject] = useState(0),
    [placed, setPlaced] = useState(false),
    [gap, setGap] = useState(anatomyOnly ? 20 : 0),
    [zero, setZero] = useState(0.2),
    [yaw, setYaw] = useState(-12),
    [tilt, setTilt] = useState(25),
    [zoom, setZoom] = useState(1),
    [answer, setAnswer] = useState(""),
    [feedback, setFeedback] = useState(""),
    [reveal, setReveal] = useState(false),
    [assisted, setAssisted] = useState(false),
    [rows, setRows] = useState<
      { name: string; value: number; assisted: boolean }[]
    >([]);
  const [partIndex, setPartIndex] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const [scaleZoom, setScaleZoom] = useState(1);
  const [scaleUnit, setScaleUnit] = useState<"mm" | "cm">("mm");
  const drag = useRef<{
    mode: "jaw" | "orbit";
    pointerId: number;
    gap: number;
    scale: number;
    x: number;
    y: number;
    yaw: number;
    tilt: number;
  } | null>(null);
  const item = objects[object],
    reading = vernierReading(gap, zero);
  const mode = item.mode ?? "external";
  const minimum = placed && mode === "external" ? item.size : 0;
  const maximum = placed && mode !== "external" ? item.size : 60;
  const contact = placed && Math.abs(gap - item.size) < 0.01;
  const invalidate = () => {
    setReveal(false);
    setFeedback("");
    setAnswer("");
  };
  const move = (n: number) => {
    setGap(clampMeasurement(n, placed ? item.size : null, mode));
    invalidate();
  };
  const project = ([x, y, z]: Point) => {
    const a = (yaw * Math.PI) / 180,
      b = (tilt * Math.PI) / 180;
    // Keep the fixed jaw stationary while the sliding assembly moves.
    const center = 65;
    const X = (x - center) * Math.cos(a) + z * Math.sin(a),
      Z = -(x - center) * Math.sin(a) + z * Math.cos(a);
    return [
      360 + X * 4.8 * zoom,
      190 - (y * Math.cos(b) - Z * Math.sin(b)) * 4.8 * zoom,
      y * Math.sin(b) + Z * Math.cos(b),
    ];
  };
  const faces = [
    ...box(-4, 0, 0, 82, 7, 3, "#d4dee8"),
    ...profile(
      [
        [-9, 2],
        [0, 2],
        [0, -23],
        [-2, -22],
        [-4, -18],
        [-7, -8],
      ],
      5,
    ),
    ...profile(
      [
        [gap, 2],
        [gap + 9, 2],
        [gap + 7, -8],
        [gap + 4, -18],
        [gap + 2, -22],
        [gap, -23],
      ],
      5,
    ),
    ...box(gap - 1, -2, 0, 19, 12, 5, "#c6cdd2"),
    ...profile(
      [
        [0, 7],
        [0, 19],
        [2, 14],
        [3, 7],
      ],
      4,
    ),
    ...profile(
      [
        [gap - 3, 7],
        [gap - 2, 14],
        [gap, 19],
        [gap, 7],
      ],
      4,
    ),
    ...box(76, 2, 1, gap + 2, 1, 1, "#afbecd"),
    ...screw(gap + 5),
    ...(placed ? objectFaces(item) : []),
  ];
  const sorted = faces
    .map((face) => ({ ...face, pts: face.points.map(project) }))
    .sort(
      (a, b) =>
        a.pts.reduce((s, p) => s + p[2], 0) / a.pts.length -
        b.pts.reduce((s, p) => s + p[2], 0) / b.pts.length,
    );
  const start = Math.floor(reading.observed) - 2;
  const px = (n: number) => 35 + (n - start) * 36;
  return (
    <div className="caliper-lab">
      <div className="caliper-heading">
        <div>
          <span className="eyebrow">
            {T("VERNIER · 3D LAB", "வேணியர் · 3D பயிற்சியகம்")}
          </span>
          <h3>
            {T(
              "Make contact. Read the scale.",
              "தொடச் செய்து அளவை வாசிக்கவும்.",
            )}
          </h3>
        </div>
        <span className="caliper-badge">LC 0.1 mm</span>
      </div>
      <p>
        {T(
          "1 Check zero → 2 Place an object → 3 Make contact → 4 Read and correct",
          "1 பூச்சியத்தைச் சோதிக்க → 2 பொருளை வைக்க → 3 தொடச் செய்ய → 4 வாசித்துத் திருத்துக",
        )}
      </p>
      <div className="caliper-reader-tools">
        <strong>{T("Main scale", "பிரதான அளவிடை")}</strong>
        <div
          role="group"
          aria-label={T("Main scale units", "பிரதான அளவிடையின் அலகு")}
        >
          {(["mm", "cm"] as const).map((unit) => (
            <button
              key={unit}
              aria-pressed={scaleUnit === unit}
              onClick={() => setScaleUnit(unit)}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>
      <p className="caliper-unit-note">
        {T(
          "Each small main-scale division = 1 mm = 0.1 cm. The vernier has 10 divisions; least count = 0.1 mm = 0.01 cm. Submit practice answers in mm.",
          "பிரதான அளவிடையின் ஒவ்வொரு சிறு பிரிவும் = 1 mm = 0.1 cm. வேணியர் அளவிடையில் 10 பிரிவுகள் உள்ளன; இழிவெண்ணிக்கை = 0.1 mm = 0.01 cm. பயிற்சி விடைகளை mm இல் உள்ளிடுக.",
        )}
      </p>
      {!anatomyOnly && (
        <>
          <div className="caliper-toolbar">
            <button
              aria-expanded={choosing}
              onClick={() => setChoosing(!choosing)}
            >
              {T("Choose an object", "பொருளைத் தேர்ந்தெடுக்க")}
            </button>
            <button
              aria-pressed={scaleZoom > 1}
              onClick={() => setScaleZoom(scaleZoom > 1 ? 1 : 2)}
            >
              {T("Zoom scale", "அளவிடையைப் பெரிதாக்குக")}{" "}
              <span aria-hidden="true">⊕</span>
            </button>
          </div>
          {choosing && (
            <div
              className="caliper-object-grid"
              role="group"
              aria-label={T("Practice objects", "பயிற்சிப் பொருட்கள்")}
            >
              {objects.map((o, i) => (
                <button
                  key={o.en}
                  aria-pressed={placed && object === i}
                  onClick={() => {
                    setObject(i);
                    setPlaced(true);
                    setGap((o.mode ?? "external") === "external" ? 40 : 0);
                    setAssisted(false);
                    invalidate();
                    setChoosing(false);
                  }}
                >
                  <span aria-hidden="true">{o.icon}</span>
                  {T(o.en, o.ta)}
                </button>
              ))}
            </div>
          )}
          <div className="caliper-controls">
            <button
              className="btn btn-blue"
              onClick={() => {
                setPlaced(!placed);
                setGap(placed ? 0 : mode === "external" ? 40 : 0);
                invalidate();
              }}
            >
              {placed
                ? T(
                    "Remove object / check zero",
                    "பொருளை நீக்கி பூச்சியத்தைச் சோதிக்க",
                  )
                : T("Place object", "பொருளை வைக்க")}
            </button>
            <label>
              {T("Simulated zero error (mm)", "மாதிரிப் பூச்சிய வழு (mm)")}
              <select
                value={zero}
                onChange={(e) => {
                  setZero(Number(e.target.value));
                  invalidate();
                }}
              >
                {[-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3].map((z) => (
                  <option key={z} value={z}>
                    {z > 0 ? "+" : ""}
                    {z.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
      {!anatomyOnly && placed && (
        <p className="caliper-mode-guide">
          <strong>
            {mode === "internal"
              ? T("Inner jaws", "அகத்தாடைகள்")
              : mode === "depth"
                ? T("Depth rod", "ஆழம் அளக்கும் கோல்")
                : T("Outer jaws", "புறத்தாடைகள்")}
          </strong>
          {" · "}
          {mode === "internal"
            ? T(
                "Open the upper jaws across the centre of the bore until both tips touch the inside walls.",
                "மேல் அகத்தாடைகளைத் துளையின் மையத்தினூடாகத் திறந்து இரு முனைகளையும் உள்சுவர்களைத் தொடச் செய்யவும்.",
              )
            : mode === "depth"
              ? T(
                  "Cutaway view: the beam end is seated on the rim. Slide the jaw right to extend the rod until its tip touches the floor.",
                  "வெட்டுமுகக் காட்சி: பிரதான அளவிடையின் முனை விளிம்பில் அமர்ந்துள்ளது. தாடையை வலப்புறம் நகர்த்தி கோலின் முனையை அடித்தளத்தைத் தொடச் செய்யவும்.",
                )
              : T(
                  "Close the lower jaws onto the outside faces.",
                  "கீழ்ப் புறத்தாடைகளை வெளி முகங்களைத் தொடும்வரை மூடுக.",
                )}
        </p>
      )}
      <div className="caliper-scene">
        {!anatomyOnly && (
          <div
            className="caliper-live-contact"
            data-contact={contact}
            aria-live="polite"
          >
            <strong>
              {contact
                ? mode === "depth"
                  ? T(
                      "✓ Rod touches the floor",
                      "✓ கோல் அடித்தளத்தைத் தொடுகிறது",
                    )
                  : T("✓ Jaws in contact", "✓ தாடைகள் பொருளைத் தொடுகின்றன")
                : placed
                  ? mode === "internal"
                    ? T(
                        "↔ Open the inner jaws to the bore walls",
                        "↔ அகத்தாடைகளை உள்சுவர்களைத் தொடும்வரை திறக்கவும்",
                      )
                    : mode === "depth"
                      ? T(
                          "→ Extend the depth rod to the floor",
                          "→ ஆழம் அளக்கும் கோலை அடித்தளம்வரை நீட்டுக",
                        )
                      : T(
                          "↔ Close the jaw to the object",
                          "↔ பொருளைத் தொடும்வரை தாடையை மூடுக",
                        )
                  : T(
                      "Check zero or choose an object",
                      "பூச்சியத்தைச் சோதிக்க அல்லது பொருளைத் தேர்ந்தெடுக்க",
                    )}
            </strong>
            {placed && <span>{T(item.en, item.ta)}</span>}
          </div>
        )}
        <svg
          viewBox="0 0 760 440"
          role="group"
          aria-label={T(
            "Rotatable three-dimensional vernier caliper with moving jaws",
            "சுழற்றக்கூடிய முப்பரிமாண வேணியர் இடுக்கிமானியும் நகரும் தாடைகளும்",
          )}
          onPointerDown={(e) => {
            if (drag.current || e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            const rect = e.currentTarget.getBoundingClientRect();
            const jaw = (e.target as Element).closest("[data-jaw]");
            if (jaw) (jaw as SVGElement).focus({ preventScroll: true });
            drag.current = {
              mode: jaw ? "jaw" : "orbit",
              pointerId: e.pointerId,
              gap,
              scale: Math.min(rect.width / 760, rect.height / 440),
              x: e.clientX,
              y: e.clientY,
              yaw,
              tilt,
            };
          }}
          onPointerMove={(e) => {
            if (drag.current && drag.current.pointerId === e.pointerId) {
              if (drag.current.mode === "jaw") {
                const a = (drag.current.yaw * Math.PI) / 180;
                const b = (drag.current.tilt * Math.PI) / 180;
                const ux = Math.cos(a),
                  uy = -Math.sin(a) * Math.sin(b);
                const dx = e.clientX - drag.current.x,
                  dy = e.clientY - drag.current.y;
                if (drag.current.scale > 0)
                  move(
                    drag.current.gap +
                      (dx * ux + dy * uy) /
                        ((ux * ux + uy * uy) * 4.8 * zoom * drag.current.scale),
                  );
                return;
              }
              setYaw(
                Math.max(
                  -50,
                  Math.min(
                    50,
                    drag.current.yaw + (e.clientX - drag.current.x) * 0.3,
                  ),
                ),
              );
              setTilt(
                Math.max(
                  -25,
                  Math.min(
                    65,
                    drag.current.tilt + (e.clientY - drag.current.y) * 0.3,
                  ),
                ),
              );
            }
          }}
          onPointerUp={(e) => {
            if (drag.current?.pointerId === e.pointerId) {
              drag.current = null;
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
          }}
          onPointerCancel={(e) => {
            if (drag.current?.pointerId === e.pointerId) drag.current = null;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
        >
          <ellipse
            cx="360"
            cy="395"
            rx="270"
            ry="18"
            fill="#10233b"
            opacity=".3"
          />
          {sorted.map((f, i) => (
            <polygon
              key={i}
              points={f.pts.map((p) => `${p[0]},${p[1]}`).join(" ")}
              fill={f.color}
              stroke="#657487"
              strokeWidth=".5"
            />
          ))}
          {Array.from({ length: 71 }, (_, i) => {
            const a = project([i, 1, 3.1]),
              b = project([i, i % 10 === 0 ? 5 : i % 5 === 0 ? 4 : 3, 3.1]),
              label = project([i, 6, 3.1]);
            return (
              <g key={i} pointerEvents="none">
                <line
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke="#334a65"
                  strokeWidth=".7"
                />
                {i % 10 === 0 && (
                  <text
                    x={label[0]}
                    y={label[1]}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#223347"
                  >
                    {scaleUnit === "cm" ? i / 10 : i}
                  </text>
                )}
              </g>
            );
          })}
          {Array.from({ length: 11 }, (_, i) => {
            const a = project([reading.observed + 0.9 * i, -1, 5.1]),
              b = project([
                reading.observed + 0.9 * i,
                i % 5 === 0 ? 2 : 1,
                5.1,
              ]),
              label = project([reading.observed + 0.9 * i, -2.5, 5.1]);
            return (
              <g key={`v${i}`} pointerEvents="none">
                <line
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke="#455565"
                  strokeWidth=".8"
                />
                {i % 5 === 0 && (
                  <text
                    x={label[0]}
                    y={label[1]}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#223347"
                  >
                    {i}
                  </text>
                )}
              </g>
            );
          })}
          {contact &&
            [0, gap].map((x) => {
              const a = project(
                  mode === "depth"
                    ? [78 + (x === 0 ? 0 : gap), 0, 8]
                    : mode === "internal"
                      ? [x, 16, 2]
                      : [x, -8, 8],
                ),
                b = project(
                  mode === "depth"
                    ? [78 + (x === 0 ? 0 : gap), 7, 8]
                    : mode === "internal"
                      ? [x, 19, 2]
                      : [x, -20, 8],
                );
              return (
                <line
                  key={x}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke="#59f0a3"
                  strokeWidth="4"
                  pointerEvents="none"
                />
              );
            })}
          <g
            data-jaw="true"
            className="caliper-jaw-handle"
            role="slider"
            tabIndex={0}
            aria-label={T("Move sliding jaw", "நகரும் தாடையை நகர்த்துக")}
            aria-valuemin={minimum}
            aria-valuemax={maximum}
            aria-valuenow={gap}
            aria-valuetext={`${gap.toFixed(1)} mm`}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 1 : 0.1;
              const values: Record<string, number> = {
                ArrowLeft: gap - step,
                ArrowDown: gap - step,
                ArrowRight: gap + step,
                ArrowUp: gap + step,
                Home: minimum,
                End: maximum,
              };
              if (e.key in values) {
                e.preventDefault();
                move(values[e.key]);
              }
            }}
          >
            <title>
              {T(
                "Drag the sliding jaw · Arrow keys for fine adjustment",
                "நகரும் தாடையை இழுக்கவும் · நுண்ணிய நகர்வுக்கு அம்புக்குறி விசைகள்",
              )}
            </title>
            <polygon
              points={[
                [gap - 1, -23, 6],
                [gap + 10, -23, 6],
                [gap + 19, 10, 6],
                [gap + 8, 20, 6],
                [gap - 1, 10, 6],
              ]
                .map((p) => {
                  const at = project(p as Point);
                  return `${at[0]},${at[1]}`;
                })
                .join(" ")}
              fill="transparent"
            />
            <circle
              cx={project([gap + 10, 5, 6])[0]}
              cy={project([gap + 10, 5, 6])[1]}
              r="22"
              fill="transparent"
              stroke="transparent"
              strokeWidth="24"
              vectorEffect="non-scaling-stroke"
              className="caliper-touch-target"
            />
            <circle
              cx={project([gap + 10, 5, 6])[0]}
              cy={project([gap + 10, 5, 6])[1]}
              r="22"
              style={{ filter: "drop-shadow(0 0 4px #a6efd477)" }}
              fill="#c9f4dd"
              fillOpacity=".92"
              stroke="#4cbd9a"
              strokeWidth="2"
            />
            <text
              x={project([gap + 10, 5, 6])[0]}
              y={project([gap + 10, 5, 6])[1] + 7}
              textAnchor="middle"
              fill="#163e38"
              fontSize="25"
              pointerEvents="none"
            >
              ↔
            </text>
          </g>
        </svg>
        <span className="caliper-scene-caption">
          {T(
            "Drag the ↔ jaw to measure · Drag the background to rotate",
            "அளவிட ↔ தாடையை இழுக்கவும் · சுழற்ற பின்னணியை இழுக்கவும்",
          )}
        </span>
      </div>
      {!anatomyOnly && (
        <section className="caliper-reader">
          <div className="caliper-reader-tools">
            <strong>{T("Read the scale", "அளவை வாசிக்கவும்")}</strong>
            <div
              role="group"
              aria-label={T("Scale magnification", "அளவிடைப் பெரிதாக்கம்")}
            >
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  aria-pressed={scaleZoom === n}
                  onClick={() => setScaleZoom(n)}
                >
                  {n}×
                </button>
              ))}
            </div>
          </div>
          <h4>
            {T(
              "Scale microscope · straight-on reading",
              "அளவுப் பெரிதாக்கி · நேரான வாசிப்பு",
            )}
          </h4>
          <div
            className="caliper-scale"
            tabIndex={0}
            aria-label={T(
              "Scale reader · scroll horizontally when enlarged",
              "அளவு வாசிப்பு · பெரிதாக்கியபின் கிடையாக நகர்த்துக",
            )}
          >
            <svg
              viewBox="0 0 580 175"
              style={{
                width: `${scaleZoom * 100}%`,
                minWidth: 580 * scaleZoom,
              }}
              role="img"
              aria-label={T(
                `Magnified main scale in ${scaleUnit} and ten-division vernier`,
                `பெரிதாக்கப்பட்ட ${scaleUnit} பிரதான அளவிடையும் பத்துப் பிரிவு வேணியர் அளவிடையும்`,
              )}
            >
              <rect
                x="10"
                y="12"
                width="560"
                height="61"
                rx="8"
                fill="#e2eaf7"
              />
              {Array.from({ length: 15 }, (_, i) => {
                const n = start + i;
                return (
                  <g key={n}>
                    <path
                      d={`M${px(n)} ${n % 10 === 0 ? 40 : n % 5 === 0 ? 46 : 52}V72`}
                      stroke="#344767"
                      strokeWidth={n % 10 === 0 ? 2 : 1}
                    />
                    <text x={px(n)} y="35" textAnchor="middle">
                      {scaleUnit === "cm" ? Number((n / 10).toFixed(1)) : n}
                    </text>
                  </g>
                );
              })}
              <rect
                x={px(reading.observed) - 10}
                y="76"
                width="344"
                height="70"
                rx="7"
                fill="#dbeaaa"
              />
              {Array.from({ length: 11 }, (_, i) => (
                <g key={i}>
                  <path
                    d={`M${px(reading.observed + 0.9 * i)} 76v${i % 5 === 0 ? 36 : 25}`}
                    stroke={
                      reveal && i === reading.aligned ? "#be4d68" : "#344767"
                    }
                    strokeWidth={reveal && i === reading.aligned ? 3 : 1}
                  />
                  <text
                    x={px(reading.observed + 0.9 * i)}
                    y="132"
                    textAnchor="middle"
                  >
                    {i}
                  </text>
                </g>
              ))}
              <text x="12" y="169">
                {T(
                  `Main scale: ${scaleUnit} · Vernier: division number (0–10)`,
                  `பிரதான அளவிடை: ${scaleUnit} · வேணியர்: பிரிவு எண் (0–10)`,
                )}
              </text>
            </svg>
          </div>
        </section>
      )}
      <div className="caliper-camera">
        <button
          onClick={() => {
            setYaw(-12);
            setTilt(25);
            setZoom(1);
          }}
        >
          {T("3D view", "3D காட்சி")}
        </button>
        <button
          onClick={() => {
            setYaw(0);
            setTilt(0);
            setZoom(1);
          }}
        >
          {T("Front view", "முன் காட்சி")}
        </button>
        <label>
          {T("Rotate", "சுழற்றுக")}
          <input
            type="range"
            min="-50"
            max="50"
            value={yaw}
            onChange={(e) => setYaw(Number(e.target.value))}
          />
        </label>
        <label>
          {T("Tilt", "சாய்வு")}
          <input
            type="range"
            min="-25"
            max="65"
            value={tilt}
            onChange={(e) => setTilt(Number(e.target.value))}
          />
        </label>
        <label>
          {T("Zoom", "பெரிதாக்கம்")}
          <input
            type="range"
            min=".7"
            max="1.3"
            step=".1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
      </div>
      {anatomyOnly && (
        <>
          <div className="caliper-part-picker">
            {caliperParts.map((p, i) => (
              <button
                key={p.id}
                aria-pressed={i === partIndex}
                onClick={() => setPartIndex(i)}
              >
                {T(p.en, p.ta)}
              </button>
            ))}
          </div>
          <div className="caliper-part-detail" aria-live="polite">
            <strong>
              {T(caliperParts[partIndex].en, caliperParts[partIndex].ta)}
            </strong>
            <p>
              {T(
                caliperParts[partIndex].detail,
                caliperParts[partIndex].detailTa,
              )}
            </p>
          </div>
        </>
      )}
      {!anatomyOnly && (
        <>
          <div className="caliper-jaw">
            <p>
              {T(
                "Touch and drag the moving jaw on the model. For fine adjustment, use these buttons or focus the ↔ handle and press the arrow keys.",
                "மாதிரியில் நகரும் தாடையைத் தொட்டு இழுக்கவும். நுண்ணிய நகர்வுக்கு இப்பொத்தான்களைப் பயன்படுத்தவும் அல்லது ↔ குறியைத் தேர்ந்தெடுத்து அம்புக்குறி விசைகளை அழுத்தவும்.",
              )}
            </p>
            <div className="caliper-camera">
              <button onClick={() => move(gap - 0.1)}>
                {mode === "depth"
                  ? T("Retract 0.1 mm", "0.1 mm உள்ளிழுக்க")
                  : T("Close 0.1 mm", "0.1 mm மூடுக")}
              </button>
              <button onClick={() => move(gap + 0.1)}>
                {mode === "depth"
                  ? T("Extend 0.1 mm", "0.1 mm நீட்டுக")
                  : T("Open 0.1 mm", "0.1 mm திறக்க")}
              </button>
              <button onClick={() => move(placed ? item.size : 0)}>
                {placed
                  ? mode === "internal"
                    ? T(
                        "Open gently to contact",
                        "மெதுவாகத் தொடும்வரை திறக்கவும்",
                      )
                    : mode === "depth"
                      ? T(
                          "Extend rod to the floor",
                          "கோலை அடித்தளம்வரை நீட்டுக",
                        )
                      : T(
                          "Close gently to contact",
                          "மெதுவாகத் தொடும்வரை மூடுக",
                        )
                  : T(
                      "Close jaws for zero check",
                      "பூச்சியச் சோதனைக்குத் தாடைகளை மூடுக",
                    )}
              </button>
            </div>
          </div>
          <p>
            {T(
              "10 vernier divisions = 9 mm. Least count = 1 − 0.9 = 0.1 mm. Read the main tick immediately left of vernier zero, then add the aligned division × 0.1 mm.",
              "10 வேணியர் பிரிவுகள் = 9 mm. இழிவெண்ணிக்கை = 1 − 0.9 = 0.1 mm. வேணியர் பூச்சியத்திற்கு உடனே இடதுபுறமுள்ள பிரதான அளவிடை வாசிப்புடன் பொருந்தும் பிரிவு × 0.1 mm ஐச் சேர்க்கவும்.",
            )}
          </p>
          <div className="caliper-controls">
            <label>
              {T(
                "Your corrected measurement (mm)",
                "உங்கள் திருத்திய அளவீடு (mm)",
              )}
              <input
                type="number"
                step=".1"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setFeedback("");
                }}
              />
            </label>
            <button
              className="btn btn-blue"
              disabled={!contact || answer.trim() === ""}
              onClick={() => {
                const correct = Math.abs(Number(answer) - item.size) < 0.049;
                setFeedback(
                  correct
                    ? T(
                        "Correct! Measurement added to your notebook.",
                        "சரி! அளவீடு குறிப்பேட்டில் சேர்க்கப்பட்டது.",
                      )
                    : T(
                        "Try main scale + vernier contribution − signed zero error.",
                        "பிரதான அளவிடை + வேணியர் பங்களிப்பு − குறியுடனான பூச்சிய வழு என முயல்க.",
                      ),
                );
                if (correct)
                  setRows([
                    ...rows,
                    {
                      name: T(item.en, item.ta),
                      value: item.size,
                      assisted,
                    },
                  ]);
              }}
            >
              {T("Check measurement", "அளவீட்டைச் சோதிக்க")}
            </button>
            <button
              className="btn btn-white"
              onClick={() => {
                setReveal(true);
                if (placed) setAssisted(true);
              }}
            >
              {T("Reveal scale reading", "அளவு வாசிப்பைக் காட்டு")}
            </button>
          </div>
          {feedback && <p role="status">{feedback}</p>}
          {reveal && (
            <div className="caliper-solution" role="status">
              {reading.main} + {reading.aligned} × 0.1 ={" "}
              {reading.observed.toFixed(1)} mm
              <br />
              {T("Corrected", "திருத்தியது")}: {reading.observed.toFixed(1)} − (
              {zero.toFixed(1)}) = {reading.corrected.toFixed(1)} mm
              {!contact && (
                <p>
                  {T(
                    "This is the instrument opening. Record the object's measurement only after the measuring surfaces make contact.",
                    "இது கருவியின் திறப்பு அளவு. அளவிடும் பரப்புகள் பொருளைத் தொட்ட பின்னரே பொருளின் அளவீட்டைப் பதிவு செய்க.",
                  )}
                </p>
              )}
            </div>
          )}
          {rows.length > 0 && (
            <div className="caliper-notebook">
              <h4>{T("Session notebook", "இவ்வமர்வின் குறிப்பேடு")}</h4>
              <ul>
                {rows.map((r, i) => (
                  <li key={i}>
                    {r.name}: {r.value.toFixed(1)} mm ·{" "}
                    {r.assisted
                      ? T("With reveal", "விடையைப் பார்த்து")
                      : T("Without reveal", "விடையைப் பார்க்காமல்")}
                  </li>
                ))}
              </ul>
              <button onClick={() => setRows([])}>
                {T("Clear notebook", "குறிப்பேட்டை அழிக்க")}
              </button>
            </div>
          )}
          <details>
            <summary>
              {T(
                "Instrument parts and model limits",
                "கருவிப் பகுதிகளும் மாதிரியின் வரம்புகளும்",
              )}
            </summary>
            <p>
              {T(
                "Lower jaws measure external sizes, upper jaws measure internal diameters, and the rod measures recess depth. Depth objects use a cutaway view with the beam end seated on the rim. This ideal model assumes rigid aligned objects, sharp measuring tips and correct seating; it does not model pressure, deformation or calibration uncertainty. The 3D shape is simplified; read the calibrated, front-facing scale microscope. Rotating the camera does not change a reading. Least count is not a guarantee of measurement accuracy. Practice stays in this session and does not award exam readiness.",
                "புறத்தாடைகள் வெளி அளவுகளையும் அகத்தாடைகள் உள்விட்டத்தையும் ஆழம் அளக்கும் கோல் ஆழத்தையும் அளக்கும். ஆழப் பயிற்சியில் வெட்டுமுகக் காட்சி பயன்படுத்தப்படுகிறது; கருவியின் முனை விளிம்பில் அமர்ந்துள்ளது. உறுதியான நேராக்கப்பட்ட பொருட்கள், கூரிய அளவிடும் முனைகள் மற்றும் சரியான அமர்வு கருதப்படுகின்றன; அழுத்தம், உருமாற்றம், அளவுத்திருத்த நிச்சயமின்மை ஆகியவை மாதிரியாக்கப்படவில்லை. 3D வடிவம் எளிமைப்படுத்தப்பட்டது; நேரான அளவுப் பெரிதாக்கியில் வாசிக்கவும். காட்சியைச் சுழற்றினாலும் வாசிப்பு மாறாது. இழிவெண்ணிக்கை அளவீட்டுச் செம்மையை உறுதிப்படுத்தாது. பயிற்சி இவ்வமர்வில் மட்டும் இருக்கும்; தேர்வுத் தயார்நிலை மதிப்பெண் வழங்காது.",
              )}
            </p>
          </details>
        </>
      )}
    </div>
  );
}
