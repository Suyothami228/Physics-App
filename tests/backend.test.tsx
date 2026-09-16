// @vitest-environment jsdom
import { beforeEach, afterEach, test, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
vi.hoisted(() => {
  vi.stubEnv("VITE_API_ENABLED", "true");
});
import { BackendGate } from "../src/components/BackendGate";
import { Practice } from "../src/components/Practice";
import { B, C, type Attempt } from "../src/model";
let rows: Attempt[];
let failWrite: boolean;
const fixture = B.make("energy-1");
const publicQuestion = Object.fromEntries(
  Object.entries(fixture).filter(
    ([key]) => !["value", "correct", "explain", "tolerance"].includes(key),
  ),
);
let writes: string[];
beforeEach(() => {
  rows = [];
  writes = [];
  failWrite = false;
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
  localStorage.setItem(
    "iyal-practice-v1",
    JSON.stringify([
      {
        id: "energy-2",
        variant: 0,
        correct: true,
        assisted: false,
        at: Date.now(),
      },
    ]),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string, options: RequestInit = {}) => {
      const method = options.method || "GET";
      if (method === "POST") {
        writes.push(String(path));
        if (failWrite)
          return new Response(
            JSON.stringify({ error: "Connection unavailable" }),
            { status: 503 },
          );
        expect(JSON.parse(String(options.body)).question).toBe("energy-1:0");
        rows.push({
          id: "energy-1",
          variant: 0,
          correct: false,
          assisted: true,
          viewed: true,
          at: Date.now(),
          prompt: fixture.prompt.en,
        });
        return new Response(JSON.stringify({ explain: fixture.explain }));
      }
      const responses: Record<string, unknown> = {
        "/api/session/": { user: { id: 1, username: "learner" } },
        "/api/curriculum/": { chapters: [...C.chapters], total: 72 },
        "/api/questions/": { questions: [publicQuestion] },
        "/api/attempts/": { attempts: rows },
      };
      return new Response(JSON.stringify(responses[String(path)]));
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("connected mode keeps local and account histories separate and persists solution exposure", async () => {
  render(
    <BackendGate>
      <Practice />
    </BackendGate>,
  );
  await screen.findByLabelText("Your answer");
  expect(screen.getByText("0/18")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Show solution" }));
  await screen.findByText(fixture.explain.en);
  expect(writes).toEqual(["/api/solutions/"]);
  expect(JSON.parse(localStorage.getItem("iyal-practice-v1")!)[0].id).toBe(
    "energy-2",
  );
  expect(screen.getByText(/Solution viewed:/)).toBeTruthy();
});
test("failed server write does not award local progress or reveal a solution", async () => {
  failWrite = true;
  render(
    <BackendGate>
      <Practice />
    </BackendGate>,
  );
  const input = await screen.findByLabelText("Your answer");
  fireEvent.change(input, { target: { value: "60" } });
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
  await screen.findByText("Connection unavailable");
  expect(screen.getByText("0/18")).toBeTruthy();
  expect(screen.queryByText(fixture.explain.en)).toBeNull();
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Check answer",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
});
