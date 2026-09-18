import { useEffect, useState, type CSSProperties } from "react";
import { C, type Chapter, type Bilingual } from "../model";
import { useApp } from "../state";
import { API_ENABLED } from "../api";
import { Practice } from "./Practice";
import "../styles/exam.css";

type Kind = "mcq" | "structured" | "essay";
const kinds: {
  id: Kind;
  en: string;
  ta: string;
  icon: string;
  hint: Bilingual;
}[] = [
  {
    id: "mcq",
    en: "MCQ",
    ta: "பல்தேர்வு வினாக்கள்",
    icon: "◎",
    hint: {
      en: "Read closely. Choose confidently.",
      ta: "கவனமாக வாசித்து சரியான விடையைத் தெரிவுசெய்க.",
    },
  },
  {
    id: "structured",
    en: "Structured",
    ta: "கட்டமைப்பு வினாக்கள்",
    icon: "▤",
    hint: {
      en: "Build your answer, step by step.",
      ta: "படிப்படியாக விடையை அமைக்கவும்.",
    },
  },
  {
    id: "essay",
    en: "Essay",
    ta: "கட்டுரை வினாக்கள்",
    icon: "✎",
    hint: {
      en: "Connect ideas. Show your reasoning.",
      ta: "கருத்துகளை இணைத்து விளக்கவும்.",
    },
  },
];
type Count = { chapter_id: string; kind: Kind; total: number };
type PaperQuestion = {
  id: number;
  year: number;
  paper: string;
  number: string;
  kind: Kind;
  title: Bilingual;
  prompt: Bilingual;
  marks: number;
  minutes: number;
  source: string;
  pdf: string | null;
  image?: string | null;
  options: { en: string[]; ta: string[] };
};
type Solution = {
  accepted_options?: number[];
  correct_option: number | null;
  solution: Bilingual;
  pdf: string | null;
};
type Results = {
  sections?: { slug: string; title: Bilingual; total: number }[];
  questions: PaperQuestion[];
  years: number[];
  total: number;
  pages: number;
  page: number;
};
async function read<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, credentials: "same-origin" });
  if (!response.ok) throw new Error("Could not load exam papers");
  return response.json();
}
export function ExamPrep({
  chapter,
  kind,
  adaptive = false,
  section,
}: {
  chapter?: Chapter;
  kind?: Kind;
  adaptive?: boolean;
  section?: string;
}) {
  const { T, language } = useApp();
  const [counts, setCounts] = useState<Count[]>([]);
  const [admin, setAdmin] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(API_ENABLED);
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (!API_ENABLED) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    read<{ counts: Count[]; admin_url: string | null }>(
      "/api/exam/catalog/",
      controller.signal,
    )
      .then((data) => {
        setCounts(data.counts);
        setAdmin(data.admin_url);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  const count = (id?: string, k?: Kind) =>
    counts
      .filter((c) => (!id || c.chapter_id === id) && (!k || c.kind === k))
      .reduce((sum, c) => sum + c.total, 0);
  if (adaptive)
    return (
      <section className="exam">
        <a className="breadcrumb" href="#/practice">
          ← {T("Exam prep", "தேர்வுப் பயிற்சி")}
        </a>
        <h1>{T("Adaptive practice", "திறனுக்கேற்ற பயிற்சி")}</h1>
        <div className="lesson-ui">
          <Practice />
        </div>
      </section>
    );
  if (chapter && kind)
    return (
      <QuestionLibrary
        key={`${chapter.id}/${kind}/${section || ""}`}
        chapter={chapter}
        kind={kind}
        section={section}
      />
    );
  return (
    <section className="exam">
      {chapter && (
        <a className="breadcrumb" href="#/practice">
          ← {T("All chapters", "அனைத்து அத்தியாயங்கள்")}
        </a>
      )}
      <div className="exam-hero">
        <div>
          <span className="exam-eyebrow">
            {T("YOUR EXAM TOOLKIT", "உங்கள் தேர்வுப் பயிற்சிக் களம்")}
          </span>
          <h1>
            {chapter
              ? chapter[language]
              : T(
                  "Small steps. Stronger answers.",
                  "ஒவ்வொரு பயிற்சியும் ஒரு முன்னேற்றம்.",
                )}
          </h1>
          <p>
            {T(
              "Explore past papers by chapter. Choose a question style and practise at your own pace.",
              "அத்தியாயவாரியாக கடந்தகால வினாக்களைத் தெரிவுசெய்து உங்கள் வேகத்தில் பயிற்சி செய்யுங்கள்.",
            )}
          </p>
          <div className="exam-chips">
            <span>{T("11 chapters", "11 அத்தியாயங்கள்")}</span>
            <span>{T("3 question styles", "3 வினா வகைகள்")}</span>
            <span>
              {loading ? "…" : count(chapter?.id)}{" "}
              {T("published questions", "வெளியிடப்பட்ட வினாக்கள்")}
            </span>
          </div>
        </div>
        <div className="exam-orbit" aria-hidden="true">
          <span>F = ma</span>
          <b>✦</b>
          <span>E = hν</span>
        </div>
      </div>
      <div className="exam-toolbar">
        <h2>
          {chapter
            ? T("Choose your challenge", "வினா வகையைத் தெரிவுசெய்க")
            : T("Find your chapter", "உங்கள் அத்தியாயத்தைத் தெரிவுசெய்க")}
        </h2>
        {!chapter && (
          <input
            aria-label={T("Search chapters", "அத்தியாயத்தைத் தேடுக")}
            placeholder={T("Search chapters…", "அத்தியாயத்தைத் தேடுக…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        {admin && (
          <a href={admin} target="_blank" rel="noreferrer">
            {T("Manage question bank ↗", "வினா வங்கியை நிர்வகிக்க ↗")}
          </a>
        )}
      </div>
      {error && (
        <p role="alert">
          {T(
            "Question counts could not load.",
            "வினா எண்ணிக்கையை ஏற்ற முடியவில்லை.",
          )}{" "}
          <button onClick={() => setRetry((x) => x + 1)}>
            {T("Retry", "மீண்டும் முயல்க")}
          </button>
        </p>
      )}
      {chapter ? (
        <div className="exam-types">
          {kinds.map((k, i) => (
            <a
              className={`exam-type type-${i}`}
              key={k.id}
              href={`#/practice/${chapter.id}/${k.id}`}
            >
              <span className="exam-type-icon">{k.icon}</span>
              <span className="exam-eyebrow">0{i + 1}</span>
              <h2>{k[language]}</h2>
              <p>{k.hint[language]}</p>
              <footer>
                <span>
                  {count(chapter.id, k.id)} {T("questions", "வினாக்கள்")}
                </span>
                <b>↗</b>
              </footer>
            </a>
          ))}
        </div>
      ) : (
        <div className="exam-chapters">
          {C.chapters
            .filter((c) =>
              `${c.en} ${c.ta} ${c.id}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((c) => (
              <a
                className="exam-chapter"
                key={c.id}
                href={`#/practice/${c.id}`}
                style={{ "--chapter-color": c.color } as CSSProperties}
              >
                <div className="exam-card-top">
                  <span>{c.id}</span>
                  <b aria-hidden="true">{c.formula || "φ"}</b>
                </div>
                <h3>{c[language]}</h3>
                <div className="exam-mini-types">
                  {kinds.map((k) => (
                    <span key={k.id}>{k[language]}</span>
                  ))}
                </div>
                <footer>
                  <span>
                    {count(c.id)} {T("questions", "வினாக்கள்")}
                  </span>
                  <b>↗</b>
                </footer>
              </a>
            ))}
        </div>
      )}
      {!chapter &&
        !C.chapters.some((c) =>
          `${c.en} ${c.ta} ${c.id}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ) && (
          <p role="status">
            {T(
              "No chapters match your search.",
              "பொருத்தமான அத்தியாயங்கள் இல்லை.",
            )}
          </p>
        )}
      <aside className="exam-practice-link">
        <div>
          <h3>
            {T("Want a quick practice round?", "விரைவான பயிற்சி வேண்டுமா?")}
          </h3>
          <p>
            {T(
              "Try the existing adaptive projectile-motion practice.",
              "எறிய இயக்கத்திற்கான திறனுக்கேற்ற பயிற்சியை முயற்சிக்கவும்.",
            )}
          </p>
        </div>
        <a href="#/practice/adaptive">
          {T("Start practice →", "பயிற்சியைத் தொடங்கு →")}
        </a>
      </aside>
    </section>
  );
}
function QuestionLibrary({
  chapter,
  kind,
  section,
}: {
  chapter: Chapter;
  kind: Kind;
  section?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const { T, language } = useApp();
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<Results>({
    questions: [],
    years: [],
    total: 0,
    pages: 1,
    page: 1,
  });
  const [loading, setLoading] = useState(API_ENABLED);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!API_ENABLED) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    read<Results>(
      `/api/exam/questions/?chapter=${chapter.id}&kind=${kind}&year=${year}&page=${page}&section=${encodeURIComponent(section || "")}`,
      controller.signal,
    )
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [chapter.id, kind, section, year, page, retry]);
  const sections = data.sections || [];
  const showSections = !section && !showAll && sections.length > 0;
  return (
    <section className="exam">
      <a
        className="breadcrumb"
        href={
          section
            ? `#/practice/${chapter.id}/${kind}`
            : `#/practice/${chapter.id}`
        }
      >
        ← {chapter[language]}
      </a>
      <div className="exam-library-title">
        <span className="exam-eyebrow">
          {T("PAST-PAPER LIBRARY", "கடந்தகால வினா வங்கி")}
        </span>
        <h1>
          {sections.find((s) => s.slug === section)?.title[language] ||
            kinds.find((k) => k.id === kind)![language]}
        </h1>
        <p>
          {chapter[language]} · {data.total} {T("questions", "வினாக்கள்")}
        </p>
      </div>
      <nav
        className="exam-tabs"
        aria-label={T("Question types", "வினா வகைகள்")}
      >
        {kinds.map((k) => (
          <a
            key={k.id}
            href={`#/practice/${chapter.id}/${k.id}`}
            aria-current={kind === k.id ? "page" : undefined}
          >
            {k[language]}
          </a>
        ))}
      </nav>
      {!showSections && (
        <div className="exam-toolbar">
          <label>
            {T("Paper year", "வினாத்தாள் ஆண்டு")}{" "}
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{T("All years", "அனைத்து ஆண்டுகள்")}</option>
              {data.years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <button onClick={() => setRetry((x) => x + 1)}>
            {T("Refresh", "புதுப்பிக்க")}
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">
          {T("Loading papers…", "வினாக்கள் ஏற்றப்படுகின்றன…")}
        </p>
      ) : error ? (
        <div role="alert">
          {T(
            "Could not load questions. Please retry.",
            "வினாக்களை ஏற்ற முடியவில்லை. மீண்டும் முயலவும்.",
          )}{" "}
          <button onClick={() => setRetry((x) => x + 1)}>
            {T("Retry", "மீண்டும் முயல்க")}
          </button>
        </div>
      ) : showSections ? (
        <>
          <div className="exam-toolbar">
            <h2>{T("Choose a subchapter", "உட்பாடத்தைத் தெரிவுசெய்க")}</h2>
            <button onClick={() => setShowAll(true)}>
              {T("View all questions", "அனைத்து வினாக்களையும் பார்க்க")}
            </button>
          </div>
          <div className="exam-types">
            {sections.map((s, i) => (
              <a
                className={`exam-type type-${i % 3}`}
                key={s.slug}
                href={`#/practice/${chapter.id}/${kind}/${s.slug}`}
              >
                <span className="exam-type-icon" aria-hidden="true">
                  Δ
                </span>
                <h2>{s.title[language]}</h2>
                <p>
                  {T(
                    "Read the question. Choose an answer. Check your understanding.",
                    "வினாவை வாசித்து விடையைத் தெரிவுசெய்து சரிபாருங்கள்.",
                  )}
                </p>
                <footer>
                  <span>
                    {s.total} {T("questions", "வினாக்கள்")}
                  </span>
                  <b>↗</b>
                </footer>
              </a>
            ))}
          </div>
        </>
      ) : data.questions.length ? (
        <div className="exam-question-list">
          {data.questions.map((q) => (
            <QuestionCard key={q.id} q={q} />
          ))}
        </div>
      ) : (
        <div className="exam-empty">
          <span aria-hidden="true">▤</span>
          <h2>
            {T("Your next challenge is on its way", "புதிய வினாக்கள் விரைவில்")}
          </h2>
          <p>
            {T(
              API_ENABLED
                ? "No published questions here yet. New papers will appear when your educator publishes them."
                : "Past papers have not been bundled into this preview. The connected app displays questions published by your educator.",
              "இங்கே இன்னும் வினாக்கள் வெளியிடப்படவில்லை. ஆசிரியர் வெளியிடும் வினாக்கள் இணைக்கப்பட்ட செயலியில் தோன்றும்.",
            )}
          </p>
          <a href={`#/practice/${chapter.id}`}>
            {T(
              "Explore other question styles →",
              "மற்ற வினா வகைகளைப் பார்க்க →",
            )}
          </a>
        </div>
      )}
      {!loading && !error && !showSections && data.pages > 1 && (
        <div className="exam-pagination">
          <button
            disabled={data.page <= 1}
            onClick={() => setPage(data.page - 1)}
          >
            {T("Previous", "முந்தைய")}
          </button>
          <span>
            {data.page} / {data.pages}
          </span>
          <button
            disabled={data.page >= data.pages}
            onClick={() => setPage(data.page + 1)}
          >
            {T("Next", "அடுத்த")}
          </button>
        </div>
      )}
    </section>
  );
}
function QuestionCard({ q }: { q: PaperQuestion }) {
  const { T, language } = useApp();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);
  async function reveal(check: boolean) {
    setBusy(true);
    setError(false);
    try {
      setSolution(await read<Solution>(`/api/exam/solutions/${q.id}/`));
      setChecked(check);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="exam-question">
      <button
        className="exam-question-toggle"
        aria-expanded={open}
        aria-controls={`exam-q-${q.id}`}
        onClick={() => setOpen(!open)}
      >
        <span className="exam-year">{T("Question", "வினா")} {q.number}</span>
        <span>
          <small>
            {q.marks} {T("marks", "புள்ளிகள்")} · {q.minutes}{" "}
            {T("min", "நிமி")}
          </small>
        </span>
        <b>{open ? "−" : "+"}</b>
      </button>
      {open && (
        <div className="exam-question-body" id={`exam-q-${q.id}`}>
          <p className="exam-preserve">{q.prompt[language]}</p>

          <div className="exam-file-links">
            {q.pdf && (
              <a href={q.pdf} target="_blank" rel="noreferrer">
                {T("Download question PDF ↗", "வினா PDF பதிவிறக்கம் ↗")}
              </a>
            )}
            {q.source && (
              <a href={q.source} target="_blank" rel="noreferrer">
                {T("Original source ↗", "மூல வினாத்தாள் ↗")}
              </a>
            )}
          </div>
          {q.kind === "mcq" ? (
            <fieldset disabled={!!solution || busy}>
              <legend>{T("Choose your answer", "விடையைத் தெரிவுசெய்க")}</legend>
              {q.options[language].map((option, i) => {
                const correct = !!solution && (solution.accepted_options?.length ? solution.accepted_options : [solution.correct_option]).includes(i + 1);
                const wrong = !!solution && checked && choice === i + 1 && !correct;
                return (
                <label
                  className={`exam-option ${choice === i + 1 ? "selected" : ""} ${correct ? "is-correct" : ""} ${wrong ? "is-wrong" : ""}`}
                  key={i}
                >
                  <span className="exam-option-number">{i + 1}.</span>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={choice === i + 1}
                    onChange={() => { setChoice(i + 1); void reveal(true); }}
                  />
                  <span className="exam-option-text">{option}</span>
                  {correct && <small className="exam-option-result">✓ {T("Correct", "சரி")}</small>}
                  {wrong && <small className="exam-option-result">✕ {T("Incorrect", "தவறு")}</small>}
                </label>
              );})}
            </fieldset>
          ) : (
            <label>
              {T(
                "Your working notes (kept while this page stays open)",
                "உங்கள் குறிப்புகள் (இப்பக்கம் திறந்திருக்கும் வரை மட்டும்)",
              )}
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={T(
                  "Sketch on paper, then write your reasoning here…",
                  "தாளில் வரைந்து, உங்கள் விளக்கத்தை இங்கே எழுதவும்…",
                )}
              />
            </label>
          )}
          <div className="exam-actions">
            {q.kind === "mcq" && !solution && error && (
              <button
                disabled={choice === null || busy}
                onClick={() => reveal(true)}
              >
                {T("Check answer", "விடையைச் சரிபார்")}
              </button>
            )}
            {!solution && (
              <button disabled={busy} onClick={() => reveal(false)}>
                {T("Show marking scheme", "புள்ளியிடல் திட்டத்தைப் பார்க்க")}
              </button>
            )}
          </div>
          {busy && <p role="status">{T("Loading…", "ஏற்றப்படுகிறது…")}</p>}
          {error && (
            <p role="alert">
              {T(
                "Could not load the solution. Try again.",
                "விடையை ஏற்ற முடியவில்லை. மீண்டும் முயலவும்.",
              )}
            </p>
          )}
          {solution && (
            <div className="exam-solution" role="status">
              <h4>
                {checked
                  ? (
                      solution.accepted_options || [solution.correct_option]
                    ).includes(choice!)
                    ? T("Correct — nicely reasoned!", "சரியான விடை!")
                    : T(
                        "Not quite — review the explanation",
                        "விளக்கத்தை மீண்டும் பார்க்கவும்",
                      )
                  : T("Marking scheme", "புள்ளியிடல் திட்டம்")}
              </h4>
              {solution.correct_option && (
                <p>
                  {T("Correct option", "சரியான தெரிவு")}:{" "}
                  {(
                    solution.accepted_options || [solution.correct_option]
                  ).map((n) => `${n}. ${q.options[language][n - 1] || ""}`).join(" / ")}
                </p>
              )}
              <p className="exam-preserve">{solution.solution[language]}</p>
              {solution.pdf && (
                <a href={solution.pdf} target="_blank" rel="noreferrer">
                  {T(
                    "Download marking scheme ↗",
                    "புள்ளியிடல் திட்டம் பதிவிறக்கம் ↗",
                  )}
                </a>
              )}
              <small>
                {T(
                  "Use this for self-review. This activity does not award mastery or an exam grade.",
                  "இது சுயமதிப்பீட்டுக்கான பயிற்சி. இது தேர்ச்சி அல்லது தேர்வுப் புள்ளிகளை வழங்காது.",
                )}
              </small>
            </div>
          )}
        </div>
      )}
      <footer className="exam-question-reference">
        <small>{T("Past paper", "கடந்தகால வினா")} · {q.year}</small>
      </footer>
    </article>
  );
}
