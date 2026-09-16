import { useState, type CSSProperties } from "react";
import { C, B, link, type Chapter, type Lesson } from "../model";
import { useApp } from "../state";
import { Heading, Icon, ButtonLink, ChapterCard, Trajectory } from "./UI";
export function Home() {
  const { T, history, score: s, last, language } = useApp();
  const attempts = history.filter((a) => !a.viewed);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    date.setHours(0, 0, 0, 0);
    return {
      day: date.getDate(),
      count: attempts.filter((a) => a.at >= +date && a.at < +date + 86400000)
        .length,
    };
  });
  const max = Math.max(4, ...days.map((d) => d.count));
  const recent = C.getLesson(...(last.split("/") as [string, string]));
  return (
    <>
      <Heading
        kicker={T("MAKE ROOM FOR DISCOVERY", "இன்று புதிதாகக் கண்டறிவோம்")}
        title={T(
          "Small steps. Big understanding.",
          "சிறு முயற்சி. ஆழமான புரிதல்.",
        )}
        description={T(
          "Your physics journey, one idea at a time.",
          "உங்கள் பௌதிகவியல் பயணம், ஒவ்வொரு கருத்தாக.",
        )}
        action={
          <ButtonLink to="#/chapters" kind="btn-dark">
            {T("Explore chapters", "பாடங்களை ஆராய்க")}
          </ButtonLink>
        }
      />
      <div className="home-grid">
        <section className="continue-card">
          <div className="continue-copy">
            <span className="pill">
              {T("YOUR NEXT EXPERIMENT", "உங்கள் அடுத்த பரிசோதனை")}
            </span>
            <p className="tiny-label">02 / {T("MECHANICS", "பொறியியல்")}</p>
            <h2>{T("Make the leap.", "எறிந்து பாருங்கள்.")}</h2>
            <p>
              {T(
                "Change the angle. Follow the motion. Find out why.",
                "கோணத்தை மாற்றுங்கள். இயக்கத்தைக் கவனியுங்கள். காரணத்தைக் கண்டறியுங்கள்.",
              )}
            </p>
            <ButtonLink to={link("02", "projectile")} kind="btn-lime">
              {T("Continue learning", "கற்றலைத் தொடர்க")}
            </ButtonLink>
          </div>
          <div className="continue-visual">
            <Trajectory />
            <span className="visual-caption">PROJECTILE MOTION</span>
          </div>
        </section>
        <section className="activity-card">
          <div className="section-title">
            <h2>{T("Your week", "இந்த வாரம்")}</h2>
            <span className="subtle">{T("7 days", "7 நாட்கள்")}</span>
          </div>
          <div
            className="activity-chart"
            aria-label={days.map((d) => `${d.day}: ${d.count}`).join(", ")}
            role="img"
          >
            {days.map((d, i) => (
              <div className="day" key={i}>
                <span>{d.count || "·"}</span>
                <div className="bar-slot">
                  <i
                    className={i === 6 ? "today" : ""}
                    style={{
                      height: Math.max(4, (d.count / max) * 100) + "%",
                      opacity: d.count ? 1 : 0.16,
                    }}
                  />
                </div>
                <small>{d.day}</small>
              </div>
            ))}
          </div>
          <p>
            {T(
              "Questions answered each day.",
              "ஒவ்வொரு நாளும் விடையளித்த வினாக்கள்.",
            )}
          </p>
        </section>
      </div>
      <div className="stats-row">
        {[
          [
            attempts.length,
            T("Answers checked", "சரிபார்த்த விடைகள்"),
            "practice",
            "blue",
          ],
          [
            s.total ? s.accuracy + "%" : "—",
            T("Independent accuracy", "உதவியற்ற துல்லியம்"),
            "progress",
            "purple",
          ],
          [
            `${s.total ? 1 : 0} / ${C.total}`,
            T("Subchapters assessed", "மதிப்பிட்ட உட்பாடங்கள்"),
            "chapters",
            "green",
          ],
        ].map(([value, text, icon, color]) => (
          <div className="stat" key={String(text)}>
            <span className={"stat-icon " + color}>
              <Icon name={String(icon)} />
            </span>
            <div>
              <strong>{value}</strong>
              <span>{text}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="lower-home">
        <section>
          <div className="section-title">
            <h2>
              {T("A whole world to explore", "ஆராயக் காத்திருக்கும் உலகம்")}
            </h2>
            <a href="#/chapters" className="text-link">
              {T("All 11 chapters", "11 பாடங்களும்")} ↗
            </a>
          </div>
          <div className="home-chapters">
            {C.chapters.slice(0, 3).map((c) => (
              <ChapterCard key={c.id} chapter={c} />
            ))}
          </div>
        </section>
        <section className="focus-card">
          <span className="eyebrow">{T("YOUR NEXT MOVE", "அடுத்த படி")}</span>
          <h2>
            {s.ready
              ? T(
                  "Make space for another topic.",
                  "வேறு தலைப்புக்கும் நேரம் ஒதுக்கலாம்.",
                )
              : T("Understanding before speed.", "வேகத்திற்கு முன் புரிதல்.")}
          </h2>
          <p>
            {T(
              "Try different question styles. Your study plan adapts to your evidence.",
              "பல வகை வினாக்களை முயலுங்கள். உங்கள் பெறுபேறுகளுக்கேற்ப கற்றல் திட்டம் மாறும்.",
            )}
          </p>
          <ButtonLink to="#/progress" kind="btn-white">
            {T("See my progress", "முன்னேற்றத்தைப் பார்க்க")}
          </ButtonLink>
          <div className="focus-note">
            {T(
              "Currently assessing projectile motion only.",
              "தற்போது எறிய இயக்கம் மட்டும் மதிப்பிடப்படுகிறது.",
            )}
          </div>
        </section>
      </div>
      {recent && !recent.available && (
        <div className="last-outline">
          {T("Last explored", "கடைசியாக ஆராய்ந்தது")}:{" "}
          <a href={link(...(last.split("/") as [string, string]))}>
            {recent[language]} ↗
          </a>
        </div>
      )}
    </>
  );
}
export function Explorer() {
  const { T, language, saved } = useApp();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const matches = C.chapters.filter(
    (c) =>
      (filter !== "available" || c.lessons.some((l) => l.available)) &&
      (filter !== "saved" || c.lessons.some((l) => saved.includes(l.id))) &&
      [c.ta, c.en, ...c.lessons.flatMap((l) => [l.ta, l.en])].some((t) =>
        t.toLowerCase().includes(query.trim().toLowerCase()),
      ),
  );
  return (
    <>
      <Heading
        kicker={T("THE CHAPTER EXPLORER", "பாடங்களை ஆராய்க")}
        title={T("Follow your curiosity.", "உங்கள் ஆர்வத்தைத் தொடருங்கள்.")}
        description={T(
          `11 chapters. ${C.total} subchapter workspaces.`,
          `11 பாடங்கள். ${C.total} உட்பாடப் பக்கங்கள்.`,
        )}
      />
      <div className="explore-tools">
        <label className="search-field">
          <Icon name="search" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={T("Search chapters", "பாடங்களைத் தேடுக")}
            placeholder={T(
              "Find a chapter or concept…",
              "பாடம் அல்லது கருத்தைத் தேடுக…",
            )}
          />
        </label>
        <div className="filters">
          {[
            ["all", "All chapters", "அனைத்தும்"],
            ["available", "With learning content", "கற்றல் உள்ளடக்கம் உள்ளது"],
            ["saved", "Saved", "சேமித்தவை"],
          ].map(([id, en, ta]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={filter === id ? "selected" : ""}
            >
              {T(en, ta)}
            </button>
          ))}
        </div>
      </div>
      <p className="outline-note">
        {T(
          "Chapter order follows e-thaksalawa. Subtopics are draft groupings awaiting educator review. Measurement lessons and a projectile lab are available; other pages remain outlines.",
          "பாட வரிசை e-thaksalawa அடிப்படையிலானது. உட்பாடத் தொகுப்புக்கு ஆசிரியர் மீளாய்வு தேவை. அளவீட்டுப் பாடங்களும் எறிய இயக்க ஆய்வகமும் உள்ளன; ஏனைய பக்கங்கள் வரைவுகள்.",
        )}
      </p>
      <p className="results-count" role="status">
        {matches.length} {T("chapters", "பாடங்கள்")}
      </p>
      <div className="chapter-grid">
        {matches.map((c) => (
          <ChapterCard key={c.id} chapter={c} />
        ))}
      </div>
      {!matches.length && (
        <div className="empty-state">
          <h2>{T("No chapters found", "பாடங்கள் கிடைக்கவில்லை")}</h2>
          <p>
            {T(
              "Try another search or select All chapters.",
              "வேறு சொல்லைத் தேடவும் அல்லது அனைத்தையும் தேர்க.",
            )}
          </p>
        </div>
      )}
    </>
  );
}
export function ChapterPage({ chapter: c }: { chapter: Chapter }) {
  const { T, language, score, saved } = useApp();
  const assessed = c.id === "02" && score.total > 0;
  return (
    <>
      <a className="breadcrumb" href="#/chapters">
        <Icon name="back" />
        {T("All chapters", "அனைத்துப் பாடங்களும்")}
      </a>
      <section
        className="chapter-hero"
        style={{ "--chapter": c.color } as CSSProperties}
      >
        <div>
          <p className="eyebrow">
            {c.id} · {c.lessons.length} {T("SUBCHAPTERS", "உட்பாடங்கள்")}
          </p>
          <h1>{c[language]}</h1>
          <p>{c.description[language]}</p>
        </div>
        <div>
          <div className="chapter-equation">{c.formula}</div>
          {c.edit_url && (
            <a
              className="admin-edit-link"
              href={c.edit_url}
              target="_blank"
              rel="noreferrer"
            >
              {T("Edit chapter ↗", "அத்தியாயத்தைத் திருத்துக ↗")}
            </a>
          )}
        </div>
      </section>
      <div className="chapter-layout">
        <section className="lesson-list">
          <div className="section-title">
            <h2>{T("Your learning path", "உங்கள் கற்றல் பாதை")}</h2>
          </div>
          {c.lessons.map((l) => (
            <a className="lesson-row" href={link(c.id, l.slug)} key={l.id}>
              <span className={"lesson-step " + (l.available ? "live" : "")}>
                {l.available ? <Icon name="play" /> : l.index}
              </span>
              <div>
                <h3>{l[language]}</h3>
                <p>
                  {l.available
                    ? T(
                        "Open learning content and activities",
                        "கற்றல் உள்ளடக்கத்தையும் செயல்பாடுகளையும் திறக்கவும்",
                      )
                    : T(
                        "Theory · experiment · practice workspace",
                        "கோட்பாடு · பரிசோதனை · பயிற்சிக்கான பக்கம்",
                      )}
                </p>
              </div>
              <span className="lesson-status">
                {l.available
                  ? T("Open lesson", "பாடத்தைத் திறக்கவும்")
                  : T("Outline ready", "பாட வரைவு")}
              </span>
              <Icon name={saved.includes(l.id) ? "bookmark" : "arrow"} />
            </a>
          ))}
        </section>
        <aside className="chapter-aside">
          <h2>{T("Chapter snapshot", "பாடத்தின் நிலை")}</h2>
          <div className="mini-stat">
            <strong>
              {assessed ? 1 : 0} / {c.lessons.length}
            </strong>
            <span>{T("Subchapters assessed", "மதிப்பிட்ட உட்பாடங்கள்")}</span>
          </div>
          <progress max={c.lessons.length} value={assessed ? 1 : 0} />
          <p>
            {T(
              "Opening a page does not count as completion.",
              "பக்கத்தைத் திறப்பதால் பாடம் முடிந்ததாகக் கருதப்படாது.",
            )}
          </p>
          <a
            className="text-link"
            href={c.source}
            target="_blank"
            rel="noopener"
          >
            e-thaksalawa ↗
          </a>
        </aside>
      </div>
    </>
  );
}
export function Outline({ lesson: l }: { lesson: Lesson }) {
  const { T, language } = useApp();
  const [stage, setStage] = useState(0);
  const labels = [
    T("Understand", "புரிதல்"),
    T("Experiment", "பரிசோதனை"),
    T("Practise", "பயிற்சி"),
    T("Evaluate", "மதிப்பீடு"),
  ];
  const descriptions = [
    T(
      "Explanations, diagrams and key equations",
      "விளக்கங்கள், வரைபுகள், முக்கிய சமன்பாடுகள்",
    ),
    T(
      "Predict, adjust variables and explain observations",
      "ஊகித்தல், மாறிகளை மாற்றுதல், விளக்குதல்",
    ),
    T(
      "Past-paper connections and varied questions",
      "கடந்த வினாத்தாள் தொடர்புகளும் பல்வகை வினாக்களும்",
    ),
    T(
      "Independent assessment and study recommendations",
      "உதவியற்ற மதிப்பீடும் கற்றல் பரிந்துரைகளும்",
    ),
  ];
  return (
    <>
      <section className="outline-workspace">
        <div className="outline-tabs" role="tablist">
          {labels.map((name, i) => (
            <button
              key={i}
              id={"stage-" + i}
              role="tab"
              aria-selected={stage === i}
              tabIndex={stage === i ? 0 : -1}
              aria-controls="outline-panel"
              onClick={() => setStage(i)}
              onKeyDown={(e) => {
                if (
                  ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const n =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 3
                        : (i + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                  setStage(n);
                  document.getElementById("stage-" + n)?.focus();
                }
              }}
            >
              <span>0{i + 1}</span>
              {name}
            </button>
          ))}
        </div>
        <div
          id="outline-panel"
          role="tabpanel"
          aria-labelledby={"stage-" + stage}
          tabIndex={0}
        >
          <span className="outline-stamp">
            {T("LESSON IN DEVELOPMENT", "பாடம் உருவாக்கத்தில்")}
          </span>
          <h2>{l[language]}</h2>
          <p>{descriptions[stage]}</p>
          <p className="not-assessed">
            {T(
              "This lesson workspace is not yet complete. No completion or mastery is awarded here.",
              "இது முழுமையான பாடம் அல்ல. இங்கு பாட நிறைவு அல்லது தேர்ச்சி வழங்கப்படாது.",
            )}
          </p>
        </div>
      </section>
      <div className="outline-resources">
        <a
          className="btn btn-white"
          href={C.course}
          target="_blank"
          rel="noopener"
        >
          e-thaksalawa ↗
        </a>
        <ButtonLink to={link("02", "projectile")}>
          {T("Try the working lesson", "ஊடாடும் பாடத்தை முயல்க")}
        </ButtonLink>
      </div>
    </>
  );
}
export function Progress() {
  const { T, language, score: s } = useApp();
  const secure = s.skills.filter((k) => k.secure).length;
  return (
    <>
      <Heading
        kicker={T("YOUR LEARNING, MADE VISIBLE", "உங்கள் கற்றலைக் காணுங்கள்")}
        title={T(
          "Progress you can build on.",
          "தொடர்ந்து வளர்க்கும் முன்னேற்றம்.",
        )}
        description={T(
          "Based on answers, not the pages you open.",
          "உங்கள் விடைகளின் அடிப்படையான முன்னேற்றம்.",
        )}
      />
      <div className="progress-top">
        <section className="progress-summary">
          <div
            className="progress-ring"
            style={{ "--fill": (secure / 6) * 100 + "%" } as CSSProperties}
          >
            <strong>
              {secure}
              <span>/ 6</span>
            </strong>
          </div>
          <div>
            <span className="eyebrow">
              {T("PROJECTILE MOTION", "எறிய இயக்கம்")}
            </span>
            <h2>
              {s.ready
                ? T(
                    "Ready for a new focus.",
                    "புதிய பகுதிக்கு நேரம் ஒதுக்கலாம்.",
                  )
                : T(
                    "Every skill needs evidence.",
                    "ஒவ்வொரு திறனுக்கும் சான்று தேவை.",
                  )}
            </h2>
            <p>
              {s.total}/18 · {s.total ? s.accuracy + "%" : "—"}
            </p>
            <ButtonLink to="#/practice">
              {T("Continue practice", "பயிற்சியைத் தொடர்க")}
            </ButtonLink>
          </div>
        </section>
        <section className="progress-advice">
          <h2>
            {s.reviewDue
              ? T("A short review is due.", "சிறு மீளாய்வு தேவை.")
              : T("Your next step", "அடுத்த படி")}
          </h2>
          <p>
            {s.ready
              ? T(
                  "Explore another topic, keeping a short review in two days. Other chapters are not yet assessed.",
                  "வேறு தலைப்பை ஆராய்ந்து, இரண்டு நாட்களில் மீளாய்வு செய்யுங்கள். மற்ற பாடங்கள் இன்னும் மதிப்பிடப்படவில்லை.",
                )
              : T(
                  "Aim for 12 styles, 85% accuracy and two correct styles in each skill. Repeats and revealed solutions cannot raise readiness.",
                  "12 வகைகள், 85% துல்லியம், ஒவ்வொரு திறனிலும் 2 சரியான வகைகள் இலக்கு. மீள்முயற்சிகளும் பார்த்த விளக்கங்களும் தயார்நிலையை உயர்த்தாது.",
                )}
          </p>
          <small>
            {T(
              "Prototype guidance, not a predicted exam grade.",
              "முன்மாதிரி வழிகாட்டல்; பரீட்சைப் பெறுபேறு முன்னறிவிப்பு அல்ல.",
            )}
          </small>
        </section>
      </div>
      <div className="skill-grid">
        {s.skills.map((k) => (
          <div className="skill-card" key={k.id}>
            <span className="skill-symbol">
              <Icon name={k.secure ? "check" : "progress"} />
            </span>
            <h3>{B.families[k.id][language]}</h3>
            <strong>{k.total ? `${k.correct}/${k.total}` : "—"}</strong>
            <span>
              {T("Independent styles correct", "உதவியின்றிச் சரியான வகைகள்")}
            </span>
            <progress max={2} value={Math.min(k.correct, 2)} />
          </div>
        ))}
      </div>
      <div className="section-title spaced">
        <h2>{T("Across the curriculum", "பாடத்திட்டம் முழுவதும்")}</h2>
      </div>
      <div className="curriculum-progress">
        {C.chapters.map((c) => (
          <a key={c.id} href={link(c.id)}>
            <span>{c.id}</span>
            <strong>{c[language]}</strong>
            <span>
              {c.id === "02" && s.total
                ? T("1 subchapter assessed", "1 உட்பாடம் மதிப்பிடப்பட்டது")
                : T("Not assessed", "மதிப்பிடப்படவில்லை")}
            </span>
            <Icon name="arrow" />
          </a>
        ))}
      </div>
    </>
  );
}
