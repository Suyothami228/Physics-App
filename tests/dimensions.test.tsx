// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { C } from "../src/model";
import { ManagedLesson } from "../src/components/ManagedLesson";
import {
  DimensionLab,
  cgsValue,
  pendulumDimensions,
  equationCases,
  sameDimension,
} from "../src/components/DimensionLab";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("CGS powers, pendulum scaling and equation consistency are correct", () => {
  expect(cgsValue(1, [1, 1, -2], false)).toBeCloseTo(1e5);
  expect(cgsValue(0.8, [1, -3, 0], true)).toBeCloseTo(800);
  expect(cgsValue(1, [1, 2, -2], false)).toBeCloseTo(1e7);
  expect(pendulumDimensions(0, 0.5, -0.5)).toEqual([0, 0, 1]);
  for (const c of equationCases)
    expect(c.terms.every((d) => sameDimension(d, c.terms[0]))).toBe(c.valid);
});
test("builder reveals a defining relationship and invalidates stale feedback", () => {
  render(
    <AppProvider>
      <DimensionLab kind="dimension-builder" />
    </AppProvider>,
  );
  fireEvent.change(screen.getByRole("combobox", { name: "L exponent" }), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "T exponent" }), {
    target: { value: "-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check construction" }));
  expect(screen.getByRole("status").textContent).toContain(
    "The dimensions match!",
  );
  fireEvent.change(screen.getByRole("combobox", { name: "M exponent" }), {
    target: { value: "1" },
  });
  expect(screen.queryByRole("status")).toBeNull();
});
test("equation lab separates dimensional consistency from physical validity", () => {
  render(
    <AppProvider>
      <DimensionLab kind="dimension-equations" />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "3" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Consistent", exact: true }),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "not the classical kinetic-energy formula",
  );
  fireEvent.click(screen.getByRole("button", { name: "2" }));
  expect(screen.queryByRole("status")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Inconsistent" }));
  expect(screen.getByRole("status").textContent).toContain(
    "Correct prediction",
  );
});
test("dimensions lesson includes distinct artwork, studios, four labs and ten checks", async () => {
  const { container } = render(
    <AppProvider>
      <ManagedLesson lesson={C.getLesson("01", "dimensions")!} />
    </AppProvider>,
  );
  await screen.findByText("Read the structure beneath the units");
  const graphics = container.querySelectorAll("[data-scene]");
  expect(graphics).toHaveLength(8);
  expect(
    new Set(Array.from(graphics, (g) => g.getAttribute("data-scene"))).size,
  ).toBe(8);
  expect(container.querySelectorAll(".unit-studio")).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "02 Explore" }));
  expect(container.querySelectorAll(".dimension-lab")).toHaveLength(4);
  fireEvent.click(screen.getByRole("button", { name: "03 Quick checks" }));
  expect(
    screen.getAllByRole("button", { name: "Check my answer" }),
  ).toHaveLength(10);
});
