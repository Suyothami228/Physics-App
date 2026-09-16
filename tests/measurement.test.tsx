// @vitest-environment jsdom
import { test, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { C } from "../src/model";
import { ManagedLesson } from "../src/components/ManagedLesson";
import {
  MeasurementActivity,
  convertUnit,
  readingStats,
} from "../src/components/MeasurementActivity";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("length, area and volume conversions apply the right power", () => {
  expect(convertUnit(250, 0.01, 1, 1)).toBeCloseTo(2.5);
  expect(convertUnit(25, 0.001, 1, 2)).toBeCloseTo(0.000025, 10);
  expect(convertUnit(1, 0.01, 1, 3)).toBeCloseTo(0.000001, 10);
  expect(readingStats([20.1, 20.3, 20.2]).mean).toBeCloseTo(20.2);
});
test("Measurement quick checks explain answers without awarding readiness", async () => {
  render(
    <AppProvider>
      <ManagedLesson lesson={C.getLesson("01", "quantities")!} />
    </AppProvider>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "03 Quick checks" }),
  );
  fireEvent.click(screen.getByLabelText("2.5 m"));
  fireEvent.click(
    screen.getAllByRole("button", { name: "Check my answer" })[0],
  );
  expect(screen.getByText("Correct — here is why.")).toBeTruthy();
  expect(JSON.parse(localStorage.getItem("iyal-practice-v1")!)).toEqual([]);
});
test("vernier reveals the signed zero correction", () => {
  render(
    <AppProvider>
      <MeasurementActivity kind="vernier" />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Reveal reading" }));
  expect(screen.getByRole("status").textContent).toContain("12.5 mm");
});
