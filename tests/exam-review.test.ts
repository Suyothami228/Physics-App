import { expect, test } from "vitest";
import snapshot from "../public/review/exam-bank.json";
import { selectReviewData } from "../src/exam-review";

test("review includes the published typed bank, newest first, with working pagination and answers", () => {
  const path =
    "/api/exam/questions/?chapter=01&kind=mcq&section=measurements-dimensions";
  const first = selectReviewData(snapshot, path) as any;
  expect(first.total).toBe(79);
  expect(first.questions).toHaveLength(12);
  const pages = Array.from(
    { length: first.pages },
    (_, i) =>
      (selectReviewData(snapshot, `${path}&page=${i + 1}`) as any).questions,
  ).flat();
  expect(new Set(pages.map((q) => q.id)).size).toBe(79);
  expect(pages.map((q) => q.year)).toEqual(
    pages.map((q) => q.year).sort((a, b) => b - a),
  );
  for (const q of pages) {
    expect(q.prompt.ta.length).toBeGreaterThan(10);
    expect(q.options.ta.length).toBeGreaterThanOrEqual(2);
    expect(q).not.toHaveProperty("image");
    const answer = selectReviewData(
      snapshot,
      `/api/exam/solutions/${q.id}/`,
    ) as any;
    expect(answer.correct_option).toBeGreaterThanOrEqual(1);
    expect(answer.correct_option).toBeLessThanOrEqual(q.options.ta.length);
  }
  const filtered = selectReviewData(
    snapshot,
    `${path}&year=${first.years[0]}`,
  ) as any;
  expect(filtered.questions.every((q: any) => q.year === first.years[0])).toBe(
    true,
  );
  expect((snapshot.catalog as any).admin_url).toBeNull();
});

test("missing sections and unpublished solutions cannot be displayed", () => {
  expect(
    (
      selectReviewData(
        snapshot,
        "/api/exam/questions/?chapter=01&kind=mcq&section=missing",
      ) as any
    ).total,
  ).toBe(0);
  expect(() =>
    selectReviewData(snapshot, "/api/exam/solutions/999999/"),
  ).toThrow();
});
