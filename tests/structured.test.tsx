// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StructuredQuestion } from "../src/components/StructuredQuestion";
import { AppProvider } from "../src/state";
afterEach(cleanup);
test("subquestion answers stay hidden until requested and can be hidden again", async () => {
  localStorage.setItem("iyal-language", '"en"');
  const load = vi.fn(async () => [
    { id: "a", answer: { en: "0.01 mm", ta: "0.01 mm" } },
  ]);
  render(
    <AppProvider>
      <StructuredQuestion
        questionId={1}
        parts={[
          {
            id: "a",
            prompt: {
              en: "Find the least count",
              ta: "இழிவெண்ணிக்கையைத் தருக",
            },
          },
        ]}
        loadAnswers={load}
      />
    </AppProvider>,
  );
  expect(screen.getByText("Find the least count")).toBeTruthy();
  expect(screen.queryByText("0.01 mm")).toBeNull();
  expect(load).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }));
  await screen.findByText("0.01 mm");
  fireEvent.click(screen.getByRole("button", { name: "Hide answer" }));
  expect(screen.queryByText("0.01 mm")).toBeNull();
  expect(
    (
      screen.getByRole("button", {
        name: "Check photo with AI",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
