// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { C } from "../src/model";
import { ManagedLesson } from "../src/components/ManagedLesson";
import {
  UncertaintyLab,
  propagate,
  relativeUncertainty,
  uncertaintyStats,
} from "../src/components/UncertaintyLab";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("uncertainty models distinguish bounds, RSS, powers and zero readings", () => {
  expect(relativeUncertainty(50, 0.5)).toBe(1);
  expect(relativeUncertainty(0, 1)).toBeNull();
  expect(uncertaintyStats([10.1, 10.2, 10.3]).mean).toBeCloseTo(10.2);
  expect(propagate(20, 10, 0.1, 0.1, "product", false).u).toBeCloseTo(3);
  expect(propagate(20, 10, 0.1, 0.1, "product", true).u).toBeCloseTo(
    Math.sqrt(5),
  );
  expect(propagate(20, 10, 0.2, 0.1, "difference", false).u).toBeCloseTo(0.3);
  expect(propagate(20, 10, 0.1, 0.1, "square", true).u).toBeCloseTo(4);
  expect(propagate(20, 10, 0.1, 0.1, "quotient", false).u).toBeCloseTo(0.03);
});
test("zero correction removes offset while preserving spread", () => {
  const { container } = render(
    <AppProvider>
      <UncertaintyLab kind="error-target" />
    </AppProvider>,
  );
  const metrics = () =>
    Array.from(
      container.querySelectorAll(".uncertainty-metrics strong"),
      (x) => x.textContent,
    );
  const initial = metrics();
  fireEvent.click(
    screen.getByRole("button", { name: "Apply known zero correction" }),
  );
  const corrected = metrics();
  expect(parseFloat(initial[1]!) - parseFloat(corrected[1]!)).toBeCloseTo(1);
  expect(initial[2]).toBe(corrected[2]);
  fireEvent.change(screen.getByRole("slider", { name: /Zero offset/ }), {
    target: { value: "-.5" },
  });
  expect(
    screen.getByRole("button", { name: "Apply known zero correction" }),
  ).toBeTruthy();
});
test("propagation controls switch statistical interpretation and remove unused B", () => {
  render(
    <AppProvider>
      <UncertaintyLab kind="error-propagation" />
    </AppProvider>,
  );
  expect(screen.getByRole("status").textContent).toContain("3.000 cm²");
  fireEvent.change(
    screen.getByRole("combobox", { name: "Combination method" }),
    { target: { value: "true" } },
  );
  expect(screen.getByRole("status").textContent).toContain("2.236 cm²");
  fireEvent.change(screen.getByRole("combobox", { name: "Relationship" }), {
    target: { value: "square" },
  });
  expect(screen.getByRole("status").textContent).toContain("4.000 cm²");
  expect(screen.queryByRole("slider", { name: "B (cm)" })).toBeNull();
});
test("uncertainty lesson has eight unique illustrations, four activities and nine checks", async () => {
  const { container } = render(
    <AppProvider>
      <ManagedLesson lesson={C.getLesson("01", "uncertainty")!} />
    </AppProvider>,
  );
  await screen.findByText("Every reading tells an incomplete story");
  const arts = container.querySelectorAll("[data-scene]");
  expect(arts).toHaveLength(8);
  expect(
    new Set(Array.from(arts, (a) => a.getAttribute("data-scene"))).size,
  ).toBe(8);
  fireEvent.click(screen.getByRole("button", { name: "02 Explore" }));
  expect(container.querySelectorAll(".uncertainty-lab")).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "03 Quick checks" }));
  expect(
    screen.getAllByRole("button", { name: "Check my answer" }),
  ).toHaveLength(9);
});
