import { useEffect, useRef, useState } from "react";
import { useApp } from "../state";
import { explainers, type VideoStep } from "../domain/explainers";
import "../styles/explainers.css";
export function ManimExplainer({
  name,
  url,
  steps: custom,
  paused = false,
}: {
  name?: string;
  url?: string;
  steps?: VideoStep[];
  paused?: boolean;
}) {
  const { T, language } = useApp();
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0),
    [failed, setFailed] = useState(false),
    [playing, setPlaying] = useState(false);
  const preset = explainers[name || ""];
  const source = url || preset?.src;
  const steps = custom?.length ? custom : url ? [] : preset?.steps || [];
  useEffect(() => {
    if (paused) video.current?.pause();
  }, [paused]);
  useEffect(() => {
    setFailed(false);
    setTime(0);
    setPlaying(false);
  }, [source]);
  if (!source) return null;
  const index = Math.max(
    0,
    steps.reduce((last, step, i) => (step.time <= time ? i : last), 0),
  );
  const seek = (i: number) => {
    const el = video.current;
    if (el && steps[i]) {
      el.pause();
      el.currentTime = steps[i].time;
      setTime(steps[i].time);
    }
  };
  return (
    <section
      className="manim-explainer"
      aria-label={T("Animated explanation", "அசைவூட்ட விளக்கம்")}
    >
      <div className="manim-heading">
        <strong>
          {T("Watch the idea unfold", "கருத்து உருவாகுவதைக் காண்க")}
        </strong>
        <span>{T("Step-by-step explanation", "படிப்படியான விளக்கம்")}</span>
      </div>
      <video
        ref={video}
        key={source}
        controls
        playsInline
        preload="metadata"
        src={source}
        poster={url ? undefined : preset?.poster}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={() => {
          if (paused) video.current?.pause();
          else setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
        aria-label={T(
          "Physics explanation video; captions below",
          "பௌதிக விளக்கக் காணொளி; வசனங்கள் கீழே",
        )}
      />
      {failed ? (
        <p role="alert">
          {T(
            "This video could not load. You can still read the explanation steps below and use Explore.",
            "காணொளியை ஏற்ற முடியவில்லை. கீழுள்ள விளக்கப் படிகளை வாசித்து ஆராய்க பகுதியைப் பயன்படுத்தலாம்.",
          )}
        </p>
      ) : (
        <div className="math-preset-row">
          <button
            disabled={paused}
            onClick={() => {
              if (!video.current) return;
              if (playing) video.current.pause();
              else void video.current.play().catch(() => setFailed(true));
            }}
          >
            {playing
              ? T("Pause", "நிறுத்துக")
              : T("Play explanation", "விளக்கத்தை இயக்குக")}
          </button>
          <button
            onClick={() => {
              video.current?.pause();
              if (video.current) video.current.currentTime = 0;
              setTime(0);
            }}
          >
            {T("Replay from start", "முதலிலிருந்து மீள்பார்க்க")}
          </button>
        </div>
      )}
      {steps.length > 0 && (
        <>
          <p className="manim-caption">{steps[index][language]}</p>
          <nav
            className="manim-steps"
            aria-label={T("Explanation steps", "விளக்கப் படிகள்")}
          >
            {steps.map((step, i) => (
              <button
                key={i}
                aria-current={i === index ? "step" : undefined}
                onClick={() => seek(i)}
              >
                {i + 1}
                <span>{step.time}s</span>
              </button>
            ))}
          </nav>
          <details>
            <summary>
              {T("Read the full explanation", "முழு விளக்கத்தையும் வாசிக்க")}
            </summary>
            <ol>
              {steps.map((step, i) => (
                <li key={i}>{step[language]}</li>
              ))}
            </ol>
          </details>
        </>
      )}
    </section>
  );
}
