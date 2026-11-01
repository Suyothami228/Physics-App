import { useEffect, useRef, useState } from "react";
import { API_ENABLED, request } from "../api";
import { useApp } from "../state";
import "../styles/review.css";

export const CONTENT_CHANGED = "iyal-content-published";
export function usePublishedContent() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const changed = () => setRevision((n) => n + 1);
    window.addEventListener(CONTENT_CHANGED, changed);
    return () => window.removeEventListener(CONTENT_CHANGED, changed);
  }, []);
  return revision;
}
export function ReviewSync() {
  useEffect(() => {
    if (!API_ENABLED) return;
    let alive = true,
      last: number | undefined,
      running = false;
    const check = async () => {
      if (document.hidden || running) return;
      running = true;
      try {
        const data = await request<{ revision: number }>("review/clock");
        if (alive) {
          if (last !== undefined && last !== data.revision)
            window.dispatchEvent(new Event(CONTENT_CHANGED));
          last = data.revision;
        }
      } catch {
        /* Keep current lesson usable during a network interruption. */
      } finally {
        running = false;
      }
    };
    void check();
    const timer = setInterval(check, 5000);
    document.addEventListener("visibilitychange", check);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return null;
}
type Revision = {
  id: number;
  reason: string;
  created_at: string;
  author__username: string | null;
  before: Record<string, string>;
  after: Record<string, string>;
};
type Content = {
  fields: Record<string, string>;
  version: string;
  history: Revision[];
};
type Feedback = {
  id: number;
  label: string;
  url: string;
  target: string;
  category: string;
  message: string;
  timestamp: number | null;
  status: string;
  author: string;
  created_at: string;
  replies: { author: string; message: string; created_at: string }[];
};
const statuses = ["open", "progress", "clarification", "resolved"];
function fieldLabel(key: string) {
  const language = key.endsWith("ta") ? "தமிழ்" : "English";
  const names: Record<string, string> = {
    title: "Title / தலைப்பு",
    body: "Explanation / விளக்கம்",
    options: "Choices (one per line) / தெரிவுகள்",
    explanation: "Answer explanation / விடை விளக்கம்",
    prompt: "Question / வினா",
    solution: "Solution / விடை",
    answer: "Answer / விடை",
    image_alt: "Image description / பட விளக்கம்",
  };
  if (key.startsWith("video_steps."))
    return `Caption ${Number(key.split(".")[1]) + 1} · ${language}`;
  if (key.startsWith("structured_parts."))
    return `Part ${Number(key.split(".")[1]) + 1} · ${names[key.split(".")[2]] || key.split(".")[2]} · ${language}`;
  return `${names[key.replace(/_(en|ta)$/, "")] || key} · ${language}`;
}
const statusNames: Record<string, string> = {
  open: "Open",
  progress: "In progress",
  clarification: "Needs clarification",
  resolved: "Resolved",
};

export function EducatorReview({
  target,
  label,
}: {
  target?: string;
  label?: string;
}) {
  const { account, T } = useApp();
  const [open, setOpen] = useState(false);
  if (!API_ENABLED || !account?.educator) return null;
  return (
    <>
      <button className="review-launch" onClick={() => setOpen(true)}>
        {label ||
          T(
            target ? "✎ Correct wording / comment" : "Educator inbox",
            target
              ? "✎ சொற்களைத் திருத்துக / கருத்திடுக"
              : "ஆசிரியர் கருத்துப் பெட்டி",
          )}
      </button>
      {open && <ReviewPanel target={target} close={() => setOpen(false)} />}
    </>
  );
}

function ReviewPanel({
  target,
  close,
}: {
  target?: string;
  close: () => void;
}) {
  const { account, T } = useApp();
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<Content | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Feedback[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("technical");
  const [stamp, setStamp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState(target ? "wording" : "feedback");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function load(refreshContent = false) {
    if (target && (refreshContent || !data)) {
      const result = await request<Content>(
        "review/content?target=" + encodeURIComponent(target),
      );
      setData(result);
      setFields(result.fields);
    }
    const result = await request<{
      items: Feedback[];
      pages: number;
      total: number;
    }>(
      "review/feedback?" +
        new URLSearchParams({
          page: String(page),
          ...(target ? { target } : {}),
          ...(status ? { status } : {}),
        }),
    );
    setItems(result.items);
    setPages(result.pages);
    setTotal(result.total);
  }
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [target, status, page]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  const dirty =
    data && Object.keys(fields).some((k) => fields[k] !== data.fields[k]);
  return (
    <dialog
      ref={dialog}
      className="review-panel"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="review-title"
    >
      <header>
        <div>
          <small>EDUCATOR WORKSPACE</small>
          <h2 id="review-title">
            {T("Review & improve", "மீளாய்வும் திருத்தமும்")}
          </h2>
          <p>
            {target ||
              T(
                "Shared technical feedback inbox",
                "பகிரப்பட்ட தொழில்நுட்பக் கருத்துப் பெட்டி",
              )}
          </p>
        </div>
        <button aria-label="Close educator review" onClick={close}>
          ×
        </button>
      </header>
      <nav>
        {target && (
          <button
            aria-pressed={tab === "wording"}
            onClick={() => setTab("wording")}
          >
            {T("Correct wording", "சொற்களைத் திருத்துக")}
          </button>
        )}
        <button
          aria-pressed={tab === "feedback"}
          onClick={() => setTab("feedback")}
        >
          {T("Comments", "கருத்துகள்")}
        </button>
        {target && (
          <button
            aria-pressed={tab === "history"}
            onClick={() => setTab("history")}
          >
            {T("Change history", "மாற்ற வரலாறு")}
          </button>
        )}
      </nav>
      {error && (
        <p role="alert" className="review-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="review-success">
          {notice}
        </p>
      )}
      {tab === "wording" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              const changes = Object.fromEntries(
                Object.entries(fields).filter(
                  ([k, v]) => v !== data?.fields[k],
                ),
              );
              const result = await request<Content>("review/content", "POST", {
                target,
                version: data?.version,
                fields: changes,
                reason,
              });
              setData(result);
              setFields(result.fields);
              setReason("");
              window.dispatchEvent(new Event(CONTENT_CHANGED));
              setNotice(
                T(
                  "Published. Students online receive the correction within about 5 seconds.",
                  "வெளியிடப்பட்டது. இணையத்தில் உள்ள மாணவர்கள் சுமார் 5 விநாடிகளில் திருத்தத்தைக் காணலாம்.",
                ),
              );
            });
          }}
        >
          <p className="review-callout">
            {T(
              "Saving publishes directly to students. Edit wording only; request changes to formulas, diagrams or behaviour in Comments.",
              "சேமித்தவுடன் மாணவர்களுக்காக வெளியிடப்படும். சொற்களை மட்டும் திருத்துக; சூத்திரம், வரைபு அல்லது இயக்க மாற்றங்களைக் கருத்துகளில் கோருக.",
            )}
          </p>
          {!data && <p role="status">Loading…</p>}
          {Object.entries(fields).map(([key, value]) => (
            <label key={key}>
              {fieldLabel(key)}
              <textarea
                lang={key.endsWith("ta") ? "ta" : "en"}
                rows={value.length > 160 ? 6 : 2}
                maxLength={20000}
                value={value}
                onChange={(e) =>
                  setFields({ ...fields, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <label>
            {T("Reason for correction", "திருத்தத்திற்கான காரணம்")}
            <input
              required
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {dirty && (
            <details>
              <summary>
                {T(
                  "Preview changed wording",
                  "திருத்திய சொற்களை முன்னோட்டமிடுக",
                )}
              </summary>
              {Object.entries(fields)
                .filter(([k, v]) => v !== data?.fields[k])
                .map(([k, v]) => (
                  <article key={k}>
                    <strong>{fieldLabel(k)}</strong>
                    <p className="review-prose">{v}</p>
                  </article>
                ))}
            </details>
          )}
          <button className="review-primary" disabled={busy || !dirty}>
            {busy
              ? "Saving…"
              : T("Publish correction now", "திருத்தத்தை இப்போது வெளியிடுக")}
          </button>
        </form>
      )}
      {tab === "history" && (
        <section>
          <p>
            {T(
              "The latest 50 corrections are shown. A super admin can restore earlier wording; all revisions remain in the admin archive.",
              "அண்மைய 50 திருத்தங்கள் காட்டப்படுகின்றன. முதன்மை நிர்வாகி முந்தைய சொற்களை மீட்டமைக்கலாம்.",
            )}
          </p>
          {data?.history.map((h) => (
            <article key={h.id}>
              <strong>{h.reason}</strong>
              <p>
                {h.author__username || "Deleted account"} ·{" "}
                {new Date(h.created_at).toLocaleString()}
              </p>
              <details>
                <summary>Compare wording / சொற்களை ஒப்பிடுக</summary>
                {Object.keys(h.after)
                  .filter((k) => h.before[k] !== h.after[k])
                  .map((k) => (
                    <div key={k}>
                      <strong>{k}</strong>
                      <p className="review-prose">Before: {h.before[k]}</p>
                      <p className="review-prose">After: {h.after[k]}</p>
                    </div>
                  ))}
              </details>
              {account?.superadmin && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      await request("review/rollback/" + h.id, "POST", {
                        version: data.version,
                      });
                      await load(true);
                      window.dispatchEvent(new Event(CONTENT_CHANGED));
                      setNotice("Earlier wording restored and published.");
                    })
                  }
                >
                  Restore wording before this change
                </button>
              )}
            </article>
          ))}
          {data?.history.length === 0 && <p>No corrections yet.</p>}
        </section>
      )}
      {tab === "feedback" && (
        <section>
          {target && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  await request("review/feedback", "POST", {
                    target,
                    category,
                    message,
                    timestamp: stamp === "" ? null : Number(stamp),
                  });
                  setMessage("");
                  setStamp("");
                  await load();
                  setNotice(
                    T(
                      "Comment sent to the shared admin inbox.",
                      "கருத்து நிர்வாகியின் பகிரப்பட்ட பெட்டிக்கு அனுப்பப்பட்டது.",
                    ),
                  );
                });
              }}
            >
              <label>
                {T("Request type", "கோரிக்கை வகை")}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="correct">Correct · திருத்துக</option>
                  <option value="add">Add · சேர்க்க</option>
                  <option value="remove">Remove · நீக்குக</option>
                  <option value="technical">
                    Technical issue · தொழில்நுட்பச் சிக்கல்
                  </option>
                </select>
              </label>
              <label>
                {T(
                  "Animation time in seconds (optional)",
                  "அசைவூட்ட நேரம், விநாடிகளில் (விருப்பம்)",
                )}
                <input
                  type="number"
                  min="0"
                  max="86399"
                  step="1"
                  value={stamp}
                  onChange={(e) => setStamp(e.target.value)}
                />
              </label>
              <label>
                {T("What should change, and why?", "எதை மாற்ற வேண்டும்? ஏன்?")}
                <textarea
                  required
                  maxLength={5000}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              <button disabled={busy} className="review-primary">
                {T("Send comment", "கருத்தை அனுப்புக")}
              </button>
            </form>
          )}
          <label>
            {T("Filter requests", "கோரிக்கைகளை வடிகட்டுக")}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusNames[s]}
                </option>
              ))}
            </select>
          </label>
          <button disabled={busy} onClick={() => void action(load)}>
            Refresh comments
          </button>
          <p>
            {total} requests · Page {page} / {pages}
          </p>
          <button disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
            Previous
          </button>{" "}
          <button
            disabled={page >= pages}
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </button>
          {items.map((item) => (
            <FeedbackItem key={item.id} item={item} refresh={load} />
          ))}
        </section>
      )}
    </dialog>
  );
}
function FeedbackItem({
  item,
  refresh,
}: {
  item: Feedback;
  refresh: () => Promise<void>;
}) {
  const { account } = useApp();
  const [reply, setReply] = useState(""),
    [status, setStatus] = useState(item.status),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => setStatus(item.status), [item.status]);
  return (
    <article className="review-thread">
      <strong>
        {item.label || item.target} · {item.category}
      </strong>
      {item.url && (
        <p>
          <a href={item.url} target="_blank" rel="noreferrer">
            Open lesson / question ↗
          </a>
        </p>
      )}
      <p>
        {item.author} · {new Date(item.created_at).toLocaleString()} ·{" "}
        <b>{statusNames[item.status]}</b>
        {item.timestamp !== null ? ` · ${item.timestamp}s` : ""}
      </p>
      <p className="review-prose">{item.message}</p>
      {item.replies.map((r, i) => (
        <blockquote key={i}>
          <strong>{r.author}</strong>
          <p className="review-prose">{r.message}</p>
        </blockquote>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await request("review/feedback/" + item.id, "POST", {
              message: reply,
              ...(account?.manage_feedback ? { status } : {}),
            });
            setReply("");
            await refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to save");
          } finally {
            setBusy(false);
          }
        }}
      >
        {account?.manage_feedback && (
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusNames[s]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Reply / பதில்
          <textarea
            required={!account?.manage_feedback}
            maxLength={5000}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </label>
        <button disabled={busy}>Save reply / status</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </article>
  );
}
