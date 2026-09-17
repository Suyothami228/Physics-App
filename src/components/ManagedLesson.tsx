import { TravellingLab } from "./TravellingLab";
import { SpherometerLab } from "./SpherometerLab";
import { useEffect, useState } from "react";
import type { Lesson } from "../model";
import { useApp } from "../state";
import { API_ENABLED, request } from "../api";
import measurement from "../domain/measurement.json";
import { MeasurementActivity } from "./MeasurementActivity";
import { Outline } from "./Pages";
import { VisualExplanation } from "./VisualExplanation";
import { UnitReference } from "./UnitLearning";
import { CaliperAnatomy } from "./CaliperAnatomy";
import { MicrometerLab } from "./MicrometerLab";
export type ContentBlock = {
  id?: number;
  key: string;
  instrument?: string;
  kind: string;
  title_en: string;
  title_ta: string;
  body_en?: string;
  body_ta?: string;
  formula?: string;
  presentation?: string;
  activity?: string;
  options_en?: string;
  options_ta?: string;
  correct_option?: number;
  explanation_en?: string;
  explanation_ta?: string;
};
export function ManagedLesson({
  lesson,
  hideEmpty = false,
  instrument,
}: {
  lesson: Lesson;
  hideEmpty?: boolean;
  instrument?: string;
}) {
  const { T, language } = useApp();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("learn");
  const [motionPaused, setMotionPaused] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    async function load() {
      try {
        const data = API_ENABLED
          ? await request<{ blocks: ContentBlock[] }>(
              "lessons/" + encodeURIComponent(lesson.id),
            )
          : {
              blocks:
                (measurement as Record<string, ContentBlock[]>)[lesson.id] ??
                [],
            };
        if (active)
          setBlocks(
            instrument
              ? data.blocks.filter(
                  (b) =>
                    (b.instrument ||
                      (b.key.startsWith("caliper-") || b.activity === "vernier"
                        ? "vernier"
                        : "")) === instrument,
                )
              : data.blocks,
          );
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load lesson");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [lesson.id, reload, instrument]);
  if (loading)
    return <p role="status">{T("Loading lesson…", "பாடம் ஏற்றப்படுகிறது…")}</p>;
  if (error)
    return (
      <div className="empty-state" role="alert">
        <p>{error}</p>
        <button
          className="btn btn-blue"
          onClick={() => setReload((x) => x + 1)}
        >
          {T("Try again", "மீண்டும் முயல்க")}
        </button>
      </div>
    );
  if (!blocks.length && !instrument)
    return hideEmpty ? null : <Outline lesson={lesson} />;
  const filtered = blocks.filter((b) =>
    stage === "learn"
      ? ["theory", "example"].includes(b.kind)
      : stage === "explore"
        ? b.kind === "activity"
        : b.kind === "check",
  );
  return (
    <div
      className={
        "managed-lesson" + (motionPaused ? " concept-motion-paused" : "")
      }
    >
      <div className="content-toolbar">
        <div
          className="filters"
          role="group"
          aria-label={T("Lesson sections", "பாடப் பகுதிகள்")}
        >
          {[
            ["learn", T("01 Understand", "01 புரிதல்")],
            ["explore", T("02 Explore", "02 ஆராய்க")],
            ["check", T("03 Quick checks", "03 சிறு சோதனைகள்")],
          ].map(([key, label]) => (
            <button
              key={key}
              className={stage === key ? "selected" : ""}
              aria-pressed={stage === key}
              onClick={() => setStage(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {stage === "learn" &&
          filtered.some(
            (b) => b.presentation && b.presentation !== "plain",
          ) && (
            <button
              className="text-link motion-control"
              aria-pressed={motionPaused}
              onClick={() => setMotionPaused((paused) => !paused)}
            >
              {motionPaused
                ? T("Resume animations", "அசைவூட்டங்களைத் தொடர்க")
                : T("Pause animations", "அசைவூட்டங்களை நிறுத்துக")}
            </button>
          )}
        <button
          className="text-link refresh-content"
          onClick={() => setReload((x) => x + 1)}
        >
          {T("Refresh content", "உள்ளடக்கத்தை மீளேற்று")}
        </button>
      </div>
      <p className="content-review">
        {T(
          "Learning edition · Tamil terminology and curriculum mapping await educator review.",
          "கற்றல் பதிப்பு · தமிழ் கலைச்சொற்களும் பாடத்திட்டப் பொருத்தமும் ஆசிரியர் மீளாய்வில் உள்ளன.",
        )}
      </p>
      {instrument === "vernier" && stage === "learn" && blocks.length > 0 && (
        <CaliperAnatomy />
      )}
      {instrument === "micrometer" &&
        stage === "learn" &&
        blocks.length > 0 && <MicrometerLab anatomy />}
      {instrument === "spherometer" &&
        stage === "learn" &&
        blocks.length > 0 && <SpherometerLab anatomy />}
      {instrument === "travelling" &&
        stage === "learn" &&
        blocks.length > 0 && <TravellingLab anatomy />}
      {filtered.length ? (
        filtered.map((block) => (
          <article
            className={"content-block block-" + block.kind}
            key={block.key}
          >
            <span className="eyebrow">
              {block.kind === "example"
                ? T("WORKED EXAMPLE", "விளக்கிய எடுத்துக்காட்டு")
                : block.kind === "check"
                  ? T("TRY IT YOURSELF", "நீங்களே முயல்க")
                  : block.kind === "activity"
                    ? T("CHANGE IT. OBSERVE IT.", "மாற்றுக. அவதானிக்கவும்.")
                    : T("THE IDEA", "கருத்து")}
            </span>
            <h2>{block[("title_" + language) as "title_en" | "title_ta"]}</h2>
            {(block.body_en || block.body_ta) &&
              (block.presentation === "table" ? (
                <UnitReference block={block} />
              ) : block.presentation && block.presentation !== "plain" ? (
                <VisualExplanation block={block} />
              ) : (
                <p className="lesson-prose">
                  {block[language === "ta" ? "body_ta" : "body_en"]}
                </p>
              ))}
            {block.formula && (
              <div className="lesson-formula">{block.formula}</div>
            )}
            {block.kind === "activity" && (
              <MeasurementActivity kind={block.activity ?? ""} />
            )}{" "}
            {block.kind === "check" && <QuickCheck block={block} />}
          </article>
        ))
      ) : (
        <div className="empty-state">
          <h2>
            {instrument
              ? T(
                  "This section is being prepared",
                  "இப்பகுதி தயாரிக்கப்படுகிறது",
                )
              : T("Reason it through", "சிந்தித்து விளக்குங்கள்")}
          </h2>
          <p>
            {instrument
              ? T(
                  "We will add this instrument’s explanations, activities and questions as we develop it. Choose another section or return to the instrument list.",
                  "இக்கருவியை உருவாக்கும்போது விளக்கங்கள், பயிற்சிகள், வினாக்கள் சேர்க்கப்படும். வேறு பகுதியைத் தேர்க அல்லது கருவிப் பட்டியலுக்குத் திரும்புக.",
                )
              : T(
                  "Use the worked example in Understand. Explain each step and its assumptions before checking the answer.",
                  "புரிதல் பகுதியில் உள்ள எடுத்துக்காட்டைப் பயன்படுத்துக. விடையைச் சோதிக்கும் முன் ஒவ்வொரு படியையும் அதன் எடுகோள்களையும் விளக்குக.",
                )}
          </p>
        </div>
      )}
      {stage === "check" && (
        <p className="content-review">
          {T(
            "These original formative questions give feedback only. They do not award chapter mastery or change your exam-readiness score.",
            "இவை பின்னூட்டத்திற்கான புதிய கற்றல் வினாக்கள். இவை அத்தியாயத் தேர்ச்சி அல்லது தேர்வுத் தயார்நிலை மதிப்பெண்ணை வழங்காது.",
          )}
        </p>
      )}
      <div className="lesson-pagination">
        <a
          className="btn btn-white"
          href={"#/chapter/" + lesson.id.split("/")[0]}
        >
          ← {T("Back to chapter", "அத்தியாயத்திற்குத் திரும்புக")}
        </a>
        <a
          className="text-link"
          href="https://e-thaksalawa.moe.gov.lk/lcms/course/view.php?id=263"
          target="_blank"
          rel="noreferrer"
        >
          {T("Curriculum reference ↗", "பாடத்திட்ட மேற்கோள் ↗")}
        </a>
      </div>
    </div>
  );
}
function QuickCheck({ block }: { block: ContentBlock }) {
  const { T, language } = useApp();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const options = (block[language === "ta" ? "options_ta" : "options_en"] ?? "")
    .trim()
    .split("\n");
  return (
    <div>
      <fieldset className="quick-options">
        <legend>{T("Choose an answer", "விடையைத் தேர்ந்தெடுக்கவும்")}</legend>
        {options.map((o, i) => (
          <label key={i}>
            <input
              type="radio"
              name={"check-" + block.key}
              checked={choice === i + 1}
              onChange={() => {
                setChoice(i + 1);
                setChecked(false);
              }}
            />
            {o}
          </label>
        ))}
      </fieldset>
      <button
        className="btn btn-blue"
        disabled={choice === null}
        onClick={() => setChecked(true)}
      >
        {T("Check my answer", "விடையைச் சரிபார்")}
      </button>
      {checked && (
        <div
          className={
            "quick-feedback " +
            (choice === block.correct_option ? "is-correct" : "")
          }
          role="status"
        >
          <strong>
            {choice === block.correct_option
              ? T("Correct — here is why.", "சரி — காரணம் இதோ.")
              : T(
                  "Review the reasoning, then try again.",
                  "விளக்கத்தைப் பார்த்து மீண்டும் முயல்க.",
                )}
          </strong>
          <p>
            {block[language === "ta" ? "explanation_ta" : "explanation_en"]}
          </p>
        </div>
      )}
    </div>
  );
}
