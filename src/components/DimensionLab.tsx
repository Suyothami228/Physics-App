import { useState } from "react";
import { useApp } from "../state";
import "../styles/dimensions.css";
export type Dimension = [number, number, number];
export const dimensionTargets: {
  en: string;
  ta: string;
  d: Dimension;
  reason: string;
}[] = [
  {
    en: "Speed",
    ta: "கதி",
    d: [0, 1, -1],
    reason: "[v] = [distance]/[time] = L/T",
  },
  {
    en: "Acceleration",
    ta: "ஆர்முடுகல்",
    d: [0, 1, -2],
    reason: "[a] = [v]/[t] = (L/T)/T",
  },
  { en: "Force", ta: "விசை", d: [1, 1, -2], reason: "[F] = [m][a] = M × LT⁻²" },
  {
    en: "Energy",
    ta: "சக்தி",
    d: [1, 2, -2],
    reason: "[E] = [F][distance] = MLT⁻² × L",
  },
  {
    en: "Pressure",
    ta: "அமுக்கம்",
    d: [1, -1, -2],
    reason: "[p] = [F]/[area] = MLT⁻²/L²",
  },
  {
    en: "Density",
    ta: "அடர்த்தி",
    d: [1, -3, 0],
    reason: "[ρ] = [m]/[volume] = M/L³",
  },
  { en: "Power", ta: "வலு", d: [1, 2, -3], reason: "[P] = [E]/[t] = ML²T⁻²/T" },
  {
    en: "Momentum",
    ta: "உந்தம்",
    d: [1, 1, -1],
    reason: "[p] = [m][v] = M × LT⁻¹",
  },
];
export function sameDimension(a: Dimension, b: Dimension) {
  return a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
}
export function cgsValue(value: number, d: Dimension, toSI: boolean) {
  const factor = Math.pow(0.001, d[0]) * Math.pow(0.01, d[1]);
  return toSI ? value * factor : value / factor;
}
export function pendulumDimensions(m: number, l: number, g: number): Dimension {
  return [m, l + g, -2 * g];
}
function Formula({ d }: { d: Dimension }) {
  return (
    <span className="dimension-formula">
      {d.every((x) => x === 0)
        ? "1"
        : d.map((p, i) =>
            p !== 0 ? (
              <span key={i}>
                {["M", "L", "T"][i]}
                {p !== 1 && <sup>{p}</sup>}
              </span>
            ) : null,
          )}
    </span>
  );
}
function Exponents({
  value,
  onChange,
  labels = ["M", "L", "T"],
  step = 1,
}: {
  value: Dimension;
  onChange: (d: Dimension) => void;
  labels?: string[];
  step?: number;
}) {
  const { T } = useApp();
  return (
    <div className="dimension-dials">
      {value.map((p, i) => (
        <label key={i}>
          <strong>{labels[i]}</strong>
          <span>{T("Exponent", "அடுக்கு")}</span>
          <select
            aria-label={`${labels[i]} ${T("exponent", "அடுக்கு")}`}
            value={p}
            onChange={(e) =>
              onChange(
                value.map((v, j) =>
                  i === j ? Number(e.target.value) : v,
                ) as Dimension,
              )
            }
          >
            {Array.from(
              { length: Math.round(6 / step) + 1 },
              (_, n) => -3 + n * step,
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
export const equationCases = [
  {
    formula: "s = ut + ½at²",
    terms: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ] as Dimension[],
    labels: ["s", "ut", "½at²"],
    valid: true,
    en: "Every term is a length. This passes the dimension check; the motion law still assumes constant acceleration.",
    ta: "ஒவ்வொரு உறுப்பும் நீளம். பரிமாணச் சோதனை பொருந்துகிறது; இயக்கச் சமன்பாட்டிற்கு மாறா ஆர்முடுகல் தேவை.",
  },
  {
    formula: "s = u + at²",
    terms: [
      [0, 1, 0],
      [0, 1, -1],
      [0, 1, 0],
    ] as Dimension[],
    labels: ["s", "u", "at²"],
    valid: false,
    en: "u is a velocity, not a length. Multiplying u by time repairs the dimensional mismatch.",
    ta: "u வேகம்; நீளம் அல்ல. u ஐ நேரத்தால் பெருக்கினால் பரிமாணப் பொருத்தமின்மை நீங்கும்.",
  },
  {
    formula: "E = mv²",
    terms: [
      [1, 2, -2],
      [1, 2, -2],
    ] as Dimension[],
    labels: ["E", "mv²"],
    valid: true,
    en: "The dimensions match, but this is not the classical kinetic-energy formula: its coefficient is ½. Dimensions cannot recover that number.",
    ta: "பரிமாணங்கள் பொருந்தினாலும் இது மரபுவழி இயக்கச் சக்திச் சூத்திரம் அல்ல; அதன் குணகம் ½. பரிமாணங்களால் அந்த எண்ணைக் கண்டறிய முடியாது.",
  },
  {
    formula: "p + ½ρv² + ρgh = constant",
    terms: [
      [1, -1, -2],
      [1, -1, -2],
      [1, -1, -2],
    ] as Dimension[],
    labels: ["p", "½ρv²", "ρgh"],
    valid: true,
    en: "All terms have pressure dimensions. Bernoulli’s equation also requires its physical assumptions; matching dimensions alone does not establish them.",
    ta: "அனைத்து உறுப்புகளும் அமுக்கப் பரிமாணம் கொண்டவை. பெர்னூலிச் சமன்பாட்டின் பௌதிக நிபந்தனைகளும் தேவை; பரிமாணப் பொருத்தம் மட்டும் போதாது.",
  },
  {
    formula: "v = √(F / μ)",
    terms: [
      [0, 1, -1],
      [0, 1, -1],
    ] as Dimension[],
    labels: ["v", "√(F/μ)"],
    valid: true,
    en: "μ is mass per unit length: ML⁻¹. Thus [F/μ] = L²T⁻² and its square root is LT⁻¹.",
    ta: "μ ஓரலகு நீளத்திற்கான திணிவு: ML⁻¹. எனவே [F/μ] = L²T⁻²; அதன் வர்க்கமூலம் LT⁻¹.",
  },
];
export function DimensionLab({ kind }: { kind: string }) {
  const { T } = useApp();
  const [target, setTarget] = useState(0),
    [powers, setPowers] = useState<Dimension>([0, 0, 0]);
  const [checked, setChecked] = useState(false),
    [caseIndex, setCase] = useState(0),
    [prediction, setPrediction] = useState<boolean | null>(null);
  const [length, setLength] = useState(1),
    [value, setValue] = useState(1),
    [toSI, setToSI] = useState(true);
  const current = dimensionTargets[target];
  const selector = (
    <label>
      {T("Choose a quantity", "கணியத்தைத் தேர்க")}
      <select
        value={target}
        onChange={(e) => {
          setTarget(Number(e.target.value));
          setChecked(false);
          setPowers([0, 0, 0]);
        }}
      >
        {dimensionTargets.map((r, i) => (
          <option key={i} value={i}>
            {T(r.en, r.ta)}
          </option>
        ))}
      </select>
    </label>
  );
  if (kind === "dimension-equations") {
    const c = equationCases[caseIndex];
    return (
      <div className="dimension-lab">
        <div
          className="filters"
          role="group"
          aria-label={T("Equation examples", "சமன்பாட்டு எடுத்துக்காட்டுகள்")}
        >
          {equationCases.map((_, i) => (
            <button
              key={i}
              aria-pressed={caseIndex === i}
              className={caseIndex === i ? "selected" : ""}
              onClick={() => {
                setCase(i);
                setPrediction(null);
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="dimension-equation">{c.formula}</div>
        <p>
          {T(
            "Predict: do all terms have matching dimensions?",
            "ஊகிக்கவும்: எல்லா உறுப்புகளின் பரிமாணங்களும் பொருந்துகின்றனவா?",
          )}
        </p>
        <div className="filters">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              aria-pressed={prediction === v}
              onClick={() => setPrediction(v)}
            >
              {v
                ? T("Consistent", "பொருந்தும்")
                : T("Inconsistent", "பொருந்தாது")}
            </button>
          ))}
        </div>
        {prediction !== null && (
          <div role="status" className="dimension-reveal">
            <strong>
              {prediction === c.valid
                ? T("Correct prediction", "சரியான ஊகம்")
                : T("Compare the terms below", "கீழுள்ள உறுப்புகளை ஒப்பிடுக")}
            </strong>
            <div className="dimension-term-grid">
              {c.terms.map((d, i) => (
                <div
                  key={i}
                  className={
                    sameDimension(d, c.terms[0])
                      ? "dimension-match"
                      : "dimension-mismatch"
                  }
                >
                  <span>{c.labels[i]}</span>
                  <Formula d={d} />
                </div>
              ))}
            </div>
            <p>{T(c.en, c.ta)}</p>
          </div>
        )}
      </div>
    );
  }
  if (kind === "dimension-scaling") {
    const result = pendulumDimensions(...powers);
    return (
      <div className="dimension-lab">
        <p>
          {T(
            "Assume period τ = C mᵃ ℓᵇ gᶜ. Find exponents that leave only time T. C is dimensionless.",
            "அலைவு காலம் τ = C mᵃ ℓᵇ gᶜ என எடுக்கவும். நேரப் பரிமாணம் T மட்டும் கிடைக்க அடுக்குகளைத் தேர்க. C பரிமாணமற்றது.",
          )}
        </p>
        <Exponents
          value={powers}
          onChange={(d) => {
            setPowers(d);
            setChecked(false);
          }}
          labels={["a (m)", "b (ℓ)", "c (g)"]}
          step={0.5}
        />
        <div className="dimension-equation">
          <Formula d={result} /> → T
        </div>
        <p>M: a = 0 · L: b + c = 0 · T: −2c = 1</p>
        <button className="btn btn-blue" onClick={() => setChecked(true)}>
          {T("Test the powers", "அடுக்குகளைச் சோதிக்க")}
        </button>
        {checked && (
          <div className="dimension-reveal" role="status">
            <strong>
              {sameDimension(result, [0, 0, 1])
                ? T(
                    "You found the scaling: τ ∝ √(ℓ/g)",
                    "அளவுத் தொடர்பு கிடைத்தது: τ ∝ √(ℓ/g)",
                  )
                : T(
                    "Try a = 0, b = ½, c = −½. Compare the three exponent equations.",
                    "a = 0, b = ½, c = −½ என முயல்க. மூன்று அடுக்குச் சமன்பாடுகளையும் ஒப்பிடுக.",
                  )}
            </strong>
            <p>
              {T(
                "Dimensions do not supply C = 2π or the small-angle assumption. Those come from the pendulum model.",
                "C = 2π அல்லது சிறுகோண நிபந்தனையைப் பரிமாணங்கள் தராது. அவை ஊசல் மாதிரியிலிருந்து பெறப்படுகின்றன.",
              )}
            </p>
          </div>
        )}
        <label>
          {T("Length ratio ℓ / ℓ₀", "நீள விகிதம் ℓ / ℓ₀")}
          <input
            type="range"
            min=".25"
            max="4"
            step=".25"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
          />
        </label>
        <div className="dimension-ratio">
          <span>ℓ / ℓ₀ = {length}</span>
          <div style={{ width: `${Math.sqrt(length) * 45}%` }} />
          <output>
            τ / τ₀ = √{length} = {Math.sqrt(length).toFixed(2)}
          </output>
        </div>
        <p>
          {T(
            "Same gravity, small angles. The bar shows the period ratio, not a physical pendulum trajectory.",
            "ஒரே ஈர்ப்பு, சிறிய கோணங்கள். பட்டை அலைவு கால விகிதத்தைக் காட்டுகிறது; உண்மையான ஊசல் பாதையை அல்ல.",
          )}
        </p>
      </div>
    );
  }
  if (kind === "dimension-conversion")
    return (
      <div className="dimension-lab">
        <div className="widget-controls">
          {selector}
          <label>
            {T("Value", "பெறுமானம்")}
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </label>
          <label>
            {T("Direction", "திசை")}
            <select
              value={String(toSI)}
              onChange={(e) => setToSI(e.target.value === "true")}
            >
              <option value="true">CGS → SI</option>
              <option value="false">SI → CGS</option>
            </select>
          </label>
        </div>
        <div className="dimension-equation">
          <Formula d={current.d} />
        </div>
        <p>1 g = 10⁻³ kg · 1 cm = 10⁻² m · 1 s = 1 s</p>
        <p>
          {T("CGS → SI numerical factor", "CGS → SI எண் காரணி")}: (10⁻³)
          <sup>{current.d[0]}</sup> × (10⁻²)<sup>{current.d[1]}</sup> × 1
          <sup>{current.d[2]}</sup> ={" "}
          {Number(cgsValue(1, current.d, true).toPrecision(8))}
        </p>
        <output className="widget-result" aria-live="polite">
          {Number(cgsValue(value, current.d, toSI).toPrecision(8))}{" "}
          {
            (toSI
              ? ["m s⁻¹", "m s⁻²", "N", "J", "Pa", "kg m⁻³", "W", "kg m s⁻¹"]
              : [
                  "cm s⁻¹",
                  "cm s⁻²",
                  "dyn",
                  "erg",
                  "dyn cm⁻²",
                  "g cm⁻³",
                  "erg s⁻¹",
                  "g cm s⁻¹",
                ])[target]
          }
        </output>
        <p>
          {T(
            "SI uses kg, m, s; CGS uses g, cm, s. Reverse conversion divides by the same factor. The physical quantity is unchanged.",
            "SI இல் kg, m, s; CGS இல் g, cm, s. எதிர்த்திசை மாற்றத்தில் அதே காரணியால் வகுக்கவும். பௌதிகக் கணியம் மாறாது.",
          )}
        </p>
      </div>
    );
  return (
    <div className="dimension-lab">
      {selector}
      <p>
        {T(
          "Build the dimensional formula. Zero removes a base dimension; negative powers put it in the denominator.",
          "பரிமாணக் கோவையை உருவாக்குக. பூச்சிய அடுக்கு அப்பரிமாணத்தை நீக்கும்; எதிர் அடுக்கு பகுதியைக் குறிக்கும்.",
        )}
      </p>
      <Exponents
        value={powers}
        onChange={(d) => {
          setPowers(d);
          setChecked(false);
        }}
      />
      <div className="dimension-equation">
        <Formula d={powers} />
      </div>
      <button className="btn btn-blue" onClick={() => setChecked(true)}>
        {T("Check construction", "கட்டமைப்பைச் சோதிக்க")}
      </button>
      {checked && (
        <div className="dimension-reveal" role="status">
          <strong>
            {sameDimension(powers, current.d)
              ? T("The dimensions match!", "பரிமாணங்கள் பொருந்துகின்றன!")
              : T(
                  "Use the defining relationship",
                  "வரைவிலக்கணத் தொடர்பைப் பயன்படுத்துக",
                )}
          </strong>
          <p>{current.reason}</p>
          <Formula d={current.d} />
        </div>
      )}
    </div>
  );
}
