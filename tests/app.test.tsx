// @vitest-environment jsdom
import { afterEach, beforeEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App from "../src/App";
import { AppProvider } from "../src/state";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
  window.scrollTo = vi.fn();
});
afterEach(cleanup);
test("outline tabs and bookmarks persist without granting mastery", () => {
  location.hash = "#/chapter/02/motion";
  const view = render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
  if (screen.queryByText("Page not found")) throw Error("Invalid test fixture");
  fireEvent.click(screen.getByRole("button", { name: "Save lesson" }));
  expect(JSON.parse(localStorage.getItem("iyal-saved")!)).toHaveLength(1);
  fireEvent.click(screen.getByRole("tab", { name: /Experiment/ }));
  expect(
    screen
      .getByRole("tab", { name: /Experiment/ })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(JSON.parse(localStorage.getItem("iyal-practice-v1")!)).toEqual([]);
  view.unmount();
  render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
  expect(screen.getByRole("button", { name: "Saved" })).toBeTruthy();
});
test("solution exposure survives reload and excludes later correct answer", () => {
  location.hash = "#/practice/adaptive";
  const view = render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show solution" }));
  view.unmount();
  render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
  fireEvent.change(screen.getByLabelText("Your answer"), {
    target: { value: "60" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
  const rows = JSON.parse(localStorage.getItem("iyal-practice-v1")!);
  expect(rows).toHaveLength(2);
  expect(rows.every((a: { assisted: boolean }) => a.assisted)).toBe(true);
  expect(screen.getByText("0/18")).toBeTruthy();
});
test("language toggle persists preference", () => {
  location.hash = "#/home";
  render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "தமிழ் ↗" }));
  expect(document.documentElement.lang).toBe("ta");
  expect(JSON.parse(localStorage.getItem("iyal-language")!)).toBe("ta");
});
