// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  motionAt,
  transformSample,
  transformation,
} from "../src/domain/graphs";
import { GraphLab } from "../src/components/GraphLab";
import { AppProvider } from "../src/state";
afterEach(cleanup);
describe("graph physics", () => {
  it("separates distance from displacement across a reversal", () => {
    expect(motionAt(4, -1, 8)).toMatchObject({
      velocity: -4,
      displacement: 0,
      distance: 16,
      turn: 4,
    });
    expect(motionAt(-4, 1, 8).distance).toBe(16);
    expect(motionAt(-2, 0, 3)).toMatchObject({ distance: 6, displacement: -6 });
    expect(motionAt(0, 2, 8)).toMatchObject({ distance: 64, displacement: 64 });
  });
  it("preserves points when changing axes", () => {
    expect(transformSample("inverse", "raw", 2, 4)).toEqual([2, 2]);
    expect(transformSample("inverse", "linear", 2, 4)).toEqual([0.5, 2]);
    expect(transformSample("direct", "linear", 2, 4)).toEqual([0.5, 8]);
    expect(transformSample("cube", "linear", 2, 2)).toEqual([8, 16]);
    expect(transformSample("quartic", "constant", 2, 5)).toEqual([2, 5]);
  });
  it("gives the correct log slopes and constant slopes", () => {
    for (const [f, n] of [
      ["inverse", -1],
      ["direct", 1],
      ["cube", 3],
      ["quartic", 4],
    ] as const) {
      const p = transformSample(f, "log", 0.5, 2),
        q = transformSample(f, "log", 2, 2);
      expect((q[1] - p[1]) / (q[0] - p[0])).toBeCloseTo(n);
      expect(transformation(f, "constant", 2).slope).toBe(0);
    }
  });
});
function setup(kind: string) {
  localStorage.setItem("iyal-language", '"en"');
  render(
    <AppProvider>
      <GraphLab kind={kind} />
    </AppProvider>,
  );
}
it("line presets update coefficients and handle horizontal perpendiculars", () => {
  setup("graph-lines");
  fireEvent.click(
    screen.getByRole("button", { name: "y = −2x + 7", exact: true }),
  );
  expect(screen.getByText("y = -2.00x + 7.0")).toBeTruthy();
  fireEvent.change(screen.getByRole("slider", { name: /Gradient m/ }), {
    target: { value: "0" },
  });
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "perpendicular" },
  });
  expect(screen.getByText(/The vertical gradient is undefined/)).toBeTruthy();
});
it("motion scrubber gives a complete signed-area journey", () => {
  setup("graph-motion");
  expect(screen.getByText("Distance: 16.00 m")).toBeTruthy();
  fireEvent.change(screen.getByRole("slider", { name: "Trace progress" }), {
    target: { value: ".5" },
  });
  expect(screen.getByText("Displacement: 8.00 m")).toBeTruthy();
  expect(screen.getByText("Distance: 8.00 m")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset", exact: true }));
  expect(screen.getByText("t = 0.00 s")).toBeTruthy();
});
