import { useEffect, useState } from "react";
import { useApp } from "../state";
import { API_ENABLED } from "../api";
import type { Bilingual } from "../model";

export type StructuredPart = {
  id: string;
  prompt: Bilingual;
  image?: string;
  image_alt?: Bilingual;
};
export type PartAnswer = { id: string; answer: Bilingual };

export function StructuredQuestion({
  questionId,
  parts,
  loadAnswers,
}: {
  questionId: number;
  parts: StructuredPart[];
  loadAnswers: () => Promise<PartAnswer[]>;
}) {
  const { T, language } = useApp();
  const [answers, setAnswers] = useState<PartAnswer[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(parts[0]?.id || "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [marking, setMarking] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    if (!API_ENABLED) return;
    const controller = new AbortController();
    fetch("/api/exam/photo-marking/", { signal: controller.signal })
      .then((r) => r.json())
      .then((r) => setEnabled(r.enabled === true))
      .catch(() => setEnabled(false));
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  async function reveal(id: string) {
    if (visible[id]) {
      setVisible((v) => ({ ...v, [id]: false }));
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (!answers.length) setAnswers(await loadAnswers());
      setVisible((v) => ({ ...v, [id]: true }));
    } catch {
      setError(
        T(
          "Could not load answers. Try again.",
          "விடைகளை ஏற்ற முடியவில்லை. மீண்டும் முயலவும்.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }
  async function mark() {
    if (!photo || !consent || !enabled) return;
    setMarking(true);
    setFeedback("");
    setError("");
    const form = new FormData();
    form.append("photo", photo);
    form.append("part", selected);
    form.append("consent", "yes");
    form.append("language", language);
    const csrf =
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("csrftoken="))
        ?.slice(10) || "";
    try {
      const response = await fetch(`/api/exam/photo-marking/${questionId}/`, {
        method: "POST",
        body: form,
        credentials: "same-origin",
        headers: { "X-CSRFToken": decodeURIComponent(csrf) },
        signal: AbortSignal.timeout(70000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Photo marking failed");
      setFeedback(data.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo marking failed");
    } finally {
      setMarking(false);
    }
  }
  return (
    <div className="structured-workspace">
      <p className="structured-hint">
        {T(
          "Try each part first. Reveal its answer when you are ready to compare.",
          "ஒவ்வொரு துணை வினாவையும் முதலில் முயற்சிக்கவும். பின்னர் விடையைத் திறந்து ஒப்பிடவும்.",
        )}
      </p>
      {parts.map((part) => (
        <section className="structured-part" key={part.id}>
          <h3>{part.id}</h3>
          <p className="exam-preserve">{part.prompt[language]}</p>
          {part.image && (
            <a
              href={part.image}
              target="_blank"
              rel="noreferrer"
              className="structured-diagram"
            >
              <img
                src={part.image}
                alt={
                  part.image_alt?.[language] ||
                  T("Question diagram", "வினா வரைபடம்")
                }
                loading="lazy"
              />
              <small>
                {T("Open diagram to enlarge ↗", "வரைபடத்தைப் பெரிதாக்க ↗")}
              </small>
            </a>
          )}
          <label>
            {T("Your answer", "உங்கள் விடை")}
            <textarea
              aria-label={`${T("Your answer", "உங்கள் விடை")} ${part.id}`}
              placeholder={T(
                "Write your reasoning, calculation and units…",
                "செய்முறை, கணிப்பு, அலகுகளை எழுதுக…",
              )}
            />
          </label>
          <button
            type="button"
            disabled={loading}
            aria-expanded={!!visible[part.id]}
            onClick={() => reveal(part.id)}
          >
            {visible[part.id]
              ? T("Hide answer", "விடையை மறை")
              : T("Reveal answer", "விடையைப் பார்க்க")}
          </button>
          {visible[part.id] && (
            <div className="exam-solution">
              <h4>{T("Suggested answer", "பரிந்துரைக்கப்பட்ட விடை")}</h4>
              <p className="exam-preserve">
                {answers.find((a) => a.id === part.id)?.answer[language]}
              </p>
            </div>
          )}
        </section>
      ))}
      <section className="structured-photo">
        <h3>
          {T("Check a handwritten answer", "கையெழுத்து விடையைச் சரிபார்")}
        </h3>
        <p>
          {T(
            "Choose one subquestion and upload a clear photo of your working.",
            "ஒரு துணை வினாவைத் தெரிவுசெய்து உங்கள் செய்முறையின் தெளிவான படத்தைப் பதிவேற்றுக.",
          )}
        </p>
        <label>
          {T("Subquestion", "துணை வினா")}
          <select
            value={selected}
            disabled={marking}
            onChange={(e) => {
              setSelected(e.target.value);
              setFeedback("");
            }}
          >
            {parts.map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
          </select>
        </label>
        <label>
          {T(
            "Upload answer photo (JPG / PNG, max 5 MB)",
            "விடைப் படத்தைப் பதிவேற்றுக (JPG / PNG, அதிகபட்சம் 5 MB)",
          )}
          <input
            type="file"
            accept="image/jpeg,image/png"
            disabled={marking}
            onChange={(e) => {
              const file = e.target.files?.[0];
              setError("");
              setFeedback("");
              setConsent(false);
              setPhoto(null);
              if (file) {
                if (
                  !["image/jpeg", "image/png"].includes(file.type) ||
                  file.size > 5 * 1024 * 1024
                ) {
                  setError(
                    T(
                      "Choose a JPG or PNG up to 5 MB.",
                      "5 MB க்கு உட்பட்ட JPG அல்லது PNG படத்தைத் தெரிவுசெய்க.",
                    ),
                  );
                  return;
                }
                setPhoto(file);
              }
            }}
          />
        </label>
        <label>
          {T("Take a photo", "படம் எடுக்க")}
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            disabled={marking}
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFeedback("");
              setConsent(false);
              if (
                file &&
                file.size <= 5 * 1024 * 1024 &&
                ["image/jpeg", "image/png"].includes(file.type)
              ) {
                setPhoto(file);
                setError("");
              } else {
                setPhoto(null);
                setError(
                  T(
                    "Choose a JPG or PNG up to 5 MB.",
                    "5 MB க்கு உட்பட்ட JPG அல்லது PNG படத்தைத் தெரிவுசெய்க.",
                  ),
                );
              }
            }}
          />
        </label>
        {preview && (
          <>
            <img
              className="answer-photo"
              src={preview}
              alt={T("Your answer photo", "உங்கள் விடைப் படம்")}
            />
            <button
              disabled={marking}
              onClick={() => {
                setPhoto(null);
                setFeedback("");
                setConsent(false);
              }}
            >
              {T("Remove photo", "படத்தை அகற்று")}
            </button>
          </>
        )}
        {!enabled && (
          <p role="status">
            {T(
              "Photo preview and answer comparison are available. AI marking needs the connected Django app with its vision service configured.",
              "படத்தைப் பார்த்து விடையுடன் ஒப்பிடலாம். AI மதிப்பீட்டிற்கு பார்வைச் சேவை அமைக்கப்பட்ட Django செயலி தேவை.",
            )}
          </p>
        )}
        {enabled && (
          <label className="photo-consent">
            <input
              type="checkbox"
              checked={consent}
              disabled={marking}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {T(
              "Send this photo to OpenAI for practice feedback. Remove names and personal details first.",
              "பயிற்சிப் பின்னூட்டத்திற்காக இப்படத்தை OpenAI க்கு அனுப்ப ஒப்புக்கொள்கிறேன். முதலில் பெயர், தனிப்பட்ட விவரங்களை அகற்றுக.",
            )}
          </label>
        )}
        <button
          onClick={mark}
          disabled={!photo || !consent || !enabled || marking}
        >
          {marking
            ? T("Checking your working…", "செய்முறை சரிபார்க்கப்படுகிறது…")
            : T("Check photo with AI", "AI மூலம் படத்தைச் சரிபார்")}
        </button>
        {feedback && (
          <div className="exam-solution" role="status">
            <h4>
              {T(
                "Provisional AI feedback — verify with the answer",
                "AI பயிற்சிப் பின்னூட்டம் — விடையுடன் சரிபார்க்கவும்",
              )}
            </h4>
            <p className="exam-preserve">{feedback}</p>
          </div>
        )}
      </section>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
