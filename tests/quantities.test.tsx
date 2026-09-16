// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import { AppProvider } from "../src/state";
import { C } from "../src/model";
import { ManagedLesson } from "../src/components/ManagedLesson";
import { angleMeasures, AngleLab } from "../src/components/UnitLearning";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("angle ratios preserve scale and sphere limits", () => {
  expect(angleMeasures(3, 2).arc).toBe(6);
  expect(angleMeasures(1, 1).solid).toBe(angleMeasures(5, 1).solid);
  expect(angleMeasures(2, Math.PI).solid).toBeCloseTo(4 * Math.PI);
  expect(angleMeasures(2, 0).solid).toBe(0);
});
test("quantities has unique artwork, searchable tables and row recall", async () => {
  render(
    <AppProvider>
      <ManagedLesson lesson={C.getLesson("01", "quantities")!} />
    </AppProvider>,
  );
  await screen.findByText("Meet the seven SI base units");
  const graphics = document.querySelectorAll("svg[data-scene]");
  expect(graphics.length).toBe(8);
  expect(
    new Set(Array.from(graphics, (g) => g.getAttribute("data-scene"))).size,
  ).toBe(8);
  for (const button of screen.getAllByRole("button", {
    name: "Open full reference table ↗",
  }))
    fireEvent.click(button);
  expect(screen.getAllByRole("table")).toHaveLength(4);
  const base = screen.getAllByRole("table")[0];
  expect(within(base).getAllByRole("row")).toHaveLength(8);
  fireEvent.change(screen.getAllByRole("searchbox")[0], {
    target: { value: "kilogram" },
  });
  expect(within(base).getAllByRole("row")).toHaveLength(2);
  fireEvent.click(
    screen.getAllByRole("button", { name: "Practise recall" })[0],
  );
  expect(within(base).queryByText("kg")).toBeNull();
  fireEvent.click(within(base).getByRole("button", { name: "Reveal · Mass" }));
  expect(within(base).getByText("kg")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "03 Quick checks" }));
  expect(
    screen.getAllByRole("button", { name: "Check my answer" }),
  ).toHaveLength(8);
});
test("angle lab recalculates arc length and resets", () => {
  render(
    <AppProvider>
      <AngleLab />
    </AppProvider>,
  );
  fireEvent.change(screen.getByRole("slider", { name: /Radius/ }), {
    target: { value: "3" },
  });
  expect(screen.getByRole("status").textContent).toContain("s = 3.00 m");
  fireEvent.click(screen.getByRole("button", { name: "Solid angle" }));
  expect(screen.getByRole("status").textContent).toContain("Ω = 2.89 sr");
  fireEvent.click(screen.getByRole("button", { name: "Reset model" }));
  expect(screen.getByRole("status").textContent).toContain("s = 2.00 m");
});

test("unit activities change focus, prefix scale and grade a complete matching round", async () => {
  const { container } = render(
    <AppProvider>
      <ManagedLesson lesson={C.getLesson("01", "quantities")!} />
    </AppProvider>,
  );
  await screen.findByText("Meet the seven SI base units");
  expect(screen.queryByRole("table")).toBeNull();
  const studio = within(
    container.querySelectorAll(".unit-studio")[0] as HTMLElement,
  );
  fireEvent.click(studio.getByRole("button", { name: "kg Mass" }));
  expect(studio.getByRole("heading", { name: "Mass" })).toBeTruthy();
  fireEvent.click(studio.getByRole("button", { name: "5-question challenge" }));
  for (const answer of ["kg", "s", "A", "K", "mol"]) {
    fireEvent.click(studio.getByRole("button", { name: answer, exact: true }));
    expect(studio.getByRole("status").textContent).toContain("That’s right.");
    const next = studio.queryByRole("button", { name: "Next question →" });
    fireEvent.click(next ?? studio.getByRole("button", { name: "See result" }));
  }
  expect(studio.getByText("5 / 5")).toBeTruthy();
  const prefixes = within(
    container.querySelectorAll(".unit-studio")[3] as HTMLElement,
  );
  fireEvent.change(prefixes.getByRole("slider"), { target: { value: "14" } });
  expect(prefixes.getByRole("heading", { name: "milli" })).toBeTruthy();
  expect(prefixes.getByRole("status").textContent).toBe("1 mm = 10-3 m");
});
