// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { C } from "../src/model";
import { ManagedLesson } from "../src/components/ManagedLesson";
import {
  pendulumPeriod,
  gasRatios,
  reflectPosition,
  PendulumInvestigation,
} from "../src/components/IntroductionExperiments";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("pendulum scaling and gas relationships follow the stated models", () => {
  expect(pendulumPeriod(1)).toBeCloseTo(2.00607, 4);
  expect(pendulumPeriod(2) / pendulumPeriod(0.5)).toBeCloseTo(2);
  expect(gasRatios(600).pressure).toBe(2);
  expect(gasRatios(600).speed).toBeCloseTo(Math.sqrt(2));
  for (const time of [0, 0.2, 10, 10000])
    for (const v of [-100, 0, 100]) {
      expect(reflectPosition(30, v, time, 100)).toBeGreaterThanOrEqual(0);
      expect(reflectPosition(30, v, time, 100)).toBeLessThanOrEqual(100);
    }
});
test("introduction shows visual cards, interactive method and two Explore models", async () => {
  render(
    <AppProvider>
      <ManagedLesson lesson={C.getLesson("01", "introduction")!} />
    </AppProvider>,
  );
  expect(
    await screen.findByText("Unification · find the shared rule"),
  ).toBeTruthy();
  const illustrations = document.querySelectorAll("svg[data-scene]");
  expect(illustrations).toHaveLength(11);
  expect(
    new Set(Array.from(illustrations, (svg) => svg.getAttribute("data-scene")))
      .size,
  ).toBe(11);
  fireEvent.click(screen.getByRole("button", { name: "Pause animations" }));
  expect(
    document.querySelector(".managed-lesson.concept-motion-paused"),
  ).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "Resume animations" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Resume animations" }));
  expect(document.querySelector(".concept-motion-paused")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /05Refine & repeat/ }));
  expect(
    screen.getByRole("button", { name: "↻ Return to observation" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "02 Explore" }));
  expect(
    screen.getByText("Make a prediction. Test the pendulums."),
  ).toBeTruthy();
  expect(
    screen.getByText("From moving particles to gas pressure"),
  ).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "▶ Run model" })).toHaveLength(
    2,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Step 0.1 s" })[0]);
  expect(screen.getByText("t = 0.1 s")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "03 Quick checks" }));
  expect(
    screen.getAllByRole("button", { name: "Check my answer" }),
  ).toHaveLength(7);
});
test("changing mass preserves the period and model notebook records the settings", () => {
  render(
    <AppProvider>
      <PendulumInvestigation />
    </AppProvider>,
  );
  fireEvent.change(screen.getByRole("slider", { name: /Test B: mass/ }), {
    target: { value: "500" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Record model result" }));
  const row = screen.getAllByRole("row")[1];
  expect(row.textContent).toContain("500");
  expect(row.textContent).toContain("2.01");
  expect(row.textContent).toContain("20.06");
});
