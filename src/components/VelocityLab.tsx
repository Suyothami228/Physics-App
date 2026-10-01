import { useEffect, useId, useState } from "react";
import { useApp } from "../state";
import {
  constantAcceleration,
  gravityRatio,
  journeyState,
} from "../domain/velocity";
import "../styles/velocity.css";

function usePlayback(duration: number) {
  const [fraction, setFraction] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      previous = 0;
    const tick = (now: number) => {
      if (previous)
        setFraction((f) =>
          Math.min(1, f + Math.min(now - previous, 100) / (duration * 1000)),
        );
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);
  useEffect(() => {
    if (fraction >= 1) setPlaying(false);
  }, [fraction]);
  return {
    fraction,
    playing,
    setFraction,
    setPlaying,
    reset: () => {
      setPlaying(false);
      setFraction(0);
    },
  };
}
type Playback = ReturnType<typeof usePlayback>;
function Controls({
  clock,
  time,
  max,
}: {
  clock: Playback;
  time: number;
  max: number;
}) {
  const { T } = useApp();
  return (
    <div className="velocity-controls">
      <button
        className="btn btn-blue"
        onClick={() => {
          if (clock.fraction >= 1) clock.setFraction(0);
          clock.setPlaying(!clock.playing);
        }}
      >
        {clock.playing
          ? T("Pause", "இடைநிறுத்து")
          : T("Play motion", "இயக்கத்தைத் தொடங்கு")}
      </button>
      <button className="btn btn-white" onClick={clock.reset}>
        {T("Reset", "மீட்டமை")}
      </button>
      <label>
        {T("Scrub time", "நேரத்தை மாற்றுக")} · {time.toFixed(2)} /{" "}
        {max.toFixed(2)} s
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={clock.fraction}
          onChange={(e) => {
            clock.setPlaying(false);
            clock.setFraction(+e.target.value);
          }}
        />
      </label>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  change,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  change: (v: number) => void;
}) {
  return (
    <label className="velocity-slider">
      {label} <strong>{value}</strong>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => change(+e.target.value)}
      />
    </label>
  );
}
export function VelocityLab({ kind }: { kind: string }) {
  if (kind === "velocity-journey") return <Journey />;
  if (kind === "velocity-circle") return <Circle />;
  return <Acceleration />;
}
function Journey() {
  const { T } = useApp();
  const [v1, setV1] = useState(60),
    [v2, setV2] = useState(30),
    [length, setLength] = useState(120),
    [three, setThree] = useState(false);
  const clock = usePlayback(10);
  const speeds = three ? [v1, v2, 10] : [v1, v2];
  const total = speeds.reduce((sum, v) => sum + length / v, 0);
  const time = clock.fraction * total;
  const state = journeyState(speeds, length, !three, time);
  const x = 60 + (580 * state.displacement) / (three ? 3 * length : length);
  function preset(first: number, second: number, third = false) {
    clock.reset();
    setV1(first);
    setV2(second);
    setThree(third);
  }
  return (
    <div className="velocity-lab">
      <div className="velocity-presets">
        <button
          aria-pressed={!three && v1 === 60 && v2 === 30}
          onClick={() => preset(60, 30)}
        >
          60 → 30 m/s
        </button>
        <button
          aria-pressed={!three && v1 === 40 && v2 === 10}
          onClick={() => preset(40, 10)}
        >
          40 → 10 m/s
        </button>
        <button aria-pressed={three} onClick={() => preset(60, 30, true)}>
          {T("Three equal legs", "மூன்று சம தூரங்கள்")} · 60 / 30 / 10
        </button>
      </div>
      <p>
        {three
          ? T(
              "Move from A to D through three equal distances. The final leg is at 10 m/s.",
              "A இலிருந்து D வரை மூன்று சம தூரங்களைக் கடக்கவும். இறுதிப் பகுதியின் கதி 10 m/s.",
            )
          : T(
              "Travel A → B → A. Right is positive. Watch distance grow while displacement returns to zero.",
              "A → B → A பயணம். வலப்புறம் நேர் திசை. தூரம் அதிகரிக்கும்போது இடப்பெயர்ச்சி மீண்டும் பூச்சியமாவதைக் கவனிக்கவும்.",
            )}
      </p>
      <div className="velocity-settings">
        <Slider
          label={T("First speed (m/s)", "முதல் கதி (m/s)")}
          value={v1}
          min={5}
          max={80}
          change={(v) => {
            clock.reset();
            setV1(v);
          }}
        />
        <Slider
          label={T("Second speed (m/s)", "இரண்டாம் கதி (m/s)")}
          value={v2}
          min={5}
          max={80}
          change={(v) => {
            clock.reset();
            setV2(v);
          }}
        />
        <Slider
          label={T("Each distance (m)", "ஒவ்வொரு தூரமும் (m)")}
          value={length}
          min={30}
          max={300}
          step={10}
          change={(v) => {
            clock.reset();
            setLength(v);
          }}
        />
      </div>
      <svg
        className="velocity-scene"
        viewBox="0 0 700 200"
        role="img"
        aria-label={T(
          "Moving particle on a straight track",
          "நேர்கோட்டுப் பாதையில் நகரும் துணிக்கை",
        )}
      >
        <path
          d="M60 105H640"
          stroke="#9eb1d0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path d={`M60 105H${x}`} stroke="#35dab7" strokeWidth="5" />
        {(three ? ["A", "B", "C", "D"] : ["A", "B"]).map((l, i, all) => (
          <g key={l}>
            <circle
              cx={60 + (i * 580) / (all.length - 1)}
              cy="105"
              r="5"
              fill="white"
            />
            <text
              x={60 + (i * 580) / (all.length - 1)}
              y="155"
              textAnchor="middle"
            >
              {l}
            </text>
          </g>
        ))}
        <g transform={`translate(${x},80)`}>
          <circle r="17" fill="#afed65" stroke="#133d50" strokeWidth="3" />
          <text y="6" textAnchor="middle" fill="#133d50">
            {state.velocity < 0 ? "←" : "→"}
          </text>
        </g>
        <text x="350" y="35" textAnchor="middle">
          {T("Displacement", "இடப்பெயர்ச்சி")} = {state.displacement.toFixed(1)}{" "}
          m
        </text>
      </svg>
      <Controls clock={clock} time={time} max={total} />
      <div className="velocity-stats">
        <Stat
          label={T("Distance", "தூரம்")}
          value={`${state.distance.toFixed(1)} m`}
        />
        <Stat
          label={T("Average speed so far", "இதுவரை சராசரிக் கதி")}
          value={
            state.averageSpeed === null
              ? "—"
              : `${state.averageSpeed.toFixed(2)} m/s`
          }
        />
        <Stat
          label={T("Average velocity so far", "இதுவரை சராசரி வேகம்")}
          value={
            state.averageVelocity === null
              ? "—"
              : `${state.averageVelocity.toFixed(2)} m/s`
          }
        />
      </div>
      <div className="velocity-insight">
        <strong>
          {T("Predict the complete journey", "முழுப் பயணத்தையும் கணிக்கவும்")}
        </strong>
        <p>
          t = {speeds.map((v) => `${length}/${v}`).join(" + ")} ={" "}
          {total.toFixed(2)} s
        </p>
        <p>
          {T("Average speed", "சராசரிக் கதி")} = {length * speeds.length} /{" "}
          {total.toFixed(2)} = {((length * speeds.length) / total).toFixed(2)}{" "}
          m/s
        </p>
        <p>
          {T("Average velocity", "சராசரி வேகம்")} ={" "}
          {three ? ((3 * length) / total).toFixed(2) : "0"} m/s.{" "}
          {T(
            "Average speed is total distance ÷ total time, not usually the arithmetic mean of the speeds.",
            "சராசரிக் கதி = மொத்தத் தூரம் ÷ மொத்த நேரம்; பொதுவாக கதிகளின் கூட்டுச் சராசரி அல்ல.",
          )}
        </p>
        <small>
          {T(
            "Playback is slowed or sped up to last 10 seconds; displayed time is physical time. Direction changes are idealized instantaneous turns.",
            "திரையில் இயக்கம் 10 செக்கன்களுக்கு ஒத்திசைக்கப்படுகிறது; காட்டப்படும் நேரம் பௌதிக நேரம். திருப்பம் உடனடியாக நிகழ்வதாக இலட்சியப்படுத்தப்பட்டுள்ளது.",
          )}
        </small>
      </div>
    </div>
  );
}
function Circle() {
  const { T } = useApp();
  const id = useId();
  const [radius, setRadius] = useState(10),
    [speed, setSpeed] = useState(5);
  const clock = usePlayback(12);
  const angle = clock.fraction * 2 * Math.PI;
  const period = (2 * Math.PI * radius) / speed,
    time = period * clock.fraction;
  const x = 235 + 105 * Math.cos(angle),
    y = 155 - 105 * Math.sin(angle);
  const dx = radius * (Math.cos(angle) - 1),
    dy = radius * Math.sin(angle);
  return (
    <div className="velocity-lab">
      <p>
        {T(
          "The green arrow is instantaneous velocity: always tangent to the circle. Constant speed does not mean constant velocity.",
          "பச்சை அம்பு கண வேகத்தைக் காட்டுகிறது: அது எப்போதும் வட்டத்தின் தொடுகோட்டுத் திசையில் உள்ளது. மாறாக் கதி என்பது மாறா வேகம் அல்ல.",
        )}
      </p>
      <div className="velocity-settings">
        <Slider
          label={T("Radius (m)", "ஆரை (m)")}
          value={radius}
          min={2}
          max={20}
          change={(v) => {
            clock.reset();
            setRadius(v);
          }}
        />
        <Slider
          label={T("Speed (m/s)", "கதி (m/s)")}
          value={speed}
          min={1}
          max={15}
          change={(v) => {
            clock.reset();
            setSpeed(v);
          }}
        />
      </div>
      <svg
        className="velocity-scene"
        viewBox="0 0 600 310"
        role="img"
        aria-label={T(
          "Circular path with tangent velocity and displacement chord",
          "தொடுகோட்டு வேகமும் இடப்பெயர்ச்சிக் காவியும் கொண்ட வட்டப் பாதை",
        )}
      >
        <defs>
          <marker
            id={id}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8" fill="#afed65" />
          </marker>
        </defs>
        <circle
          cx="235"
          cy="155"
          r="105"
          fill="none"
          stroke="#8197bb"
          strokeWidth="3"
          strokeDasharray="6 6"
        />
        <line
          x1="340"
          y1="155"
          x2={x}
          y2={y}
          stroke="#fdac81"
          strokeWidth="3"
        />
        <line
          x1={x}
          y1={y}
          x2={x - 65 * Math.sin(angle)}
          y2={y - 65 * Math.cos(angle)}
          stroke="#afed65"
          strokeWidth="4"
          markerEnd={`url(#${id})`}
        />
        <circle cx={x} cy={y} r="10" fill="#fff" />
        <text x="360" y="165">
          A
        </text>
        <text x="425" y="80" fill="#afed65">
          v = {speed} m/s
        </text>
        <text x="425" y="115">
          r = {radius} m
        </text>
      </svg>
      <Controls clock={clock} time={time} max={period} />
      <div className="velocity-stats">
        <Stat
          label={T("Distance", "தூரம்")}
          value={`${(radius * angle).toFixed(2)} m`}
        />
        <Stat
          label={T("Displacement magnitude", "இடப்பெயர்ச்சியின் பருமன்")}
          value={`${Math.hypot(dx, dy).toFixed(2)} m`}
        />
        <Stat
          label={T("Velocity components (x, y)", "வேகக் கூறுகள் (x, y)")}
          value={`(${(-speed * Math.sin(angle)).toFixed(2)}, ${(speed * Math.cos(angle)).toFixed(2)}) m/s`}
        />
      </div>
      <p className="velocity-insight">
        {T(
          "After one complete lap: displacement = 0 and average velocity = 0, but distance = 2πr and average speed remains v. The orange chord shows displacement; it is not the velocity arrow. +x is right, +y is up. Playback represents one lap in 12 seconds.",
          "ஒரு முழுச் சுற்றின் பின் இடப்பெயர்ச்சி = 0, சராசரி வேகம் = 0. ஆனால் தூரம் = 2πr; சராசரிக் கதி v ஆகவே உள்ளது. செம்மஞ்சள் நாண் இடப்பெயர்ச்சியைக் காட்டுகிறது; அது வேக அம்பு அல்ல. +x வலப்புறம், +y மேல்நோக்கி. திரையில் ஒரு சுற்று 12 செக்கன்களில் காட்டப்படுகிறது.",
        )}
      </p>
    </div>
  );
}
function Acceleration() {
  const { T } = useApp();
  const [u, setU] = useState(10),
    [a, setA] = useState(-2),
    [r, setR] = useState(1);
  const clock = usePlayback(8),
    time = 6 * clock.fraction;
  const state = constantAcceleration(u, a, time);
  const vmax = Math.max(Math.abs(u), Math.abs(u + a * 6), 1);
  const py = (v: number) => 125 - (90 * v) / vmax;
  const px = 60 + (time / 6) * 540;
  return (
    <div className="velocity-lab">
      <div className="velocity-presets">
        <button
          onClick={() => {
            clock.reset();
            setU(10);
            setA(-2);
          }}
        >
          {T("Slow down, then reverse", "வேகம் குறைந்து திசை மாறல்")}
        </button>
        <button
          onClick={() => {
            clock.reset();
            setU(0);
            setA(-9.81);
          }}
        >
          {T("Free fall: upward positive", "தடையின்றி வீழ்தல்: மேல் நேர் திசை")}
        </button>
      </div>
      <div className="velocity-settings">
        <Slider
          label={T("Initial velocity u (m/s)", "ஆரம்ப வேகம் u (m/s)")}
          value={u}
          min={-20}
          max={20}
          change={(v) => {
            clock.reset();
            setU(v);
          }}
        />
        <Slider
          label={T("Acceleration a (m/s²)", "ஆர்முடுகல் a (m/s²)")}
          value={a}
          min={-10}
          max={10}
          step={0.01}
          change={(v) => {
            clock.reset();
            setA(v);
          }}
        />
      </div>
      <p>
        {T(
          "On a velocity–time graph, slope is acceleration. Signed area gives displacement; area below zero is negative. Negative acceleration can increase speed when velocity is also negative.",
          "வேகம்–நேர வரைபின் சாய்வு ஆர்முடுகல் ஆகும். குறியுடன் கூடிய பரப்பளவு இடப்பெயர்ச்சியைத் தரும்; பூச்சியத்திற்குக் கீழுள்ள பரப்பு எதிரானது. வேகமும் எதிராக இருக்கும்போது எதிர் ஆர்முடுகல் கதியை அதிகரிக்கலாம்.",
        )}
      </p>
      <svg
        className="velocity-scene"
        viewBox="0 0 680 285"
        role="img"
        aria-label={T("Velocity versus time graph", "வேகம்–நேர வரைபு")}
      >
        <path
          d="M60 25V240M60 125H615"
          fill="none"
          stroke="#8097bb"
          strokeWidth="2"
        />
        <path
          d={`M60 125L60 ${py(u)}L${px} ${py(state.velocity)}L${px} 125Z`}
          fill="#35dab7"
          opacity="0.25"
        />
        <path
          d={`M60 ${py(u)}L600 ${py(u + 6 * a)}`}
          stroke="#afed65"
          strokeWidth="3"
        />
        <circle cx={px} cy={py(state.velocity)} r="8" fill="#fff" />
        <text x="14" y="20">
          v (m/s)
        </text>
        <text x="595" y="265">
          t (s)
        </text>
        <text x="35" y="130">
          0
        </text>
        <text x="60" y="260">
          0
        </text>
        <text x="600" y="260">
          6
        </text>
        <text x="12" y="40">
          {vmax.toFixed(1)}
        </text>
        <text x="6" y="220">
          −{vmax.toFixed(1)}
        </text>
      </svg>
      <Controls clock={clock} time={time} max={6} />
      <div className="velocity-stats">
        <Stat
          label={T("Velocity v = u + at", "வேகம் v = u + at")}
          value={`${state.velocity.toFixed(2)} m/s`}
        />
        <Stat
          label={T("Speed |v|", "கதி |v|")}
          value={`${Math.abs(state.velocity).toFixed(2)} m/s`}
        />
        <Stat
          label={T("Displacement ut + ½at²", "இடப்பெயர்ச்சி ut + ½at²")}
          value={`${state.displacement.toFixed(2)} m`}
        />
      </div>
      <p>
        {T(
          "Constant acceleration model; no air resistance or ground collision. Playback: 6 physical seconds in 8 screen seconds. Near Earth's surface, g ≈ 9.81 m/s² downward; use 10 only when the question permits it.",
          "மாறா ஆர்முடுகல் மாதிரி; காற்றுத் தடையும் தரை மோதலும் இல்லை. 6 பௌதிக செக்கன்கள் திரையில் 8 செக்கன்கள். பூமியின் மேற்பரப்புக்கு அருகில் g ≈ 9.81 m/s² கீழ்நோக்கி; வினா அனுமதித்தால் மட்டும் 10 என எடுக்கவும்.",
        )}
      </p>
      <div className="velocity-insight">
        <h3>
          {T(
            "How does gravity change with radius?",
            "ஆரையுடன் ஈர்ப்பு எவ்வாறு மாறுகிறது?",
          )}
        </h3>
        <Slider
          label="r / R"
          value={r}
          min={0}
          max={3}
          step={0.05}
          change={setR}
        />
        <strong>g / g₀ = {gravityRatio(r).toFixed(3)}</strong>
        <p>{r <= 1 ? "g / g₀ = r / R" : "g / g₀ = (R / r)²"}</p>
        <p>
          {T(
            "Here r is distance from Earth's centre. The inside relation assumes a uniform-density sphere; it is not an exact model of the real Earth. Outside a spherical Earth, gravity follows the inverse-square law. At the Moon's surface, g is about one-sixth of Earth's, so weight changes but mass does not.",
            "இங்கு r பூமியின் மையத்திலிருந்து உள்ள தூரம். உட்புறத் தொடர்பு சீரான அடர்த்தியுள்ள கோளத்திற்குரியது; உண்மையான பூமியின் துல்லிய மாதிரி அல்ல. கோளப் பூமிக்கு வெளியே ஈர்ப்பு தூரத்தின் வர்க்கத்திற்கு நேர்மாறானது. சந்திர மேற்பரப்பில் g பூமியின் சுமார் ஆறில் ஒரு பங்கு; நிறை மாறும், திணிவு மாறாது.",
          )}
        </p>
      </div>
    </div>
  );
}
