type ReviewQuestion = { id: number; year: number; section: string | null };
type Collection = {
  questions: ReviewQuestion[];
  sections: {
    slug: string;
    title: { en: string; ta: string };
    total: number;
  }[];
  years: number[];
  total: number;
  pages: number;
  page: number;
};
type Snapshot = {
  catalog: unknown;
  collections: Record<string, Collection>;
  solutions: Record<string, unknown>;
};
let pending: Promise<Snapshot> | undefined;

export function selectReviewData(snapshot: Snapshot, path: string): unknown {
  const url = new URL(path, "https://review.local");
  if (url.pathname === "/api/exam/catalog/") return snapshot.catalog;
  const solution = url.pathname.match(/^\/api\/exam\/solutions\/(\d+)\/$/);
  if (solution) {
    if (!(solution[1] in snapshot.solutions))
      throw new Error("Question not found");
    return snapshot.solutions[solution[1]];
  }
  if (url.pathname !== "/api/exam/questions/")
    throw new Error("Unknown review endpoint");
  const params = url.searchParams;
  const collection =
    snapshot.collections[`${params.get("chapter")}/${params.get("kind")}`];
  if (!collection)
    return {
      questions: [],
      sections: [],
      years: [],
      total: 0,
      pages: 1,
      page: 1,
    };
  let questions = collection.questions.filter(
    (q) => !params.get("section") || q.section === params.get("section"),
  );
  const years = [...new Set(questions.map((q) => q.year))].sort(
    (a, b) => b - a,
  );
  if (params.get("year"))
    questions = questions.filter((q) => q.year === Number(params.get("year")));
  questions = [...questions].sort((a, b) => b.year - a.year);
  const pages = Math.max(1, Math.ceil(questions.length / 12));
  const page = Math.max(1, Math.min(pages, Number(params.get("page")) || 1));
  return {
    ...collection,
    questions: questions.slice((page - 1) * 12, page * 12),
    years,
    total: questions.length,
    pages,
    page,
  };
}

export async function readExamReview<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  pending ??= fetch("/review/exam-bank.json")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load review question bank");
      return response.json() as Promise<Snapshot>;
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    });
  const snapshot = await pending;
  signal?.throwIfAborted();
  return selectReviewData(snapshot, url) as T;
}
