import bank from "./domain/bank.js";
import curriculum from "./domain/curriculum.js";
import { instruments } from "./domain/instruments";
export type Language = "ta" | "en";
export type Bilingual = { ta: string; en: string };
export type Lesson = Bilingual & {
  id: string;
  slug: string;
  index: number;
  available: boolean;
  content_status?: string;
  edit_url?: string | null;
};
export type Chapter = Bilingual & {
  id: string;
  slug: string;
  description: Bilingual;
  formula: string;
  color: string;
  source: string;
  lessons: Lesson[];
  edit_url?: string | null;
};
export type Attempt = {
  id: string;
  variant: number;
  correct: boolean;
  assisted: boolean;
  at: number;
  viewed?: boolean;
  prompt?: string;
};
export type Question = {
  id: string;
  variant: number;
  family: string;
  type: "numeric" | "choice";
  prompt: Bilingual;
  explain: Bilingual;
  unit: string;
  value: number;
  correct: number;
  options: Bilingual[];
  source: string | null;
  graph?: { start: number; end: number; duration: number };
};
export type Score = {
  total: number;
  correct: number;
  accuracy: number;
  ready: boolean;
  reviewDue: boolean;
  lastAt: number;
  assisted: number;
  skills: { id: string; total: number; correct: number; secure: boolean }[];
};
export const B = bank as unknown as {
  families: Record<string, Bilingual>;
  ids: string[];
  source: string;
  make: (id: string, variant?: number) => Question;
  grade: (q: Question, input: unknown) => { valid: boolean; correct?: boolean };
  clean: (input: unknown) => Attempt[];
  evaluate: (h: Attempt[], now?: number) => Score;
  next: (h: Attempt[], filter?: string) => Question | null;
};
export const C = curriculum as unknown as {
  chapters: Chapter[];
  total: number;
  course: string;
  getChapter: (id: string) => Chapter | undefined;
  getLesson: (id: string, slug: string) => Lesson | undefined;
};
export type Route =
  | { type: "home" | "chapters" | "progress" | "missing" }
  | {
      type: "practice";
      chapter?: Chapter;
      kind?: "mcq" | "structured" | "essay";
      adaptive?: boolean;
      section?: string;
    }
  | { type: "chapter"; chapter: Chapter }
  | { type: "lesson"; chapter: Chapter; lesson: Lesson; instrument?: string };
export function parseRoute(hash: string): Route {
  const p = hash.replace(/^#\/?/, "").split("/");
  if (!p[0] || p[0] === "home") return { type: "home" };
  if (["chapters", "progress", "practice"].includes(p[0]) && p.length === 1)
    return { type: p[0] as "chapters" | "progress" | "practice" };
  if (p[0] === "practice" && p[1] === "adaptive" && p.length === 2)
    return { type: "practice", adaptive: true };
  const c = C.getChapter(p[1]);
  if (p[0] === "practice" && c) {
    if (p.length === 2) return { type: "practice", chapter: c };
    if (
      (p.length === 3 || (p.length === 4 && /^[a-z0-9_-]+$/.test(p[3]))) &&
      ["mcq", "structured", "essay"].includes(p[2])
    )
      return {
        type: "practice",
        chapter: c,
        kind: p[2] as "mcq" | "structured" | "essay",
        section: p[3],
      };
  }
  if (p[0] === "chapter" && c) {
    if (p.length === 2) return { type: "chapter", chapter: c };
    const l = C.getLesson(c.id, p[2]);
    if (p.length === 3 && l) return { type: "lesson", chapter: c, lesson: l };
    if (
      p.length === 4 &&
      l?.id === "01/instruments" &&
      instruments.some((i) => i.slug === p[3])
    )
      return { type: "lesson", chapter: c, lesson: l, instrument: p[3] };
  }
  return { type: "missing" };
}
export const link = (id: string, slug?: string) =>
  `#/chapter/${id}${slug ? "/" + slug : ""}`;
