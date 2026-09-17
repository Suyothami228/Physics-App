import { TravellingLab } from "./TravellingLab";
import { SpherometerLab } from "./SpherometerLab";
import { Caliper3D } from "./Caliper3D";
import { MicrometerLab } from "./MicrometerLab";
import { useId, useState } from "react";
import { useApp } from "../state";
import { AngleLab } from "./UnitLearning";
import { DimensionLab } from "./DimensionLab";
import { UncertaintyLab } from "./UncertaintyLab";
import {
  PendulumInvestigation,
  ParticleExperiment,
} from "./IntroductionExperiments";
export function MeasurementActivity({ kind }: { kind: string }) {
  if (kind === "travelling-3d") return <TravellingLab />;
  if (kind === "spherometer-3d") return <SpherometerLab />;
  if (kind === "micrometer-3d") return <MicrometerLab />;
  if (kind === "vernier-3d") return <Caliper3D />;
  if (kind.startsWith("error-")) return <UncertaintyLab kind={kind} />;
  if (kind.startsWith("dimension-")) return <DimensionLab kind={kind} />;
  if (kind === "angles") return <AngleLab />;
  if (kind === "pendulum") return <PendulumInvestigation />;
  if (kind === "particles") return <ParticleExperiment />;
  if (kind === "units") return <UnitConverter />;
  if (kind === "vernier") return <Vernier />;
  if (kind === "uncertainty") return <RepeatedReadings />;
  if (kind === "vectors") return <VectorComponents />;
  return null;
}
export function convertUnit(
  value: number,
  from: number,
  to: number,
  power: number,
) {
  return value * Math.pow(from / to, power);
}
export function readingStats(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { mean, halfRange: (Math.max(...values) - Math.min(...values)) / 2 };
}
function UnitConverter() {
  const { T } = useApp();
  const [value, setValue] = useState(250);
  const [from, setFrom] = useState(0.01);
  const [to, setTo] = useState(1);
  const [power, setPower] = useState(1);
  const units = [
    ["mm", 0.001],
    ["cm", 0.01],
    ["m", 1],
    ["km", 1000],
  ] as const;
  const suffix = power === 1 ? "" : power === 2 ? "²" : "³";
  return (
    <div className="measurement-widget">
      <div className="widget-controls">
        <label>
          {T("Value", "பெறுமானம்")}
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </label>
        <label>
          {T("Quantity", "கணியம்")}
          <select
            value={power}
            onChange={(e) => setPower(Number(e.target.value))}
          >
            <option value={1}>{T("Length", "நீளம்")}</option>
            <option value={2}>{T("Area", "பரப்பளவு")}</option>
            <option value={3}>{T("Volume", "கனவளவு")}</option>
          </select>
        </label>
        <label>
          {T("From", "இதிலிருந்து")}
          <select
            value={from}
            onChange={(e) => setFrom(Number(e.target.value))}
          >
            {units.map(([s, v]) => (
              <option key={s} value={v}>
                {s}
                {suffix}
              </option>
            ))}
          </select>
        </label>
        <label>
          {T("To", "இதற்கு")}
          <select value={to} onChange={(e) => setTo(Number(e.target.value))}>
            {units.map(([s, v]) => (
              <option key={s} value={v}>
                {s}
                {suffix}
              </option>
            ))}
          </select>
        </label>
      </div>
      <output className="widget-result" aria-live="polite">
        {Number(convertUnit(value, from, to, power).toPrecision(8))}{" "}
        {units.find(([, v]) => v === to)?.[0]}
        {suffix}
      </output>
      <p>
        {T(
          "The conversion factor is raised to the same power as the length unit.",
          "மாற்றுக் காரணி நீள அலகின் அதே அடுக்கிற்கு உயர்த்தப்படுகிறது.",
        )}
      </p>
    </div>
  );
}
function RepeatedReadings() {
  const { T } = useApp();
  const [values, setValues] = useState([20.1, 20.3, 20.2]);
  const { mean, halfRange } = readingStats(values);
  return (
    <div className="measurement-widget">
      <div className="widget-controls">
        {values.map((v, i) => (
          <label key={i}>
            {T("Reading", "வாசிப்பு")} {i + 1} (cm)
            <input
              type="number"
              step="0.1"
              value={v}
              onChange={(e) =>
                setValues(
                  values.map((x, j) => (j === i ? Number(e.target.value) : x)),
                )
              }
            />
          </label>
        ))}
      </div>
      <div className="widget-metrics">
        <span>
          {T("Mean", "சராசரி")}
          <strong>{mean.toFixed(3)} cm</strong>
        </span>
        <span>
          {T("Half-range", "வீச்சின் பாதி")}
          <strong>{halfRange.toFixed(3)} cm</strong>
        </span>
      </div>
      <p>
        {T(
          "Half-range is a simple spread indicator, not a complete uncertainty estimate. Consider resolution and systematic effects too. Displayed digits help compare calculations; round the reported measurement consistently with its justified uncertainty.",
          "வீச்சின் பாதி சிதறலுக்கான எளிய காட்டி; முழுமையான நிச்சயமின்மை மதிப்பீடு அல்ல. பிரிதிறனையும் முறையான விளைவுகளையும் கருதுக. காட்டப்படும் இலக்கங்கள் கணக்கீடுகளை ஒப்பிட உதவும்; நியாயப்படுத்தப்பட்ட நிச்சயமின்மைக்கேற்ப அளவீட்டை முழுமையாக்கவும்.",
        )}
      </p>
    </div>
  );
}
function Vernier() {
  const { T } = useApp();
  const [tenths, setTenths] = useState(127);
  const [zero, setZero] = useState(2);
  const [show, setShow] = useState(false);
  const value = tenths / 10;
  const aligned = tenths % 10;
  return (
    <div className="measurement-widget">
      <svg
        viewBox="0 0 640 175"
        role="img"
        aria-label={T(
          "Vernier scale. Identify which lower tick aligns with an upper tick.",
          "வேர்னியர் அளவு. பொருந்தும் கீழ் மற்றும் மேல் கோடுகளைக் கண்டறிக.",
        )}
      >
        <rect x="10" y="20" width="620" height="57" rx="7" fill="#e6eaff" />
        {Array.from({ length: 51 }, (_, i) => (
          <g key={i}>
            <line
              x1={20 + i * 12}
              x2={20 + i * 12}
              y1={i % 5 ? 53 : 42}
              y2="76"
              stroke="#44527a"
            />
            {i % 5 === 0 && (
              <text x={20 + i * 12} y="37" textAnchor="middle" fontSize="12">
                {i}
              </text>
            )}
          </g>
        ))}
        <g transform={`translate(${20 + value * 12},78)`}>
          <rect width="115" height="65" fill="#d9fa70" rx="5" />
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <line
                x1={i * 10.8}
                x2={i * 10.8}
                y1="0"
                y2="30"
                stroke={show && i === aligned ? "#d55345" : "#293f43"}
                strokeWidth={show && i === aligned ? 3 : 1}
              />
              <text x={i * 10.8} y="47" textAnchor="middle" fontSize="10">
                {i}
              </text>
            </g>
          ))}
        </g>
        <text x="540" y="102" fontSize="13">
          mm
        </text>
      </svg>
      <div className="widget-controls">
        <label>
          {T("Move the vernier", "வேர்னியரை நகர்த்துக")}
          <input
            type="range"
            min="0"
            max="300"
            value={tenths}
            onChange={(e) => {
              setTenths(Number(e.target.value));
              setShow(false);
            }}
          />
        </label>
        <label>
          {T("Zero error", "பூச்சிய வழு")}: {(zero / 10).toFixed(1)} mm
          <input
            type="range"
            min="-5"
            max="5"
            value={zero}
            onChange={(e) => {
              setZero(Number(e.target.value));
              setShow(false);
            }}
          />
        </label>
      </div>
      <button className="btn btn-blue" onClick={() => setShow(true)}>
        {T("Reveal reading", "வாசிப்பைக் காட்டு")}
      </button>
      {show && (
        <div className="widget-result" role="status">
          {Math.floor(value)} + {aligned} × 0.1 = {value.toFixed(1)} mm
          <br />
          <small>
            {T("Corrected", "திருத்தியது")}: {value.toFixed(1)} − (
            {(zero / 10).toFixed(1)}) = {((tenths - zero) / 10).toFixed(1)} mm
          </small>
        </div>
      )}
    </div>
  );
}
function VectorComponents() {
  const { T } = useApp();
  const [angle, setAngle] = useState(40);
  const [magnitude, setMagnitude] = useState(8);
  const marker = useId();
  const x = magnitude * Math.cos((angle * Math.PI) / 180),
    y = magnitude * Math.sin((angle * Math.PI) / 180);
  return (
    <div className="measurement-widget vector-widget">
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label={T(
          "Vector and its x and y components",
          "காவியும் அதன் x, y கூறுகளும்",
        )}
      >
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" fill="#465ce5" />
          </marker>
        </defs>
        <path d="M20 160H300M160 20V300" stroke="#bdc5db" />
        <text x="297" y="179">
          x
        </text>
        <text x="170" y="24">
          y
        </text>
        <path
          d={`M160 160H${160 + x * 11}V${160 - y * 11}`}
          stroke="#72a638"
          fill="none"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
        <path
          d={`M160 160L${160 + x * 11} ${160 - y * 11}`}
          stroke="#465ce5"
          strokeWidth="4"
          markerEnd={`url(#${marker})`}
        />
        <circle cx="160" cy="160" r="4" fill="#465ce5" />
      </svg>
      <div>
        <label>
          {T("Magnitude", "பருமன்")}: {magnitude} N
          <input
            type="range"
            min="1"
            max="10"
            value={magnitude}
            onChange={(e) => setMagnitude(Number(e.target.value))}
          />
        </label>
        <label>
          {T("Angle from +x", "+x இலிருந்து கோணம்")}: {angle}°
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
        </label>
        <div className="widget-metrics">
          <span>
            Fx<strong>{Math.abs(x) < 0.00001 ? "0.00" : x.toFixed(2)} N</strong>
          </span>
          <span>
            Fy<strong>{Math.abs(y) < 0.00001 ? "0.00" : y.toFixed(2)} N</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
