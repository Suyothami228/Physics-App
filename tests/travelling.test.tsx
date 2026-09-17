// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { TravellingLab } from "../src/components/TravellingLab";
import { tmReading, tmClamp, refractiveIndex } from "../src/domain/travelling";
import { parseRoute } from "../src/model";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("vernier half-millimetre rollover and valid glass ratio", () => {
  expect(tmReading(26.38)).toEqual({ main: 26, vernier: 38, total: 26.38 });
  expect(tmReading(26.5)).toEqual({ main: 26.5, vernier: 0, total: 26.5 });
  expect(tmClamp(100, 15, 65)).toBe(65);
  expect(refractiveIndex(25, 30, 40)?.index).toBe(1.5);
  expect(refractiveIndex(25, 41, 40)).toBeNull();
  expect(parseRoute("#/chapter/01/instruments/travelling").type).toBe("lesson");
});
test("tube requires alignment, computes difference, and clears readings on dimension change", () => {
  render(
    <AppProvider>
      <TravellingLab />
    </AppProvider>,
  );
  const record = screen.getByRole("button", {
    name: "Record reading",
  }) as HTMLButtonElement;
  expect(record.disabled).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Show correct alignment" }),
  );
  fireEvent.click(record);
  fireEvent.click(screen.getByRole("button", { name: "Right edge" }));
  expect(record.disabled).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Show correct alignment" }),
  );
  fireEvent.click(record);
  expect(screen.getByText("12.44 mm")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Rubber tube · internal diameter" }),
  );
  expect(screen.queryByText("12.44 mm")).toBeNull();
});
test("three glass focus readings produce refractive index, lock prevents fine motion", () => {
  render(
    <AppProvider>
      <TravellingLab />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Glass slab" }));
  for (const name of [
    "1. Mark without glass",
    "2. Mark through glass",
    "3. Top surface speck",
  ]) {
    fireEvent.click(screen.getByRole("button", { name }));
    fireEvent.click(
      screen.getByRole("button", { name: "Show correct alignment" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Record reading" }));
  }
  expect(screen.getByText("1.50")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Lock", exact: true }));
  expect(
    (screen.getByRole("button", { name: "Y +0.01" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

test.each([
  ["Soap bubble · diameter", "10.00 mm"],
  ["Rubber tube · external diameter", "12.44 mm"],
  ["Rubber tube · internal diameter", "6.92 mm"],
  ["Capillary tube · internal diameter", "1.20 mm"],
])("measures %s with matching edges", (name, expected) => {
  render(
    <AppProvider>
      <TravellingLab />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name }));
  for (const edge of ["Left edge", "Right edge"]) {
    fireEvent.click(screen.getByRole("button", { name: edge }));
    fireEvent.click(
      screen.getByRole("button", { name: "Show correct alignment" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Record reading" }));
  }
  expect(screen.getByText(expected)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Glass slab" }));
  expect(screen.queryByText(expected)).toBeNull();
});
