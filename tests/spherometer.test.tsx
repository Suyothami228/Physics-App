// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { SpherometerLab } from "../src/components/SpherometerLab";
import {
  screwReading,
  radiusOfCurvature,
  clampProbe,
} from "../src/domain/spherometer";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("scale rollover, concave reading and curvature use correct units", () => {
  expect(screwReading(-0.86)).toEqual({ main: 4, circular: 14, total: 4.14 });
  expect(screwReading(0.99).circular).toBe(99);
  expect(screwReading(1).circular).toBe(0);
  expect(radiusOfCurvature(30, 1)).toBe(150.5);
  expect(radiusOfCurvature(30, 0)).toBeNull();
  expect(clampProbe(-2, "concave")).toBe(-0.86);
});
test("contact gating, reference subtraction, sample invalidation and lock", async () => {
  render(
    <AppProvider>
      <SpherometerLab />
    </AppProvider>,
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Record reference",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Gently touch surface" }));
  fireEvent.click(screen.getByRole("button", { name: "Record reference" }));
  fireEvent.click(screen.getByRole("button", { name: "Concave surface" }));
  fireEvent.click(screen.getByRole("button", { name: "Gently touch surface" }));
  expect(screen.getByText("✓ Object in contact")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Record measurement" }));
  expect(screen.getByText("0.86 mm")).toBeTruthy();
  const handle = await screen.findByRole("slider");
  fireEvent.click(screen.getByRole("button", { name: "Lock", exact: true }));
  fireEvent.keyDown(handle, { key: "ArrowUp" });
  expect(handle.getAttribute("aria-valuenow")).toBe("-0.86");
  fireEvent.click(screen.getByRole("button", { name: "Thin sheet" }));
  expect(screen.queryByText("0.86 mm")).toBeNull();
});
