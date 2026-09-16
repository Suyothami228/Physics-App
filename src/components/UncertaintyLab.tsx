import { useState } from "react";
import { useApp } from "../state";
import "../styles/uncertainty.css";
export function uncertaintyStats(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { mean, range: Math.max(...values) - Math.min(...values) };
}
export function relativeUncertainty(x: number, u: number) {
  return x === 0 ? null : (100 * u) / Math.abs(x);
}
export function propagate(
  a: number,
  b: number,
  ua: number,
  ub: number,
  op: string,
  rss: boolean,
) {
  const value =
    op === "sum"
      ? a + b
      : op === "difference"
        ? a - b
        : op === "product"
          ? a * b
          : op === "quotient"
            ? a / b
            : a * a;
  const ca =
    op === "product"
      ? b * ua
      : op === "quotient"
        ? ua / b
        : op === "square"
          ? 2 * a * ua
          : ua;
  const cb =
    op === "product"
      ? a * ub
      : op === "quotient"
        ? (a * ub) / (b * b)
        : op === "square"
          ? 0
          : ub;
  return {
    value,
    u: rss ? Math.hypot(ca, cb) : Math.abs(ca) + Math.abs(cb),
    ca: Math.abs(ca),
    cb: Math.abs(cb),
  };
}
const pattern = [
  -0.8, 0.45, -0.3, 1, -0.55, 0.15, 0.65, -0.1, -1, 0.35, 0.75, -0.45,
];
export function UncertaintyLab({ kind }: { kind: string }) {
  const { T } = useApp();
  const [bias, setBias] = useState(1),
    [scatter, setScatter] = useState(0.2),
    [count, setCount] = useState(4),
    [corrected, setCorrected] = useState(false);
  const [x, setX] = useState(100),
    [u, setU] = useState(1),
    [a, setA] = useState(20),
    [b, setB] = useState(10),
    [ua, setUa] = useState(0.1),
    [ub, setUb] = useState(0.1),
    [op, setOp] = useState("product"),
    [rss, setRss] = useState(false);
  if (kind === "error-target") {
    const values = pattern
      .slice(0, count)
      .map((n) => 10 + (corrected ? 0 : bias) + n * scatter);
    const stats = uncertaintyStats(values);
    return (
      <div className="uncertainty-lab">
        <div className="uncertainty-grid">
          <svg
            viewBox="0 0 360 245"
            role="img"
            aria-label={T(
              "Repeated readings around the 10 mm reference",
              "10 mm ஒப்பீட்டுப் பெறுமானத்தைச் சுற்றிய மீளளவீடுகள்",
            )}
          >
            <rect
              x="20"
              y="30"
              width="320"
              height="150"
              rx="18"
              fill="#eef2ff"
            />
            {[7, 8, 9, 10, 11, 12, 13].map((v) => (
              <g key={v}>
                <path
                  d={`M${30 + (v - 7) * 50} 38v143`}
                  stroke={v === 10 ? "#849f3c" : "#d1dbef"}
                  strokeWidth={v === 10 ? 3 : 1}
                />
                <text x={30 + (v - 7) * 50} y="208" textAnchor="middle">
                  {v}
                </text>
              </g>
            ))}
            {values.map((v, i) => (
              <circle
                key={i}
                className="reading-dot"
                cx={30 + (v - 7) * 50}
                cy={55 + (i % 4) * 30}
                r="6"
                fill="#5b75c0"
              />
            ))}
            <path
              d={`M${30 + (stats.mean - 7) * 50} 174v14`}
              stroke="#a44b7a"
              strokeWidth="5"
            />
            <text x="180" y="237" textAnchor="middle">
              mm
            </text>
          </svg>
          <div className="widget-controls">
            <label>
              {T("Zero offset (mm)", "பூச்சிய வழு (mm)")}
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step=".1"
                value={bias}
                onChange={(e) => {
                  setBias(Number(e.target.value));
                  setCorrected(false);
                }}
              />
              <strong>{bias.toFixed(1)}</strong>
            </label>
            <label>
              {T("Scatter amplitude (mm)", "சிதறல் வீச்சு (mm)")}
              <input
                type="range"
                min=".05"
                max="1"
                step=".05"
                value={scatter}
                onChange={(e) => setScatter(Number(e.target.value))}
              />
              <strong>{scatter.toFixed(2)}</strong>
            </label>
            <label>
              {T("Number of readings", "வாசிப்புகளின் எண்ணிக்கை")}
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
              <strong>{count}</strong>
            </label>
          </div>
        </div>
        <div className="uncertainty-metrics" aria-live="polite">
          <span>
            {T("Reference", "ஒப்பீடு")}
            <strong>10.00 mm</strong>
          </span>
          <span>
            {T("Mean", "சராசரி")}
            <strong>{stats.mean.toFixed(2)} mm</strong>
          </span>
          <span>
            {T("Range", "வீச்சு")}
            <strong>{stats.range.toFixed(2)} mm</strong>
          </span>
        </div>
        <button
          className="btn btn-blue"
          aria-pressed={corrected}
          onClick={() => setCorrected(!corrected)}
        >
          {corrected
            ? T("Remove zero correction", "பூச்சியத் திருத்தத்தை நீக்குக")
            : T(
                "Apply known zero correction",
                "தெரிந்த பூச்சியத் திருத்தத்தைப் பயன்படுத்துக",
              )}
        </button>
        <p>
          {T(
            "Blue dots: readings. Green line: reference. Pink tick: mean. Correction subtracts the known offset; the scatter remains. Adding readings does not remove a systematic offset.",
            "நீலப் புள்ளிகள்: வாசிப்புகள். பச்சைக் கோடு: ஒப்பீடு. இளஞ்சிவப்புக் குறி: சராசரி. தெரிந்த பூச்சிய வழுவைக் கழித்தாலும் சிதறல் நீங்காது. அதிக வாசிப்புகள் முறையான வழுவை நீக்காது.",
          )}
        </p>
        <details>
          <summary>
            {T(
              "Readings and model assumptions",
              "வாசிப்புகளும் மாதிரியின் எடுகோள்களும்",
            )}
          </summary>
          <p>{values.map((v) => v.toFixed(2)).join(" · ")} mm</p>
          <p>
            {T(
              "A fixed illustrative scatter pattern makes comparisons reproducible. It is not a random sample or a confidence interval. The reference and correction are treated as exact here; real calibration also has uncertainty.",
              "ஒப்பீடுகளை மீண்டும் செய்ய நிலையான விளக்கச் சிதறல் பயன்படுத்தப்படுகிறது. இது எழுமாற்று மாதிரியோ நம்பக இடைவெளியோ அல்ல. இங்கு ஒப்பீடும் திருத்தமும் சரியானவை என எடுக்கப்படுகின்றன; உண்மையான அளவுத்திருத்தத்திற்கும் நிச்சயமின்மை உண்டு.",
            )}
          </p>
        </details>
      </div>
    );
  }
  if (kind === "error-relative") {
    const pct = relativeUncertainty(x, u)!;
    return (
      <div className="uncertainty-lab">
        <div className="widget-controls">
          <label>
            {T("Measured length (mm)", "அளந்த நீளம் (mm)")}
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={x}
              onChange={(e) => setX(Number(e.target.value))}
            />
            <strong>{x} mm</strong>
          </label>
          <label>
            {T(
              "Assumed uncertainty bound (mm)",
              "எடுக்கப்பட்ட நிச்சயமின்மை வரம்பு (mm)",
            )}
            <select value={u} onChange={(e) => setU(Number(e.target.value))}>
              {[0.01, 0.1, 0.5, 1, 2].map((v) => (
                <option key={v} value={v}>
                  ±{v} mm
                </option>
              ))}
            </select>
          </label>
        </div>
        <svg
          viewBox="0 0 520 130"
          role="img"
          aria-label={T(
            "Length with an uncertainty band on a fixed 0–510 mm scale",
            "நிலையான 0–510 mm அளவுகோலில் நிச்சயமின்மையுடன் நீளம்",
          )}
        >
          <path d="M5 70h510" stroke="#bdcbe5" />
          <rect x="5" y="43" width={x} height="25" rx="4" fill="#b5c9ee" />
          <rect
            className="uncertainty-band"
            x={5 + x - u}
            y="30"
            width={2 * u}
            height="54"
            fill="#e7a569"
          />
          {[0, 100, 200, 300, 400, 500].map((v) => (
            <text
              key={v}
              x={5 + v}
              y="110"
              textAnchor={v === 0 ? "start" : v === 500 ? "end" : "middle"}
            >
              {v}
            </text>
          ))}
        </svg>
        <output className="widget-result" aria-live="polite">
          ({x} ± {u}) mm · {pct.toFixed(2)}%
        </output>
        <p>
          {T(
            "Percentage uncertainty = (bound / |reading|) × 100. The orange interval is drawn to scale. Hold the bound fixed and increase the length: the percentage decreases.",
            "சதவீத நிச்சயமின்மை = (வரம்பு / |வாசிப்பு|) × 100. செம்மஞ்சள் இடைவெளி அளவுக்கேற்ப வரையப்பட்டுள்ளது. வரம்பை மாறாமல் வைத்து நீளத்தை அதிகரித்தால் சதவீதம் குறையும்.",
          )}
        </p>
        <p>
          {T(
            "The bound is a chosen input, not automatically the smallest scale division. Instrument specifications and the reading method determine a suitable estimate.",
            "வரம்பு இங்கு தேர்ந்தெடுக்கப்படும் பெறுமானம்; தானாகவே சிறிய அளவுப் பிரிவிற்குச் சமமாகாது. கருவியின் விவரங்களும் வாசிப்பு முறையும் பொருத்தமான மதிப்பீட்டைத் தீர்மானிக்கும்.",
          )}
        </p>
      </div>
    );
  }
  const result = propagate(a, b, ua, ub, op, rss);
  const total = result.ca + result.cb;
  const unit =
    op === "sum" || op === "difference"
      ? "cm"
      : op === "quotient"
        ? "1"
        : "cm²";
  return (
    <div className="uncertainty-lab">
      <div className="widget-controls">
        <label>
          {T("Relationship", "தொடர்பு")}
          <select value={op} onChange={(e) => setOp(e.target.value)}>
            <option value="sum">Y = A + B</option>
            <option value="difference">Y = A − B</option>
            <option value="product">Y = AB</option>
            <option value="quotient">Y = A / B</option>
            <option value="square">Y = A²</option>
          </select>
        </label>
        <label>
          {T("Combination method", "சேர்க்கை முறை")}
          <select
            value={String(rss)}
            onChange={(e) => setRss(e.target.value === "true")}
          >
            <option value="false">
              {T("First-order bounds", "முதலாம் அண்மிப்பு வரம்புகள்")}
            </option>
            <option value="true">
              {T(
                "Independent standard uncertainties",
                "சார்பற்ற நியம நிச்சயமின்மைகள்",
              )}
            </option>
          </select>
        </label>
      </div>
      <div className="uncertainty-grid">
        {[
          [a, setA, ua, setUa, "A"],
          ...(op === "square" ? [] : [[b, setB, ub, setUb, "B"]]),
        ].map(([v, setV, uv, setUv, label]) => (
          <div className="uncertainty-input-card" key={String(label)}>
            <label>
              {label as string} (cm)
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={v as number}
                onChange={(e) =>
                  (setV as (v: number) => void)(Number(e.target.value))
                }
              />
              <strong>{v as number} cm</strong>
            </label>
            <label>
              {rss ? "u" : "Δ"}
              {label as string} (cm)
              <input
                type="range"
                min=".05"
                max=".5"
                step=".05"
                value={uv as number}
                onChange={(e) =>
                  (setUv as (v: number) => void)(Number(e.target.value))
                }
              />
              <strong>{(uv as number).toFixed(2)} cm</strong>
            </label>
          </div>
        ))}
      </div>
      <output className="widget-result" aria-live="polite">
        Y = {result.value.toFixed(3)} {unit} · {rss ? "u(Y)" : "ΔY"} ≈{" "}
        {result.u.toFixed(3)} {unit}
      </output>
      <p>
        {rss ? "u(Y) ≈ √(cA² + cB²)" : "ΔY ≈ |cA| + |cB|"} · cA ={" "}
        {result.ca.toFixed(3)}, cB = {result.cb.toFixed(3)}
      </p>
      <div className="uncertainty-contributions">
        <span style={{ width: `${(100 * result.ca) / total}%` }}>A</span>
        {result.cb > 0 && (
          <span style={{ width: `${(100 * result.cb) / total}%` }}>B</span>
        )}
      </div>
      <p>
        {T(
          "Bars compare magnitudes of the sensitivity-weighted contributions cA and cB; they are not probabilities.",
          "பட்டைகள் உணர்திறனால் நிறையிடப்பட்ட cA, cB பங்களிப்புகளின் பருமனை ஒப்பிடுகின்றன; அவை நிகழ்தகவுகள் அல்ல.",
        )}
      </p>
      <p>
        {rss
          ? T(
              "Inputs are independent standard uncertainties (standard deviations). RSS omits covariance only under that assumption. The result is not a guaranteed bound or automatically a 95% interval.",
              "உள்ளீடுகள் சார்பற்ற நியம நிச்சயமின்மைகள் (நியம விலகல்கள்). அந்த எடுகோளில் மட்டுமே RSS இல் இணைமாறல் தவிர்க்கப்படுகிறது. முடிவு உறுதியான வரம்போ தானாகவே 95% இடைவெளியோ அல்ல.",
            )
          : T(
              "Inputs are bounds. Sum absolute sensitivity contributions for a first-order worst-case estimate. Products, quotients and powers are approximations for small relative bounds; exact extreme values may differ.",
              "உள்ளீடுகள் வரம்புகள். முதலாம் அண்மிப்பு அதிகபட்ச மதிப்பீட்டிற்கு தனிப் பங்களிப்புகளைக் கூட்டுக. பெருக்கல், வகுத்தல், அடுக்குகள் சிறிய சார்பு வரம்புகளுக்கான அண்மிப்புகள்; சரியான எல்லைப் பெறுமானங்கள் வேறுபடலாம்.",
            )}
      </p>
      <p>
        {T(
          "For A², A is one input used twice: its contribution is 2A·u(A), not two independent measurements. Intermediate digits are shown for learning, not as a final report.",
          "A² இல் ஒரே உள்ளீடு இருமுறை பயன்படுகிறது: பங்களிப்பு 2A·u(A); இரு சார்பற்ற அளவீடுகள் அல்ல. இடைக்கணிப்பு இலக்கங்கள் கற்றலுக்காகக் காட்டப்படுகின்றன; இறுதி அறிக்கைக்காக அல்ல.",
        )}
      </p>
    </div>
  );
}
