// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
vi.hoisted(() => vi.stubEnv("VITE_API_ENABLED", "true"));
import snapshot from "../public/review/exam-bank.json";
import { selectReviewData } from "../src/exam-review";
import { ExamPrep } from "../src/components/ExamPrep";
import { AppProvider, useApp } from "../src/state";
import { C } from "../src/model";

function Bank({ kind }: { kind: "mcq" | "structured" }) {
  const { language, setLanguage } = useApp();
  return (
    <>
      <button onClick={() => setLanguage(language === "ta" ? "en" : "ta")}>
        Switch language
      </button>
      <ExamPrep
        chapter={C.chapters[0]}
        kind={kind}
        section={kind === "mcq" ? "measurements-dimensions" : undefined}
      />
    </>
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.includes("photo-marking")
              ? { enabled: false }
              : selectReviewData(snapshot, url),
          ),
        ),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("published bank has English questions, choices and answers throughout", () => {
  for (const collection of Object.values(snapshot.collections)) {
    for (const q of collection.questions) {
      expect(q.prompt.en).toBeTruthy();
      expect(q.prompt.en).not.toMatch(/[\u0b80-\u0bff]/);
      expect(q.title.en).not.toMatch(/[\u0b80-\u0bff]/);
      if ("options" in q) {
        expect(q.options.en.length).toBe(q.options.ta.length);
        q.options.en.forEach((option) =>
          expect(option).not.toMatch(/[\u0b80-\u0bff]/),
        );
      }
      for (const part of q.parts)
        expect(part.prompt.en).not.toMatch(/[\u0b80-\u0bff]/);
    }
  }
  for (const solution of Object.values(snapshot.solutions)) {
    expect(solution.solution.en).not.toMatch(/[\u0b80-\u0bff]/);
    for (const part of solution.parts)
      expect(part.answer.en).not.toMatch(/[\u0b80-\u0bff]/);
  }
});

test("MCQ language switch updates choices and an already revealed solution", async () => {
  render(
    <AppProvider>
      <Bank kind="mcq" />
    </AppProvider>,
  );
  fireEvent.click((await screen.findAllByRole("button", { name: /^வினா/ }))[0]);
  fireEvent.click(screen.getByRole("radio", { name: /ஒலிச் செறிவு மட்டம்/ }));
  await screen.findByText(/படிப்படியான விளக்கம்/);
  fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
  expect(
    screen.getByText("Which physical quantity has a unit but no dimensions?"),
  ).toBeTruthy();
  expect(
    screen.getByRole("radio", { name: /Sound intensity level/ }),
  ).toBeTruthy();
  expect(screen.getByText(/Supplied answer key: 5/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
  expect(
    screen.getByRole("radio", { name: /ஒலிச் செறிவு மட்டம்/ }),
  ).toBeTruthy();
});

test("structured language switch updates an open part and its answer", async () => {
  render(
    <AppProvider>
      <Bank kind="structured" />
    </AppProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: /^வினா 1 ·/ }));
  fireEvent.click(
    screen.getAllByRole("button", { name: "விடையைப் பார்க்க" })[0],
  );
  await screen.findByText("A: பூண். B: தீதாள். C: தீதாள் தலை / பற்றுச்சுற்றி.");
  fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
  expect(
    screen.getByText(
      "Name the parts labelled A, B (excluding the scales) and C in Figure (1).",
    ),
  ).toBeTruthy();
  expect(
    screen.getByText(
      "A: Sleeve (barrel). B: Thimble. C: Ratchet head / ratchet stop.",
    ),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Hide answer" })).toBeTruthy();
});
