// @vitest-environment jsdom
import { test, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FormulaMemory } from "../src/components/FormulaMemory";
import { AppProvider } from "../src/state";
test("recall mode hides equations and reveals them again", () => {
  localStorage.setItem("iyal-language", '"en"');
  render(
    <AppProvider>
      <FormulaMemory formula={"v = u + at\na = Δv/Δt"} />
    </AppProvider>,
  );
  expect(screen.getByText("v = u + at")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Test my recall" }));
  expect(screen.queryByText("v = u + at")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Reveal formulas" }));
  expect(screen.getByText("a = Δv/Δt")).toBeTruthy();
  cleanup();
});
