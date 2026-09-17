import { lazy, Suspense, useId, useState } from "react";
import { useApp } from "../state";
import {
  tmReading,
  tmClamp,
  tmSpecimens,
  tmEdge,
  type TMSpecimen,
  glassFocus,
  refractiveIndex,
} from "../domain/travelling";
import "../styles/spherometer.css";
import "../styles/travelling.css";
const Scene = lazy(() =>
  import("./TravellingScene").then((m) => ({ default: m.TravellingScene })),
);
export function TravellingLab({ anatomy = false }: { anatomy?: boolean }) {
  const { T } = useApp(),
    uid = useId().replace(/:/g, "");
  const [x, setX] = useState(22),
    [y, setY] = useState(30),
    [mode, setMode] = useState<"tube" | "glass">("tube"),
    [specimen, setSpecimen] = useState<TMSpecimen>("rubberOuter"),
    [side, setSide] = useState<0 | 1>(0),
    [stage, setStage] = useState<keyof typeof glassFocus>("reference"),
    [locked, setLocked] = useState(false),
    [axis, setAxis] = useState<"x" | "y">("x");
  const [ends, setEnds] = useState<(number | null)[]>([null, null]),
    [glass, setGlass] = useState<
      Partial<Record<keyof typeof glassFocus, number>>
    >({});
  const sample = tmSpecimens[specimen];
  const goalX = mode === "tube" ? tmEdge(specimen, side) : 40,
    goalY = mode === "tube" ? sample.focus : glassFocus[stage];
  const focused = Math.abs(y - goalY) < 0.025,
    aligned = Math.abs(x - goalX) < 0.025,
    ready = focused && aligned;
  const move = (nx: number, ny: number) => {
    if (!locked) {
      setX(tmClamp(nx, 15, 65));
      setY(tmClamp(ny, mode === "glass" ? 31 : 18, 65));
    }
  };
  const setExperiment = (m: "tube" | "glass") => {
    setMode(m);
    setLocked(false);
    setX(m === "glass" ? 40 : 22);
    setY(m === "glass" ? 42 : 35);
    setStage("reference");
    setEnds([null, null]);
    setSide(0);
    setGlass({});
    setAxis(m === "glass" ? "y" : "x");
  };
  const reading = tmReading(axis === "x" ? x : y),
    start = reading.main - 2;
  const result =
    glass.reference !== undefined &&
    glass.apparent !== undefined &&
    glass.top !== undefined
      ? refractiveIndex(glass.reference, glass.apparent, glass.top)
      : null;
  const distance = ends.every((n) => n !== null)
    ? Math.abs(ends[1]! - ends[0]!)
    : null;
  return (
    <section className="sphere-lab tm-lab">
      <div className="sphere-toolbar">
        <strong>
          {T(
            anatomy
              ? "Meet the travelling microscope"
              : "Travelling microscope · optical measurement",
            anatomy
              ? "நகரும் நுணுக்குக்காட்டியின் பாகங்கள்"
              : "நகரும் நுணுக்குக்காட்டி · ஒளியியல் அளவீடு",
          )}
        </strong>
        {!anatomy && (
          <span role="status" className={ready ? "sphere-contact" : ""}>
            {T(
              ready
                ? "✓ Focused and aligned"
                : !focused
                  ? "Adjust vertical focus"
                  : "Align the crosshair",
              ready
                ? "✓ தெளிவாகக் குவிக்கப்பட்டு பொருந்தியுள்ளது"
                : !focused
                  ? "நிலைக்குத்துக் குவிப்பைச் சீராக்குக"
                  : "குறுக்குக் கம்பியைப் பொருத்துக",
            )}
          </span>
        )}
      </div>
      {!anatomy && (
        <div className="sphere-toolbar">
          {(Object.keys(tmSpecimens) as TMSpecimen[]).map((key) => (
            <button
              key={key}
              aria-pressed={mode === "tube" && specimen === key}
              onClick={() => {
                setSpecimen(key);
                setExperiment("tube");
              }}
            >
              {T(tmSpecimens[key].en, tmSpecimens[key].ta)}
            </button>
          ))}
          <button
            aria-pressed={mode === "glass"}
            onClick={() => setExperiment("glass")}
          >
            {T("Glass slab", "கண்ணாடித் தகடு")}
          </button>
          <button aria-pressed={locked} onClick={() => setLocked(!locked)}>
            {T(locked ? "Unlock" : "Lock", locked ? "பூட்டைத் திற" : "பூட்டு")}
          </button>
        </div>
      )}
      <Suspense
        fallback={
          <p>
            {T("Loading 3D instrument…", "முப்பரிமாணக் கருவி ஏற்றப்படுகிறது…")}
          </p>
        }
      >
        <Scene
          x={anatomy ? 40 : x}
          y={anatomy ? 42 : y}
          mode={mode}
          specimen={specimen}
          stage={stage}
          anatomy={anatomy}
          locked={locked}
          onMove={move}
        />
      </Suspense>
      {!anatomy && (
        <>
          <div className="tm-workbench">
            <div>
              <h3>{T("Through the eyepiece", "பார்வை வில்லையூடாக")}</h3>
              <svg
                viewBox="0 0 260 260"
                className="tm-ocular"
                aria-label={T(
                  "Magnified crosshair view",
                  "உருப்பெருக்கிய குறுக்குக் கம்பிக் காட்சி",
                )}
              >
                <defs>
                  <clipPath id={uid + "clip"}>
                    <circle cx="130" cy="130" r="111" />
                  </clipPath>
                  <filter id={uid + "blur"}>
                    <feGaussianBlur
                      stdDeviation={Math.min(7, Math.abs(y - goalY) * 2)}
                    />
                  </filter>
                </defs>
                <circle cx="130" cy="130" r="119" fill="#080e19" />
                <g clipPath={`url(#${uid}clip)`}>
                  <path d="M0 0H260V260H0Z" fill="#dfebe5" />
                  <g filter={`url(#${uid}blur)`}>
                    {mode === "tube" ? (
                      <>
                        <circle
                          cx={130 + (32.6 - x) * sample.zoom}
                          cy="130"
                          r={sample.outer * sample.zoom}
                          fill={
                            sample.shape === "bubble"
                              ? "#b2e4ed88"
                              : sample.shape === "capillary"
                                ? "#94ced9"
                                : "#516776"
                          }
                          stroke="#407f93"
                          strokeWidth="2"
                        />
                        <circle
                          cx={130 + (32.6 - x) * sample.zoom}
                          cy="130"
                          r={sample.inner * sample.zoom}
                          fill="#edf5ed"
                        />
                      </>
                    ) : stage === "top" ? (
                      <circle
                        cx={130 + (40 - x) * 18}
                        cy="130"
                        r="5"
                        fill="#805e24"
                      />
                    ) : (
                      <path
                        d={`M${115 + (40 - x) * 18} 115l30 30m-30 0l30 -30`}
                        stroke="#263743"
                        strokeWidth="3"
                      />
                    )}
                  </g>
                  <path
                    d="M130 15V245M15 130H245"
                    stroke={ready ? "#07834e" : "#b54141"}
                    strokeWidth="1"
                  />
                </g>
              </svg>
              <p>
                {T(
                  "Upright schematic optical view. Move the instrument without touching the specimen.",
                  "நேராக்கப்பட்ட ஒளியியல் மாதிரிக் காட்சி. பொருளைத் தொடாமல் கருவியை நகர்த்துக.",
                )}
              </p>
            </div>
            <div>
              {mode === "tube" ? (
                <>
                  <h4>{T(sample.en, sample.ta)}</h4>
                  <div className="sphere-toolbar">
                    {([0, 1] as const).map((i) => (
                      <button
                        key={i}
                        aria-pressed={side === i}
                        onClick={() => setSide(i)}
                      >
                        {T(
                          i === 0 ? "Left edge" : "Right edge",
                          i === 0 ? "இடது விளிம்பு" : "வலது விளிம்பு",
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="tm-steps">
                  {(["reference", "apparent", "top"] as const).map((s, i) => (
                    <button
                      key={s}
                      aria-pressed={stage === s}
                      onClick={() => setStage(s)}
                    >
                      {i + 1}.{" "}
                      {T(
                        s === "reference"
                          ? "Mark without glass"
                          : s === "apparent"
                            ? "Mark through glass"
                            : "Top surface speck",
                        s === "reference"
                          ? "தகடின்றிக் குறி"
                          : s === "apparent"
                            ? "தகட்டினூடாகக் குறி"
                            : "மேற்பரப்புத் துகள்",
                      )}
                    </button>
                  ))}
                </div>
              )}
              <label>
                {T("Horizontal travel", "கிடை நகர்வு")} · {x.toFixed(2)} mm
                <input
                  aria-label={T("Horizontal travel", "கிடை நகர்வு")}
                  type="range"
                  min="15"
                  max="65"
                  step=".01"
                  value={x}
                  disabled={locked}
                  onChange={(e) => move(+e.target.value, y)}
                />
              </label>
              <label>
                {T("Vertical travel / focus", "நிலைக்குத்து நகர்வு / குவிப்பு")}{" "}
                · {y.toFixed(2)} mm
                <input
                  aria-label={T(
                    "Vertical travel / focus",
                    "நிலைக்குத்து நகர்வு / குவிப்பு",
                  )}
                  type="range"
                  min={mode === "glass" ? 31 : 18}
                  max="65"
                  step=".01"
                  value={y}
                  disabled={locked}
                  onChange={(e) => move(x, +e.target.value)}
                />
              </label>
              <div className="sphere-toolbar">
                <button disabled={locked} onClick={() => move(x - 0.01, y)}>
                  X −0.01
                </button>
                <button disabled={locked} onClick={() => move(x + 0.01, y)}>
                  X +0.01
                </button>
                <button disabled={locked} onClick={() => move(x, y - 0.01)}>
                  Y −0.01
                </button>
                <button disabled={locked} onClick={() => move(x, y + 0.01)}>
                  Y +0.01
                </button>
              </div>
              <button disabled={locked} onClick={() => move(goalX, goalY)}>
                {T("Show correct alignment", "சரியான பொருத்தத்தைக் காட்டு")}
              </button>{" "}
              <button
                disabled={!ready}
                onClick={() => {
                  if (mode === "tube")
                    setEnds((a) => a.map((v, i) => (i === side ? x : v)));
                  else setGlass((g) => ({ ...g, [stage]: y }));
                }}
              >
                {T("Record reading", "வாசிப்பைப் பதிவு செய்க")}
              </button>
              <p>
                {T(
                  "Keyboard on the model: arrows move 0.01 mm; Shift moves 0.50 mm. The demonstration button does not count as mastery.",
                  "கருவியில் விசைப்பலகை அம்புகள்: 0.01 mm; Shift உடன் 0.50 mm. விளக்கப் பொத்தான் கற்றல் தேர்ச்சியாகக் கணக்கிடப்படாது.",
                )}
              </p>
            </div>
          </div>
          <div className="tm-scale">
            <div className="sphere-toolbar">
              <strong>
                {T("Main scale + vernier", "பிரதான அளவிடை + வேணியர்")}
              </strong>
              <button aria-pressed={axis === "x"} onClick={() => setAxis("x")}>
                {T("Horizontal scale", "கிடை அளவிடை")}
              </button>
              <button aria-pressed={axis === "y"} onClick={() => setAxis("y")}>
                {T("Vertical scale", "நிலைக்குத்து அளவிடை")}
              </button>
            </div>
            <div className="tm-scale-scroll">
              <svg
                viewBox="0 0 720 130"
                aria-label={T(
                  "Enlarged vernier scale",
                  "பெரிதாக்கப்பட்ட வேணியர் அளவிடை",
                )}
              >
                {Array.from({ length: 61 }, (_, i) => (
                  <g key={i}>
                    <path
                      d={`M${25 + i * 11} 48v-${i % 2 === 0 ? 20 : 11}`}
                      stroke="#243b4b"
                    />
                    {i % 4 === 0 && (
                      <text x={25 + i * 11} y="18" textAnchor="middle">
                        {(start + i * 0.5).toFixed(1)}
                      </text>
                    )}
                  </g>
                ))}
                <path d="M25 48H685" stroke="#637b88" />
                {Array.from({ length: 51 }, (_, i) => {
                  const px = 25 + (reading.total - start + i * 0.49) * 22;
                  return (
                    <g key={i}>
                      <path
                        d={`M${px} 52v${i % 5 === 0 ? 24 : 14}`}
                        stroke={i === reading.vernier ? "#067a58" : "#243b4b"}
                        strokeWidth={i === reading.vernier ? 3 : 1}
                      />
                      {i % 10 === 0 && (
                        <text x={px} y="97" textAnchor="middle">
                          {i}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <output>
              {reading.main.toFixed(2)} mm + {reading.vernier} × 0.01 mm ={" "}
              <b>{reading.total.toFixed(2)} mm</b>
            </output>
            <p>
              {T(
                "1 main division = 0.50 mm; 50 vernier divisions = 49 main divisions. LC = 0.01 mm. This is the model’s scale specification.",
                "1 பிரதான பிரிப்பு = 0.50 mm; 50 வேணியர் பிரிப்புகள் = 49 பிரதான பிரிப்புகள். இழிவெண்ணிக்கை = 0.01 mm. இது இம்மாதிரியின் அளவிடை அமைப்பு.",
              )}
            </p>
          </div>
          <div className="sphere-notebook">
            <strong>{T("Observation notebook", "அவதானிப்புப் பதிவு")}</strong>
            {mode === "tube" && <p>{T(sample.en, sample.ta)}</p>}
            {mode === "tube" ? (
              <>
                <p>
                  L = {ends[0]?.toFixed(2) ?? "—"} mm · R ={" "}
                  {ends[1]?.toFixed(2) ?? "—"} mm
                </p>
                {distance !== null && (
                  <p>
                    {T("Diameter", "விட்டம்")} = |R − L| ={" "}
                    <b>{distance.toFixed(2)} mm</b>
                  </p>
                )}
              </>
            ) : (
              <>
                <p>
                  r₀ = {glass.reference?.toFixed(2) ?? "—"} mm · r₁ ={" "}
                  {glass.apparent?.toFixed(2) ?? "—"} mm · r₂ ={" "}
                  {glass.top?.toFixed(2) ?? "—"} mm
                </p>
                {result && (
                  <p>
                    μ = (r₂ − r₀)/(r₂ − r₁) = {result.real.toFixed(2)}/
                    {result.apparent.toFixed(2)} ={" "}
                    <b>{result.index.toFixed(2)}</b>
                  </p>
                )}
              </>
            )}
            <small>
              {T(
                "Ideal guided model with fixed specimens, no backlash or optical aberrations. Readings stay in this activity only.",
                "நிலையான பொருட்களைக் கொண்ட இலட்சிய வழிகாட்டும் மாதிரி. பின்னடைவும் ஒளியியல் பிறழ்வுகளும் சேர்க்கப்படவில்லை. பதிவுகள் இச்செயற்பாட்டில் மட்டும் இருக்கும்.",
              )}
            </small>
          </div>
        </>
      )}
    </section>
  );
}
