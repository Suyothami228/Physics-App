import { useState } from "react";
import { B, type Question, type Attempt } from "../model";
import { useApp } from "../state";
import {
  API_ENABLED,
  getQuestion,
  nextQuestion,
  recordRemote,
  request,
} from "../api";
const same = (a: Attempt, q: Question) =>
  a.id === q.id &&
  (a.prompt ?? B.make(a.id, a.variant).prompt.en) === q.prompt.en;
function QuestionGraph({ q }: { q: Question }) {
  const { start, end, duration } = q.graph!;
  const min = Math.min(end, 0) - 5,
    max = Math.max(start, 0) + 5;
  const Y = (v: number) => 140 - ((v - min) / (max - min)) * 115;
  return (
    <div id="question-graph">
      <svg
        viewBox="0 0 350 175"
        role="img"
        aria-label="Vertical velocity against time"
      >
        <path d={`M52 20V145M52 ${Y(0)}H315`} stroke="#5c7076" fill="none" />
        <path
          d={`M52 ${Y(start)}L285 ${Y(end)}`}
          stroke="#006c65"
          strokeWidth="3"
        />
        <text x="5" y={Y(start)}>
          {start}
        </text>
        <text x="5" y={Y(end)}>
          {end}
        </text>
        <text x="55" y={Y(0) + 17}>
          0
        </text>
        <text x="280" y={Y(0) + 17}>
          {duration}
        </text>
        <text x="300" y={Y(0) - 8}>
          t (s)
        </text>
        <text x="55" y="15">
          vᵧ (m/s)
        </text>
      </svg>
    </div>
  );
}
export function Practice() {
  const { T, language, history, setHistory, score } = useApp();
  const [q, setQ] = useState(() => getQuestion("energy-1"));
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = history.find((a) => !a.viewed && same(a, q));
  const assisted = history.some((a) => a.assisted && same(a, q));
  function choose(next: Question | null) {
    if (!next) {
      setNotice(
        T(
          "No fresh questions remain in this selection. Try another skill.",
          "வேறு திறனைத் தேர்ந்தெடுக்கவும்.",
        ),
      );
      return;
    }
    setQ(next);
    setInput("");
    setNotice("");
    setRevealed(false);
  }
  async function submit() {
    if (busy) return;
    const result = B.grade(
      q,
      q.type === "choice" ? (input === "" ? null : Number(input)) : input,
    );
    if (!result.valid) {
      setNotice(
        T(
          "Enter or select an answer first.",
          "முதலில் விடையைத் தேர்ந்தெடுக்கவும்.",
        ),
      );
      return;
    }
    if (done) return;
    if (API_ENABLED) {
      setBusy(true);
      try {
        const result = await recordRemote(q, input);
        setHistory(result.history);
        setQ({ ...q, explain: result.explain });
        setRevealed(true);
        setNotice("");
      } catch (e) {
        setNotice(
          e instanceof Error ? e.message : "Unable to save answer. Try again.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }
    setHistory((h) => [
      ...h,
      {
        id: q.id,
        variant: q.variant,
        correct: !!result.correct,
        assisted,
        at: Date.now(),
      },
    ]);
    setRevealed(true);
    setNotice("");
  }
  async function showSolution() {
    if (busy) return;
    if (API_ENABLED) {
      setBusy(true);
      try {
        const result = await recordRemote(q);
        setHistory(result.history);
        setQ({ ...q, explain: result.explain });
        setRevealed(true);
        setNotice("");
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Unable to load solution.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setRevealed(true);
    if (!done && !assisted)
      setHistory((h) => [
        ...h,
        {
          id: q.id,
          variant: q.variant,
          correct: false,
          assisted: true,
          viewed: true,
          at: Date.now(),
        },
      ]);
  }
  return (
    <section className="practice-section" aria-busy={busy}>
      <fieldset className="practice-content" disabled={busy}>
        <div className="practice-heading">
          <div>
            <h2>{T("Practice with purpose", "நோக்கத்துடன் பயிற்சி")}</h2>
            <p>
              {T(
                "Past-paper adaptation, varied practice and a personal study plan.",
                "கடந்தகால வினா பயிற்சி மற்றும் தனிப்பட்ட கற்றல் திட்டம்.",
              )}
            </p>
          </div>
        </div>
        <div className="prep-grid">
          <section className="question-panel">
            <div className="practice-toolbar">
              <button
                className="secondary"
                onClick={() => choose(getQuestion("energy-1"))}
              >
                {T("2024 past-paper question", "2024 கடந்தகால வினா")}
              </button>
              <button
                className="primary"
                onClick={() => choose(nextQuestion(history))}
              >
                {T("Adaptive practice", "தகவமைப்புப் பயிற்சி")}
              </button>
            </div>
            <p className="small-note">
              {T(
                "AI-authored templates, not live AI generation. Educator review pending.",
                "AI உருவாக்கிய மாதிரிகள். நேரடி AI உருவாக்கம் அல்ல. ஆசிரியர் மீளாய்வு நிலுவையில்.",
              )}
            </p>
            <div className="filter-row">
              <label htmlFor="skill-filter">
                {T("Choose a skill", "திறனைத் தேர்ந்தெடுக்கவும்")}
              </label>
              <select
                id="skill-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">
                  {T("All skills", "அனைத்துத் திறன்கள்")}
                </option>
                {Object.entries(B.families).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name[language]}
                  </option>
                ))}
              </select>
              <button
                className="secondary"
                onClick={() => choose(nextQuestion(history, filter))}
              >
                {T("New question", "புதிய வினா")}
              </button>
            </div>
            <div className="question-meta">
              <span className="origin-badge">
                {q.source
                  ? T(
                      "2024 · Paper I · Q3 (adapted)",
                      "2024 · பகுதி I · வினா 3 (தழுவல்)",
                    )
                  : T("AI-authored practice", "AI உருவாக்கிய பயிற்சி")}
              </span>
              <span>{B.families[q.family][language]}</span>
            </div>
            <h3 id="question-prompt">{q.prompt[language]}</h3>
            {q.graph && <QuestionGraph q={q} />}
            <p className="small-note">
              {T(
                "Use g = 10 m/s² for numeric practice. Ignore air resistance.",
                "எண்ணியல் பயிற்சிக்கு g = 10 m/s². வளித்தடையைப் புறக்கணிக்கவும்.",
              )}
            </p>
            {q.source && (
              <p id="question-source">
                <a href={B.source} target="_blank" rel="noreferrer">
                  {T(
                    "View original paper and answers ↗",
                    "மூல வினாத்தாள் மற்றும் விடைகள் ↗",
                  )}
                </a>
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {q.type === "choice" ? (
                <fieldset id="choice-field" disabled={!!done}>
                  <legend>
                    {T("Select an answer", "விடையைத் தேர்ந்தெடுக்கவும்")}
                  </legend>
                  <div id="practice-choices">
                    {q.options.map((o, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name="answer"
                          checked={input === String(i)}
                          onChange={() => setInput(String(i))}
                        />
                        {o[language]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <div>
                  <label htmlFor="practice-number">
                    {T("Your answer", "உங்கள் விடை")}
                  </label>
                  <div className="number-entry">
                    <input
                      id="practice-number"
                      type="number"
                      step="any"
                      value={input}
                      disabled={!!done}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    <span>{q.unit}</span>
                  </div>
                </div>
              )}
              <div className="question-actions">
                <button className="primary" disabled={!!done}>
                  {T("Check answer", "விடையைச் சரிபார்")}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void showSolution()}
                >
                  {T("Show solution", "தீர்வைக் காட்டு")}
                </button>
              </div>
            </form>
            <div id="practice-feedback" role="status">
              {notice ||
                (done
                  ? done.correct
                    ? T("Correct.", "சரி.")
                    : T(
                        "Review the solution and try a fresh question.",
                        "தீர்வைப் பார்த்து புதிய வினாவை முயலுங்கள்.",
                      )
                  : "")}
              {assisted && (
                <p>
                  {T(
                    "Solution viewed: this question does not count toward independent mastery.",
                    "தீர்வு பார்க்கப்பட்டது: இது சுயமான திறன் மதிப்பீட்டில் சேராது.",
                  )}
                </p>
              )}
            </div>
            {(revealed || done) && (
              <div id="worked-answer">{q.explain[language]}</div>
            )}
            <button
              className="primary"
              id="next-practice"
              onClick={() => choose(nextQuestion(history, filter))}
            >
              {T("Next question →", "அடுத்த வினா →")}
            </button>
          </section>
          <aside className="study-panel">
            <h2>{T("Your study plan", "உங்கள் கற்றல் திட்டம்")}</h2>
            <div className="score-grid">
              <div>
                <strong>{score.accuracy}%</strong>
                <span>
                  {T("Independent accuracy", "சுயமான சரியான விடைகள்")}
                </span>
              </div>
              <div>
                <strong>{score.total}/18</strong>
                <span>
                  {T("Question styles attempted", "முயன்ற வினா வகைகள்")}
                </span>
              </div>
            </div>
            {score.skills.map((s) => (
              <div className="skill-row" key={s.id}>
                <span>{B.families[s.id][language]}</span>
                <span>
                  {s.correct}/{s.total} {s.secure ? "✓" : ""}
                </span>
              </div>
            ))}
            <div
              id="recommendation"
              className={score.ready ? "ready" : "developing"}
            >
              {score.ready
                ? T(
                    "Ready to focus on other topics",
                    "பிற தலைப்புகளில் கவனம் செலுத்தலாம்",
                  )
                : T(
                    "Keep building your understanding",
                    "உங்கள் புரிதலை வளர்த்துக்கொள்ளுங்கள்",
                  )}
            </div>
            <p className="small-note">
              {score.reviewDue
                ? T("A short review is due.", "சிறு மீளாய்வு தேவை.")
                : T(
                    "Recommendations cover projectile motion only. Other topics are not assessed yet.",
                    "பரிந்துரைகள் எறிய இயக்கத்திற்கு மட்டுமே. பிற தலைப்புகள் இன்னும் மதிப்பிடப்படவில்லை.",
                  )}
            </p>
            {score.ready && (
              <a className="primary" href="#/chapters">
                {T("Explore chapters →", "அத்தியாயங்களை ஆராய்க →")}
              </a>
            )}
            <details>
              <summary>
                {T("How readiness works", "தயார்நிலை கணக்கீடு")}
              </summary>
              <p>
                {T(
                  "At least 12 independent styles, 85% accuracy, and two correct styles in each of six skills within 14 days. Repeats and assisted answers do not increase mastery. Review after two days.",
                  "14 நாட்களில் 12 சுயமான வினா வகைகள், 85% சரியான விடைகள், ஆறு திறன்களிலும் தலா இரண்டு சரியான வகைகள் தேவை. மீண்டும் முயன்றதும் உதவியுடன் விடையளித்ததும் சேராது. இரண்டு நாட்களின் பின் மீளாய்வு.",
                )}
              </p>
            </details>
            <button
              className="text-button"
              onClick={async () => {
                if (
                  confirm(
                    T(
                      API_ENABLED
                        ? "Clear all practice progress for this account?"
                        : "Clear all practice progress on this browser?",
                      API_ENABLED
                        ? "இந்தக் கணக்கின் பயிற்சி முன்னேற்றத்தை அழிக்கவா?"
                        : "இந்த உலாவியின் பயிற்சி முன்னேற்றத்தை அழிக்கவா?",
                    ),
                  )
                ) {
                  setBusy(true);
                  try {
                    if (API_ENABLED) await request("attempts", "DELETE");
                    setHistory([]);
                    setRevealed(false);
                    setQ(getQuestion(q.id, q.variant));
                    setNotice("");
                  } catch (e) {
                    setNotice(
                      e instanceof Error
                        ? e.message
                        : "Unable to clear progress.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }
              }}
            >
              {T("Clear progress", "முன்னேற்றத்தை அழி")}
            </button>
          </aside>
        </div>
      </fieldset>
    </section>
  );
}
