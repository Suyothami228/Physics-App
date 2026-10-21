import { lazy, Suspense, useEffect, useState } from "react";
import { useApp } from "../state";
const RelativeScene = lazy(() => import("./RelativeScene"));
export function RelativeConcept({
  concept,
  paused = false,
}: {
  concept: string;
  paused?: boolean;
}) {
  const { T } = useApp();
  const [alternate, setAlternate] = useState(false),
    [p, setP] = useState(0),
    [playing, setPlaying] = useState(false);
  const boat = concept === "relative-opposite-bank";
  const opposite = concept === "relative-opposite";
  useEffect(() => {
    if (!playing || paused) return;
    let frame = 0,
      last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 80) : 0;
      last = now;
      setP((v) => Math.min(1, v + dt / 10000));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, paused]);
  useEffect(() => {
    if (paused) setPlaying(false);
  }, [paused]);
  useEffect(() => {
    if (p >= 1) setPlaying(false);
  }, [p]);
  return (
    <div className="math-lab relative-concept">
      <div className="math-preset-row relative-playbar">
        <button
          disabled={paused}
          onClick={() => {
            if (p >= 1) setP(0);
            setPlaying(!playing);
          }}
        >
          {playing
            ? T("Pause", "நிறுத்துக")
            : T("Play 3D animation", "3D அசைவூட்டத்தை இயக்குக")}
        </button>
        <button
          onClick={() => {
            setP(0);
            setPlaying(false);
          }}
        >
          {T("Reset", "மீட்டமை")}
        </button>
      </div>
      <Suspense fallback={<p>{T("Loading 3D…", "3D ஏற்றப்படுகிறது…")}</p>}>
        <RelativeScene
          boat={boat}
          a={opposite ? [0, 40] : [30, 0]}
          b={opposite ? [0, -12] : [18, 0]}
          observer={
            alternate && !boat ? (opposite ? [0, -12] : [18, 0]) : [0, 0]
          }
          p={p}
          angle={alternate ? (Math.asin(3 / 5) * 180) / Math.PI : 0}
          width={1200}
          current={3}
          time={alternate ? 300 : 240}
          drift={alternate ? 0 : 720}
        />
      </Suspense>
      <p>
        {boat
          ? alternate
            ? T(
                "Directly opposite: 300 s, no downstream drift",
                "நேர் எதிரே: 300 s, கீழோட்ட விலகல் இல்லை",
              )
            : T(
                "Shortest time: 240 s, drift 720 m",
                "மிகக் குறைந்த நேரம்: 240 s, விலகல் 720 m",
              )
          : T(
              `Observer: ${alternate ? "B" : "Earth E"} · A: ${alternate ? (opposite ? 52 : 12) : opposite ? 40 : 30} m/s · B: ${alternate ? 0 : opposite ? -12 : 18} m/s`,
              `நோக்குநர்: ${alternate ? "B" : "பூமி E"} · A: ${alternate ? (opposite ? 52 : 12) : opposite ? 40 : 30} m/s · B: ${alternate ? 0 : opposite ? -12 : 18} m/s`,
            )}
      </p>
      <button
        aria-pressed={alternate}
        onClick={() => {
          setAlternate(!alternate);
          setP(0);
          setPlaying(false);
        }}
      >
        {boat
          ? T(
              "Switch: shortest time / directly opposite",
              "மாற்றுக: மிகக் குறைந்த நேரம் / நேர் எதிரே",
            )
          : T("Switch observer: Earth / B", "நோக்குநரை மாற்றுக: பூமி / B")}
      </button>
      <label>
        {T("Time progress", "நேர முன்னேற்றம்")}
        <input
          aria-label={T("Time progress", "நேர முன்னேற்றம்")}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={p}
          onChange={(e) => {
            setP(+e.target.value);
            setPlaying(false);
          }}
        />
      </label>
    </div>
  );
}
