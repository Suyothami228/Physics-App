import { useState, lazy, Suspense } from "react";
import { useApp } from "../state";
import {
  surfaces,
  type Surface,
  screwReading,
  radiusOfCurvature,
  clampProbe,
} from "../domain/spherometer";
import "../styles/spherometer.css";
const SpherometerScene = lazy(() =>
  import("./SpherometerScene").then((m) => ({ default: m.SpherometerScene })),
);
export function SpherometerLab({ anatomy = false }: { anatomy?: boolean }) {
  const { T } = useApp();
  const [surface, setSurface] = useState<Surface>("flat");
  const [height, setHeight] = useState(3);
  const [angle, setAngle] = useState(25);
  const [zoom, setZoom] = useState(false);
  const [locked, setLocked] = useState(false);
  const [reference, setReference] = useState<number | null>(null);
  const [sample, setSample] = useState<number | null>(null);
  const target = surfaces[surface].h;
  const contact = Math.abs(height - target) < 0.005;
  const reading = screwReading(height);
  const h =
    reference !== null && sample !== null ? Math.abs(sample - reference) : null;
  const R = h === null ? null : radiusOfCurvature(40, h);
  const move = (value: number) => {
    if (!locked) setHeight(clampProbe(value, surface));
  };
  return (
    <section className="sphere-lab">
      <div className="sphere-toolbar">
        <strong>
          {T(
            anatomy ? "Meet the spherometer" : "Spherometer · measurement lab",
            anatomy ? "கோளமானியின் பாகங்கள்" : "கோளமானி · அளவீட்டு ஆய்வகம்",
          )}
        </strong>
        {!anatomy && (
          <span role="status" className={contact ? "sphere-contact" : ""}>
            {contact
              ? T("✓ Object in contact", "✓ மேற்பரப்பைத் தொட்டுள்ளது")
              : T("Lower the screw gently", "திருகாணியை மெதுவாக இறக்குக")}
          </span>
        )}
      </div>
      {!anatomy && (
        <div className="sphere-toolbar">
          {(Object.keys(surfaces) as Surface[]).map((s) => (
            <button
              key={s}
              aria-pressed={s === surface}
              onClick={() => {
                setSurface(s);
                setHeight(3);
                setLocked(false);
                setSample(null);
              }}
            >
              {T(surfaces[s].en, surfaces[s].ta)}
            </button>
          ))}
        </div>
      )}
      <Suspense
        fallback={
          <p>
            {T("Loading 3D instrument…", "முப்பரிமாணக் கருவி ஏற்றப்படுகிறது…")}
          </p>
        }
      >
        <SpherometerScene
          height={height}
          surface={surface}
          contact={contact}
          locked={locked}
          anatomy={anatomy}
          angle={angle}
          onMove={move}
        />
      </Suspense>
      <div className="sphere-toolbar">
        <button onClick={() => setAngle((a) => a - 30)}>
          {T("↶ Rotate view", "↶ பார்வையைச் சுழற்று")}
        </button>
        <button onClick={() => setAngle((a) => a + 30)}>
          {T("Rotate view ↷", "பார்வையைச் சுழற்று ↷")}
        </button>
        {!anatomy && (
          <>
            <button aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
              {T("Enlarge scales", "அளவிடைகளைப் பெரிதாக்கு")}
            </button>
            <button aria-pressed={locked} onClick={() => setLocked(!locked)}>
              {T(
                locked ? "Unlock" : "Lock",
                locked ? "பூட்டைத் திற" : "பூட்டு",
              )}
            </button>
          </>
        )}
      </div>
      {!anatomy && (
        <>
          <p>
            {T(
              "Drag the top knob up/down. Keyboard: ↑/↓ = 0.01 mm; Shift = 0.10 mm. Rotate the view to inspect the three legs.",
              "மேல் குமிழை மேலே / கீழே இழுக்கவும். ↑/↓ = 0.01 mm; Shift = 0.10 mm. மூன்று கால்களையும் காணப் பார்வையைச் சுழற்றவும்.",
            )}
          </p>
          <div className={"sphere-reader " + (zoom ? "enlarged" : "")}>
            <div>
              <strong>{T("Main scale", "பிரதான அளவிடை")}</strong>
              <svg viewBox="0 0 120 160">
                {Array.from({ length: 11 }, (_, i) => (
                  <g key={i}>
                    <path
                      d={`M 45 ${145 - i * 13} h 25`}
                      stroke="currentColor"
                    />
                    <text
                      x="25"
                      y={149 - i * 13}
                      fill="currentColor"
                      fontSize="11"
                    >
                      {i}
                    </text>
                  </g>
                ))}
                <path
                  d={`M 75 ${145 - reading.total * 13} h 30`}
                  stroke="#36c998"
                  strokeWidth="4"
                />
              </svg>
            </div>
            <div>
              <strong>{T("Circular scale", "வட்ட அளவிடை")}</strong>
              <svg viewBox="0 0 210 180">
                <g transform="translate(105 90)">
                  {Array.from({ length: 100 }, (_, i) => {
                    const a =
                      ((i - reading.circular) * Math.PI) / 50 - Math.PI / 2;
                    return (
                      <g key={i}>
                        <line
                          x1={Math.cos(a) * 70}
                          y1={Math.sin(a) * 70}
                          x2={Math.cos(a) * (i % 10 === 0 ? 56 : 64)}
                          y2={Math.sin(a) * (i % 10 === 0 ? 56 : 64)}
                          stroke="currentColor"
                        />
                        {i % 10 === 0 && (
                          <text
                            x={Math.cos(a) * 45}
                            y={Math.sin(a) * 45 + 4}
                            textAnchor="middle"
                            fontSize="11"
                            fill="currentColor"
                          >
                            {i}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
                <path d="M 100 7 L 105 18 L 110 7" fill="#36c998" />
              </svg>
            </div>
            <output>
              {reading.main} mm + {reading.circular} × 0.01 mm ={" "}
              <b>{reading.total.toFixed(2)} mm</b>
            </output>
          </div>
          <div className="sphere-toolbar">
            <button disabled={locked} onClick={() => move(height - 0.1)}>
              {T("Lower 0.10 mm", "0.10 mm இறக்கு")}
            </button>
            <button disabled={locked} onClick={() => move(height + 0.1)}>
              {T("Raise 0.10 mm", "0.10 mm உயர்த்து")}
            </button>
            <button disabled={locked} onClick={() => move(target)}>
              {T("Gently touch surface", "மேற்பரப்பை மெதுவாகத் தொடு")}
            </button>
            <button
              disabled={!contact}
              onClick={() =>
                surface === "flat"
                  ? (setReference(reading.total), setSample(null))
                  : setSample(reading.total)
              }
            >
              {T(
                surface === "flat" ? "Record reference" : "Record measurement",
                surface === "flat"
                  ? "ஆரம்ப வாசிப்பைப் பதிவு செய்"
                  : "அளவீட்டைப் பதிவு செய்",
              )}
            </button>
          </div>
          <div className="sphere-notebook">
            <strong>
              {T("Your observation notebook", "உங்கள் அவதானிப்புப் பதிவு")}
            </strong>
            <p>
              {T("Flat reference", "கண்ணாடித்தட்டு வாசிப்பு")}:{" "}
              {reference?.toFixed(2) ?? "—"} mm ·{" "}
              {T("Object reading", "பொருளின் வாசிப்பு")}:{" "}
              {sample?.toFixed(2) ?? "—"} mm
            </p>
            {h === null ? (
              <p>
                {T(
                  "Record contact on flat glass, then measure a different surface.",
                  "முதலில் கண்ணாடித்தட்டைத் தொட்டு வாசிப்பைப் பதிவு செய்க. பின்னர் வேறு மேற்பரப்பை அளக்கவும்.",
                )}
              </p>
            ) : (
              <p>
                h = |{sample!.toFixed(2)} − {reference!.toFixed(2)}| ={" "}
                <b>{h.toFixed(2)} mm</b>
                {surface !== "sheet" && R !== null && (
                  <>
                    {" "}
                    · a = 40 mm · R = a²/(6h) + h/2 = <b>{R.toFixed(2)} mm</b>
                  </>
                )}
              </p>
            )}
          </div>
          <small>
            {T(
              "Ideal model: fixed equilateral legs (a = 40 mm), constant pitch, no backlash. The scale origin is offset by 5 mm; subtract the flat reference. Notes reset when you leave this activity.",
              "இலட்சிய மாதிரி: சமபக்க முக்கோணக் கால்கள் (a = 40 mm), மாறாத புரியிடைத்தூரம். அளவிடையின் ஆரம்பம் 5 mm இடம்பெயர்ந்துள்ளது; கண்ணாடித்தட்டு வாசிப்பைக் கழிக்கவும். இப்பகுதியை விட்டு வெளியேறும்போது பதிவுகள் அழியும்.",
            )}
          </small>
        </>
      )}
    </section>
  );
}
