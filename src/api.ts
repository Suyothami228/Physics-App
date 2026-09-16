import {
  B,
  C,
  type Attempt,
  type Chapter,
  type Question,
  type Bilingual,
} from "./model";

export const API_ENABLED = import.meta.env.VITE_API_ENABLED === "true";
export type Account = { id: number; username: string };
const remoteQuestions = new Map<string, Question>();

export async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const csrf =
    document.cookie
      .split("; ")
      .find((part) => part.startsWith("csrftoken="))
      ?.split("=")
      .slice(1)
      .join("=") ?? "";
  const response = await fetch(`/api/${path}/`, {
    method,
    credentials: "same-origin",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": decodeURIComponent(csrf),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error ||
        (response.status === 403
          ? "Session expired. Reload and sign in again."
          : "Unable to connect. Please try again."),
    );
  }
  return response.json();
}

export async function loadLearningData() {
  const [curriculum, bank, progress] = await Promise.all([
    request<{ chapters: Chapter[]; total: number }>("curriculum"),
    request<{ questions: Question[] }>("questions"),
    request<{ attempts: Attempt[] }>("attempts"),
  ]);
  if (
    !curriculum.chapters.length ||
    !bank.questions.some((q) => q.id === "energy-1" && q.variant === 0)
  ) {
    throw new Error(
      "Course content is missing. Ask the team to run seed_content.",
    );
  }
  C.chapters.splice(0, C.chapters.length, ...curriculum.chapters);
  C.total = curriculum.total;
  remoteQuestions.clear();
  bank.questions.forEach((q) =>
    remoteQuestions.set(`${q.id}:${q.variant}`, {
      ...q,
      explain: { en: "", ta: "" },
    }),
  );
  return B.clean(progress.attempts);
}

export const getQuestion = (id: string, variant = 0): Question => {
  if (!API_ENABLED) return B.make(id, variant);
  const q = remoteQuestions.get(`${id}:${variant}`);
  if (!q) throw new Error("Question unavailable. Reload course content.");
  return q;
};

export function nextQuestion(
  history: Attempt[],
  filter = "all",
): Question | null {
  if (!API_ENABLED) return B.next(history, filter);
  const score = B.evaluate(history);
  const candidates = [...remoteQuestions.values()].filter(
    (q) =>
      (filter === "all" || q.family === filter) &&
      !history.some(
        (a) =>
          a.id === q.id &&
          (a.prompt ?? B.make(a.id, a.variant).prompt.en) === q.prompt.en,
      ),
  );
  const weight = (q: Question) => {
    const skill = score.skills.find((s) => s.id === q.family);
    return skill
      ? (skill.secure ? 100 : 0) + skill.correct * 10 + skill.total
      : 0;
  };
  candidates.sort(
    (a, b) =>
      weight(a) - weight(b) ||
      a.variant - b.variant ||
      a.id.localeCompare(b.id),
  );
  return candidates[0] ?? null;
}

export async function recordRemote(q: Question, answer?: string) {
  const result = await request<{ explain: Bilingual }>(
    answer === undefined ? "solutions" : "attempts",
    "POST",
    {
      question: `${q.id}:${q.variant}`,
      ...(answer === undefined ? {} : { answer }),
    },
  );
  // The server records the event before the UI exposes feedback or a solution.
  const progress = await request<{ attempts: Attempt[] }>("attempts");
  return { explain: result.explain, history: B.clean(progress.attempts) };
}
