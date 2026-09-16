import { useEffect, useRef, useState } from "react";
import { draw, solve, type Parameters } from "../physics";
import { useApp } from "../state";
export function Simulation() {
  const { T, language } = useApp();
  const [p, setP] = useState<Parameters>({ speed: 18, angle: 40, height: 5 });
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [vectors, setVectors] = useState(true);
  const [answer, setAnswer] = useState<number | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const s = solve(p);
  useEffect(() => {
    if (!running) return;
    let frame = 0,
      last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      setTime((t) => Math.min(t + dt, s.flight));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, s.flight]);
  useEffect(() => {
    if (time >= s.flight) setRunning(false);
  }, [time, s.flight]);
  useEffect(() => {
    const paint = () => {
      if (canvas.current) draw(canvas.current, p, s, time, vectors, language);
    };
    paint();
    const observer = new ResizeObserver(paint);
    if (canvas.current) observer.observe(canvas.current);
    return () => observer.disconnect();
  }, [p, time, vectors, language]);
  function change(key: keyof Parameters, value: number) {
    setRunning(false);
    setTime(0);
    setP((p) => ({ ...p, [key]: value }));
  }
  return (
    <>
      <div className="workspace">
        <section className="lab">
          <div className="lab-top">
            <span>{T("Experiment", "பரிசோதனை")}</span>
            <label className="check">
              <input
                type="checkbox"
                checked={vectors}
                onChange={(e) => setVectors(e.target.checked)}
              />
              {T("Velocity vectors", "வேகக் கூறுகள்")}
            </label>
          </div>
          <div className="canvas-wrap">
            <canvas
              ref={canvas}
              aria-label={T(
                "Projectile trajectory simulation",
                "எறிய இயக்கப் பாதை",
              )}
            />
            <div className="scene-note">
              {T("No air resistance", "வளித்தடை புறக்கணிக்கப்படுகிறது")} · g =
              9.81 m/s²
            </div>
          </div>
          <div className="transport">
            <button
              className="primary"
              onClick={() => {
                if (time >= s.flight) setTime(0);
                setRunning(!running);
              }}
            >
              {running ? T("Pause", "இடைநிறுத்து") : T("▶ Launch", "▶ இயக்குக")}
            </button>
            <button
              className="secondary"
              onClick={() => {
                setTime(0);
                setRunning(false);
              }}
            >
              {T("Reset", "மீட்டமை")}
            </button>
            <span id="clock">t = {time.toFixed(2)} s</span>
          </div>
          <div className="metrics">
            {[
              [T("Flight time", "பறக்கும் நேரம்"), s.flight, "s"],
              [T("Horizontal range", "கிடைத் தூரம்"), s.range, "m"],
              [T("Peak height", "அதிகபட்ச உயரம்"), s.peak, "m"],
            ].map(([label, value, unit]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>
                  {Number(value).toFixed(2)} {unit}
                </strong>
              </div>
            ))}
          </div>
        </section>
        <aside className="controls">
          <div className="section-label">
            01 {T("SET THE CONDITIONS", "அமைப்புகளை மாற்றுக")}
          </div>
          {(["speed", "angle", "height"] as const).map((key, i) => (
            <div className="control" key={key}>
              <label htmlFor={key}>
                {
                  [
                    T("Initial speed", "ஆரம்ப வேகம்"),
                    T("Launch angle", "எறிகோணம்"),
                    T("Starting height", "ஆரம்ப உயரம்"),
                  ][i]
                }
              </label>
              <output>
                {p[key]} {["m/s", "°", "m"][i]}
              </output>
              <input
                id={key}
                type="range"
                min={i === 0 ? 5 : 0}
                max={[30, 80, 20][i]}
                value={p[key]}
                onChange={(e) => change(key, Number(e.target.value))}
              />
            </div>
          ))}
          <button
            className="preset"
            onClick={() => {
              setP({ ...p, angle: 0, height: 10 });
              setTime(0);
              setRunning(false);
            }}
          >
            {T("Try a horizontal launch →", "கிடையாக எறிந்து பாருங்கள் →")}
          </button>
        </aside>
      </div>
      <div className="learning">
        <section className="equations">
          <h2>
            {T("Two directions. One motion.", "இரு திசைகள். ஒரே இயக்கம்.")}
          </h2>
          <p>
            {T(
              "Horizontal velocity stays constant. Gravity changes vertical velocity.",
              "கிடை வேகம் மாறாது. ஈர்ப்பினால் நிலைக்குத்து வேகம் மாறுகிறது.",
            )}
          </p>
          <div className="formula">
            <code>x = (u cos θ)t</code>
          </div>
          <div className="formula">
            <code>y = h + (u sin θ)t − ½gt²</code>
          </div>
        </section>
        <section className="quiz">
          <h2>
            {T("What if you double the speed?", "வேகத்தை இரட்டிப்பாக்கினால்?")}
          </h2>
          <p>
            {T(
              "For a horizontal launch from the same height, what happens to the time to reach the ground?",
              "ஒரே உயரத்திலிருந்து கிடையாக எறியும்போது, தரையை அடையும் நேரம் என்னவாகும்?",
            )}
          </p>
          <div className="answers">
            {[
              T("It doubles", "இரட்டிப்பாகும்"),
              T("It stays the same", "மாறாது"),
              T("It halves", "பாதியாகும்"),
            ].map((a, i) => (
              <button
                key={i}
                className={answer === i ? "selected" : ""}
                onClick={() => setAnswer(i)}
              >
                {a}
              </button>
            ))}
          </div>
          {answer !== null && (
            <p role="status">
              {answer === 1
                ? T(
                    "Correct. Vertical motion determines flight time.",
                    "சரி. நிலைக்குத்து இயக்கமே பறக்கும் நேரத்தை நிர்ணயிக்கிறது.",
                  )
                : T(
                    "Try again: horizontal speed does not change vertical motion.",
                    "மீண்டும் முயலுங்கள்: கிடை வேகம் நிலைக்குத்து இயக்கத்தை மாற்றாது.",
                  )}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
