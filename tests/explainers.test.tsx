// @vitest-environment jsdom
import { it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ManimExplainer } from "../src/components/ManimExplainer";
import { AppProvider } from "../src/state";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("seeks to a step and displays its bilingual caption", () => {
  localStorage.setItem("iyal-language", '"en"');
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  const { container } = render(
    <AppProvider>
      <ManimExplainer name="relative-observer" />
    </AppProvider>,
  );
  const buttons = screen
    .getByRole("navigation", { name: "Explanation steps" })
    .querySelectorAll("button");
  fireEvent.click(buttons[2]);
  expect(container.querySelector("video")!.currentTime).toBe(8);
  expect(container.querySelector(".manim-caption")!.textContent).toContain(
    "Vector subtraction",
  );
});
it("does not reuse built-in timestamps for an unrelated custom video", () => {
  const { container } = render(
    <AppProvider>
      <ManimExplainer
        name="relative-river"
        url="https://example.com/custom.mp4"
      />
    </AppProvider>,
  );
  expect(container.querySelector("video")!.getAttribute("src")).toBe(
    "https://example.com/custom.mp4",
  );
  expect(container.querySelector(".manim-steps")).toBeNull();
});
it("keeps transcript accessible when a video fails", () => {
  localStorage.setItem("iyal-language", '"en"');
  const { container } = render(
    <AppProvider>
      <ManimExplainer name="relative-river" />
    </AppProvider>,
  );
  fireEvent.error(container.querySelector("video")!);
  expect(screen.getByRole("alert").textContent).toContain("could not load");
  expect(screen.getByText("Read the full explanation")).toBeTruthy();
});
