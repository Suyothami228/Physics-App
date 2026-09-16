// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { C, parseRoute } from "../src/model";
import { InstrumentHub } from "../src/components/InstrumentHub";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(cleanup);
test("instrument deep links resolve only known instrument pages", () => {
  const route = parseRoute("#/chapter/01/instruments/vernier");
  expect(route.type).toBe("lesson");
  if (route.type === "lesson") expect(route.instrument).toBe("vernier");
  expect(parseRoute("#/chapter/01/instruments/unknown").type).toBe("missing");
  expect(parseRoute("#/chapter/01/dimensions/vernier").type).toBe("missing");
});
test("overview offers instrument choices instead of the vernier lab", () => {
  render(
    <AppProvider>
      <InstrumentHub lesson={C.getLesson("01", "instruments")!} />
    </AppProvider>,
  );
  expect(screen.getByText("What are you measuring?")).toBeTruthy();
  expect(screen.getAllByRole("link")).toHaveLength(7);
  expect(
    screen.getByRole("link", { name: /Vernier caliper/ }).getAttribute("href"),
  ).toBe("#/chapter/01/instruments/vernier");
  expect(screen.queryByRole("button", { name: "Place object" })).toBeNull();
});
test("vernier page has its own tabs and existing 3D lab", async () => {
  render(
    <AppProvider>
      <InstrumentHub
        lesson={C.getLesson("01", "instruments")!}
        instrument="vernier"
      />
    </AppProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "02 Explore" }));
  expect(screen.getByRole("button", { name: "Place object" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "03 Quick checks" }));
  expect(
    screen.getAllByRole("button", { name: "Check my answer" }),
  ).toHaveLength(4);
});
test("undeveloped instrument keeps its tabs without leaking vernier content", async () => {
  render(
    <AppProvider>
      <InstrumentHub
        lesson={C.getLesson("01", "instruments")!}
        instrument="spherometer"
      />
    </AppProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "02 Explore" }));
  expect(screen.getByText("This section is being prepared")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Place object" })).toBeNull();
  expect(screen.getByRole("button", { name: "03 Quick checks" })).toBeTruthy();
});
