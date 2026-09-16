import { useEffect, useState } from "react";
import { useApp } from "../state";
export const pendulumPeriod = (length: number, gravity = 9.81) =>
  2 * Math.PI * Math.sqrt(length / gravity);
export const gasRatios = (temperature: number) => ({
  pressure: temperature / 300,
  speed: Math.sqrt(temperature / 300),
});
function useExperimentClock() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    let id = 0;
    let previous = performance.now();
    function tick(now: number) {
      setTime((t) => t + Math.min((now - previous) / 1000, 0.05));
      previous = now;
      id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);
  return {
    time,
    running,
    toggle: () => setRunning((r) => !r),
    reset: () => {
      setTime(0);
      setRunning(false);
    },
    step: () => {
      setRunning(false);
      setTime((t) => t + 0.1);
    },
  };
}
function Controls({ clock }: { clock: ReturnType<typeof useExperimentClock> }) {
  const { T } = useApp();
  return (
    <div className="experiment-transport">
      <button className="btn btn-blue" onClick={clock.toggle}>
        {clock.running
          ? T("Pause", "இடைநிறுத்து")
          : T("▶ Run model", "▶ மாதிரியை இயக்குக")}
      </button>
      <button className="btn btn-white" onClick={clock.step}>
        {T("Step 0.1 s", "0.1 s முன்னேற்று")}
      </button>
      <button className="btn btn-white" onClick={clock.reset}>
        {T("Reset", "மீட்டமை")}
      </button>
      <span>t = {clock.time.toFixed(1)} s</span>
    </div>
  );
}
export function PendulumInvestigation() {
  const { T } = useApp();
  const clock = useExperimentClock();
  const [length, setLength] = useState(1);
  const [mass, setMass] = useState(100);
  const [prediction, setPrediction] = useState("");
  const [trials, setTrials] = useState<
    { length: number; mass: number; period: number }[]
  >([]);
  const baseline = pendulumPeriod(1),
    period = pendulumPeriod(length);
  function pendulum(l: number, m: number, cx: number, label: string) {
    const angle =
      0.14 * Math.cos((2 * Math.PI * clock.time) / pendulumPeriod(l));
    const pixels = 130 * Math.sqrt(l);
    const x = cx + pixels * Math.sin(angle),
      y = 22 + pixels * Math.cos(angle);
    return (
      <g>
        <path d={`M${cx - 26} 20h52`} stroke="#9bacd7" strokeWidth="5" />
        <line x1={cx} y1="22" x2={x} y2={y} stroke="#4c619f" strokeWidth="2" />
        <circle
          cx={x}
          cy={y}
          r={10 + Math.sqrt(m / 100) * 3}
          fill={cx < 200 ? "#768be4" : "#b4d667"}
        />
        <text x={cx} y="244" textAnchor="middle" fill="#647194" fontSize="13">
          {label}
        </text>
      </g>
    );
  }
  return (
    <div className="intro-experiment">
      <div className="prediction-prompt">
        <label htmlFor="pendulum-prediction">
          {T("Predict before you run", "இயக்குவதற்கு முன் எதிர்வுகூறுக")}
        </label>
        <select
          id="pendulum-prediction"
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">
            {T(
              "Which bob takes longer for one swing cycle?",
              "ஒரு முழு அலைவிற்கு எந்தக் குண்டு அதிக நேரம் எடுக்கும்?",
            )}
          </option>
          <option value="a">{T("Reference A", "ஒப்பீட்டு A")}</option>
          <option value="same">{T("The same time", "ஒரே நேரம்")}</option>
          <option value="b">{T("Test B", "சோதனை B")}</option>
        </select>
      </div>
      <div className="pendulum-layout">
        <div className="experiment-stage">
          <svg
            viewBox="0 0 400 264"
            role="img"
            aria-label={T(
              "Two pendulums at the same small starting angle",
              "ஒரே சிறிய ஆரம்பக் கோணத்தில் இரு ஊசல்கள்",
            )}
          >
            {pendulum(1, 100, 100, "A · 1.00 m · 100 g")}
            {pendulum(
              length,
              mass,
              300,
              `B · ${length.toFixed(2)} m · ${mass} g`,
            )}
          </svg>
          <Controls clock={clock} />
        </div>
        <div className="experiment-settings">
          <label>
            {T("Test B: length", "சோதனை B: நீளம்")}
            <strong>{length.toFixed(2)} m</strong>
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.05"
              value={length}
              onChange={(e) => {
                setLength(Number(e.target.value));
                clock.reset();
              }}
            />
          </label>
          <label>
            {T("Test B: mass", "சோதனை B: திணிவு")}
            <strong>{mass} g</strong>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={mass}
              onChange={(e) => {
                setMass(Number(e.target.value));
                clock.reset();
              }}
            />
          </label>
          <div className="fixed-conditions">
            {T(
              "Fixed: g = 9.81 m/s²; release angle ≈ 8°; no drag; massless, inextensible strings and point-like bobs.",
              "நிலையானவை: g = 9.81 m/s²; விடுவிப்புக் கோணம் ≈ 8°; வளித்தடை இல்லை; திணிவற்ற, நீட்சியற்ற நூல்களும் புள்ளிக் குண்டுகளும்.",
            )}
          </div>
          <div className="period-comparison">
            <span>
              A<strong>{baseline.toFixed(2)} s</strong>
            </span>
            <span>
              B<strong>{period.toFixed(2)} s</strong>
            </span>
          </div>
          <p className="model-equation">T = 2π√(L/g)</p>
          <button
            className="btn btn-dark"
            onClick={() =>
              setTrials((t) => [...t, { length, mass, period }].slice(-5))
            }
          >
            {T("Record model result", "மாதிரிப் பெறுபேற்றைப் பதிவுசெய்")}
          </button>
        </div>
      </div>
      {prediction && (
        <p className="experiment-insight">
          {T("Compare your prediction:", "உங்கள் எதிர்வுகூறலுடன் ஒப்பிடுக:")}{" "}
          {length === 1
            ? T(
                "The periods match, even if the masses differ.",
                "திணிவுகள் வேறுபட்டாலும் ஆவர்த்தன காலங்கள் சமம்.",
              )
            : length > 1
              ? T(
                  "B has the longer period because its string is longer.",
                  "B இன் நூல் நீளமானதால் அதன் ஆவர்த்தன காலம் அதிகம்.",
                )
              : T(
                  "A has the longer period because its string is longer.",
                  "A இன் நூல் நீளமானதால் அதன் ஆவர்த்தன காலம் அதிகம்.",
                )}
        </p>
      )}
      {trials.length > 0 && (
        <div className="trial-results">
          <table>
            <caption>
              {T(
                "Model notebook · last five comparisons",
                "மாதிரிக் குறிப்பேடு · இறுதி ஐந்து ஒப்பீடுகள்",
              )}
            </caption>
            <thead>
              <tr>
                <th>L (m)</th>
                <th>m (g)</th>
                <th>T (s)</th>
                <th>{T("Ten cycles (s)", "பத்து அலைவுகள் (s)")}</th>
              </tr>
            </thead>
            <tbody>
              {trials.map((r, i) => (
                <tr key={i}>
                  <td>{r.length.toFixed(2)}</td>
                  <td>{r.mass}</td>
                  <td>{r.period.toFixed(2)}</td>
                  <td>{(r.period * 10).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="refresh-content text-link"
            onClick={() => setTrials([])}
          >
            {T("Clear notebook", "குறிப்பேட்டை அழி")}
          </button>
        </div>
      )}
      <p className="simulation-assumption">
        {T(
          "The animation and notebook are calculated from the same small-angle equation. They illustrate a prediction; a real experiment is needed to test the model. Drawing sizes are schematic.",
          "அசைவூட்டமும் குறிப்பேடும் ஒரே சிறுகோணச் சமன்பாட்டிலிருந்து கணிக்கப்படுகின்றன. இவை எதிர்வுகூறலை விளக்குகின்றன; மாதிரியைச் சோதிக்க நேரடிப் பரிசோதனை தேவை. வரைபின் அளவுகள் விளக்கத்திற்கானவை.",
        )}
      </p>
    </div>
  );
}
export function reflectPosition(
  start: number,
  velocity: number,
  time: number,
  span: number,
) {
  const raw =
    (((start + velocity * time) % (span * 2)) + span * 2) % (span * 2);
  return raw <= span ? raw : span * 2 - raw;
}
export function ParticleExperiment() {
  const { T } = useApp();
  const [temp, setTemp] = useState(300);
  const clock = useExperimentClock();
  const ratio = gasRatios(temp);
  const speed = ratio.speed;
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = i * 2.39996;
    return {
      x:
        24 +
        reflectPosition(
          (i * 43) % 312,
          Math.cos(angle) * 42 * speed,
          clock.time,
          312,
        ),
      y:
        24 +
        reflectPosition(
          (i * 67) % 182,
          Math.sin(angle) * 42 * speed,
          clock.time,
          182,
        ),
    };
  });
  return (
    <div className="intro-experiment">
      <div className="gas-layout">
        <div className="experiment-stage">
          <svg
            viewBox="0 0 360 230"
            role="img"
            aria-label={T(
              "Schematic gas particles reflecting from container walls",
              "கொள்கலன் சுவர்களில் மோதித் திரும்பும் வாயுத் துகள்களின் விளக்கப்படம்",
            )}
          >
            <rect
              x="12"
              y="12"
              width="336"
              height="206"
              rx="8"
              fill="#eef2ff"
              stroke="#768cd2"
              strokeWidth="3"
            />
            {particles.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={i % 3 === 0 ? "#91b742" : "#5b75d3"}
              />
            ))}
          </svg>
          <Controls clock={clock} />
        </div>
        <div className="experiment-settings">
          <label>
            {T("Absolute temperature", "தனி வெப்பநிலை")}
            <strong>{temp} K</strong>
            <input
              type="range"
              min="150"
              max="600"
              step="25"
              value={temp}
              onChange={(e) => {
                setTemp(Number(e.target.value));
                clock.reset();
              }}
            />
          </label>
          <div className="fixed-conditions">
            {T(
              "Same gas · fixed number of particles · fixed volume",
              "ஒரே வாயு · நிலையான துகள் எண்ணிக்கை · நிலையான கனவளவு",
            )}
          </div>
          <div className="gas-meter">
            <span>
              {T("Pressure relative to 300 K", "300 K உடன் ஒப்பிட்ட அமுக்கம்")}
            </span>
            <strong>{ratio.pressure.toFixed(2)} ×</strong>
            <div className="ratio-track">
              <span style={{ width: `${(ratio.pressure / 2) * 100}%` }} />
            </div>
          </div>
          <div className="gas-meter">
            <span>
              {T(
                "Characteristic speed relative to 300 K",
                "300 K உடன் ஒப்பிட்ட சிறப்பியல்புக் கதி",
              )}
            </span>
            <strong>{ratio.speed.toFixed(2)} ×</strong>
          </div>
          <p className="model-equation">P ∝ T · vᵣₘₛ ∝ √T</p>
        </div>
      </div>
      <p className="experiment-insight">
        {T(
          "More energetic particle motion increases the momentum transferred to the walls. At fixed N and V, doubling absolute temperature doubles ideal-gas pressure.",
          "அதிக இயக்கச் சக்தியுள்ள துகள்கள் சுவர்களுக்கு மாற்றும் உந்தத்தை அதிகரிக்கின்றன. N மற்றும் V நிலையாக இருக்கையில் தனி வெப்பநிலையை இரட்டிப்பாக்குவது இலட்சிய வாயு அமுக்கத்தை இரட்டிப்பாக்கும்.",
        )}
      </p>
      <p className="simulation-assumption">
        {T(
          "Ideal-gas teaching model: 2D schematic, elastic wall reflections, no interparticle forces. It does not simulate a Maxwell speed distribution. Pressure is calculated from the ideal-gas relation, not measured from the animation.",
          "இலட்சிய வாயுக் கற்றல் மாதிரி: இருபரிமாண விளக்கப்படம்; மீள்தகைமைச் சுவர் மோதல்கள்; துகள்களுக்கிடையிலான விசைகள் இல்லை. மக்ஸ்வெல் கதிப் பரம்பல் உருவகப்படுத்தப்படவில்லை. அமுக்கம் இலட்சிய வாயுத் தொடர்பால் கணிக்கப்படுகிறது; அசைவூட்டத்திலிருந்து அளக்கப்படவில்லை.",
        )}
      </p>
    </div>
  );
}
