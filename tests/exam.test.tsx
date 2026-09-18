// @vitest-environment jsdom
import { beforeEach, afterEach, test, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
vi.hoisted(() => vi.stubEnv("VITE_API_ENABLED", "true"));
import { ExamPrep } from "../src/components/ExamPrep";
import { AppProvider } from "../src/state";
import { C, parseRoute } from "../src/model";
const q = {
  id: 1,
  year: 2024,
  paper: "Physics I",
  number: "3",
  kind: "mcq",
  title: { en: "Test question", ta: "வினா" },
  prompt: { en: "Choose a unit", ta: "அலகைத் தெரிவுசெய்க" },
  marks: 1,
  minutes: 2,
  source: "",
  pdf: null,
  options: { en: ["metre", "second"], ta: ["மீற்றர்", "செக்கன்"] },
};
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.includes("catalog")
              ? {
                  counts: [{ chapter_id: "01", kind: "mcq", total: 1 }],
                  admin_url: "/admin/learning/examquestion/",
                }
              : url.includes("solutions")
                ? {
                    correct_option: 1,
                    solution: { en: "Metre is length", ta: "நீள அலகு" },
                    pdf: null,
                  }
                : {
                    questions: [q],
                    years: [2024],
                    total: 1,
                    pages: 1,
                    page: 1,
                  },
          ),
          { status: 200 },
        ),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function mount(props = {}) {
  return render(
    <AppProvider>
      <ExamPrep {...props} />
    </AppProvider>,
  );
}
test("all 11 chapters link to separate question-type pages", async () => {
  mount();
  await screen.findByText("Manage question bank ↗");
  C.chapters.forEach((c) =>
    expect(
      screen.getByRole("link", { name: new RegExp(c.en) }).getAttribute("href"),
    ).toBe(`#/practice/${c.id}`),
  );
  expect(parseRoute("#/practice/01/mcq")).toMatchObject({
    type: "practice",
    kind: "mcq",
    chapter: { id: "01" },
  });
  expect(parseRoute("#/practice/01/invalid")).toEqual({ type: "missing" });
  fireEvent.change(screen.getByRole("textbox", { name: "Search chapters" }), {
    target: { value: "no matching chapter" },
  });
  expect(screen.getByRole("status").textContent).toContain("No chapters");
});
test("chapter offers MCQ structured and essay cards", async () => {
  mount({ chapter: C.chapters[0] });
  await screen.findByText("Manage question bank ↗");
  for (const kind of ["mcq", "structured", "essay"])
    expect(
      document.querySelector(`a[href="#/practice/01/${kind}"]`),
    ).toBeTruthy();
});
test("MCQ solution loads only on request and does not grant mastery", async () => {
  mount({ chapter: C.chapters[0], kind: "mcq" });
  fireEvent.click(await screen.findByRole("button", { name: /Question [38]/ }));
  expect(screen.queryByText("Test question")).toBeNull();
  expect(
    vi
      .mocked(fetch)
      .mock.calls.some(([url]) => String(url).includes("solutions")),
  ).toBe(false);
  fireEvent.click(screen.getByRole("radio", { name: /metre/ }));
  await screen.findByText("Correct — nicely reasoned!");
  expect(screen.getByText("Metre is length")).toBeTruthy();
  expect(localStorage.getItem("iyal-practice-v1")).toBeNull();
});
test("year filter requests selected year and failures offer retry", async () => {
  mount({ chapter: C.chapters[0], kind: "mcq" });
  await screen.findByRole("button", { name: /Question [38]/ });
  vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "2024" } });
  await screen.findByRole("alert");
  expect(
    vi
      .mocked(fetch)
      .mock.calls.some(([url]) => String(url).includes("year=2024")),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("button", { name: /Question [38]/ });
});

test("subchapter cards preserve multiple accepted answers without scans", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.includes("catalog")
              ? { counts: [], admin_url: null }
              : url.includes("solutions")
                ? {
                    correct_option: 3,
                    accepted_options: [3, 5],
                    solution: {
                      en: "Either option is accepted",
                      ta: "இரண்டும் சரி",
                    },
                    pdf: null,
                  }
                : {
                    sections: [
                      {
                        slug: "measurements-dimensions",
                        title: {
                          en: "Measurements and Dimensions",
                          ta: "அளவீடுகளும் பரிமாணங்களும்",
                        },
                        total: 81,
                      },
                    ],
                    questions: [
                      {
                        ...q,
                        number: "8",
                        image: "/api/exam/files/8/image/",
                        options: {
                          en: [
                            "m s⁻²",
                            "J m kg⁻¹",
                            "m³ kg⁻¹ s⁻²",
                            "m² kg⁻¹ s⁻²",
                            "N m² kg⁻²",
                          ],
                          ta: ["1", "2", "3", "4", "5"],
                        },
                      },
                    ],
                    years: [1981],
                    total: 81,
                    pages: 7,
                    page: 1,
                  },
          ),
          { status: 200 },
        ),
    ),
  );
  const view = mount({ chapter: C.chapters[0], kind: "mcq" });
  expect(
    (
      await screen.findByRole("link", { name: /Measurements and Dimensions/ })
    ).getAttribute("href"),
  ).toBe("#/practice/01/mcq/measurements-dimensions");
  view.unmount();
  mount({
    chapter: C.chapters[0],
    kind: "mcq",
    section: "measurements-dimensions",
  });
  fireEvent.click(await screen.findByRole("button", { name: /Question [38]/ }));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByText(/Physics I/)).toBeNull();
  expect(document.querySelector('.exam-question-reference')?.textContent).toContain('2024');
  fireEvent.click(screen.getByRole("radio", { name: /N m² kg⁻²/ }));
  await screen.findByText("Correct — nicely reasoned!");
  expect(parseRoute("#/practice/01/mcq/measurements-dimensions")).toMatchObject(
    { section: "measurements-dimensions" },
  );
});

test("wrong selection is red, accepted answer is green, and numbers precede selectors", async () => {
  mount({chapter:C.chapters[0],kind:"mcq"});
  fireEvent.click(await screen.findByRole("button",{name:/Question 3/}));
  const wrong=screen.getByRole("radio",{name:/second/});
  expect(wrong.previousElementSibling?.textContent).toBe("2.");
  fireEvent.click(wrong);
  await screen.findByText("Not quite — review the explanation");
  expect(wrong.closest("label")?.classList.contains("is-wrong")).toBe(true);
  expect(screen.getByRole("radio",{name:/metre/}).closest("label")?.classList.contains("is-correct")).toBe(true);
  expect(screen.getByText("✕ Incorrect")).toBeTruthy();
});
