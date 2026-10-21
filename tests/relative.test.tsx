// @vitest-environment jsdom
import { afterEach, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { relative, river, upstreamAngle } from "../src/domain/relative";
import { RelativeLab } from "../src/components/RelativeLab";
import { AppProvider } from "../src/state";
afterEach(cleanup);
it("subtracts vectors, preserving signs and antisymmetry", () => {
  expect(relative([0, 40], [0, -12])).toEqual([0, 52]);
  expect(relative([18, 0], [30, 0])).toEqual([-12, 0]);
  expect(relative([0, 10], [10, 0])).toEqual([-10, 10]);
  expect(relative([10, 0], [0, 10])).toEqual([10, -10]);
});
it("reproduces both river examples and the limiting condition", () => {
  expect(river(5, 3, 1200, 0)).toMatchObject({ time: 240, drift: 720 });
  const r = river(5, 3, 1200, upstreamAngle(5, 3)!);
  expect(r.time).toBeCloseTo(300);
  expect(r.drift).toBeCloseTo(0);
  expect(upstreamAngle(3, 3)).toBeNull();
  expect(upstreamAngle(2, 3)).toBeNull();
});
function setup(kind: string) {
  localStorage.setItem("iyal-language", '"en"');
  render(
    <AppProvider>
      <RelativeLab kind={kind} />
    </AppProvider>,
  );
}
it("switches observer without changing relative velocity", () => {
  setup("relative-ships");
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "B" } });
  expect(screen.getByText("V_AB = (12, 0) m/s")).toBeTruthy();
  expect(screen.getByText(/V_AB = \(12, 0\) · V_BB = \(0, 0\)/)).toBeTruthy();
});
it("sets the upstream heading and disables it when impossible", () => {
  setup("relative-river");
  fireEvent.click(
    screen.getByRole("button", { name: "Land directly opposite" }),
  );
  expect(screen.getByText("Crossing time: 300.0 s")).toBeTruthy();
  fireEvent.change(
    screen.getByRole("slider", { name: "River current (m/s)" }),
    { target: { value: "6" } },
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Land directly opposite",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
