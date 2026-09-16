// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { CaliperAnatomy } from "../src/components/CaliperAnatomy";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"ta"');
});
afterEach(cleanup);
test("PDF terminology and exact image are available in both anatomy views", () => {
  const { container } = render(
    <AppProvider>
      <CaliperAnatomy />
    </AppProvider>,
  );
  expect(
    screen.getByRole("heading", { name: "வேணியர் இடுக்கிமானியின் பகுதிகள்" }),
  ).toBeTruthy();
  expect(container.querySelector("image")?.getAttribute("href")).toBe(
    "/images/vernier-reference.jpg",
  );
  for (const term of [
    "புறத்தாடைகள்",
    "அகத்தாடைகள்",
    "திருகு (S)",
    "பிரதான அளவிடை",
    "வேணியர் அளவிடை",
    "ஆழம் அளக்கும் கோல்",
  ])
    expect(screen.getAllByText(term).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "3D · பகுதிகளை ஆராய்க" }));
  expect(container.querySelectorAll("polygon").length).toBeGreaterThan(30);
  expect(screen.getByRole("button", { name: "திருகு (S)" })).toBeTruthy();
  expect(screen.queryByRole("spinbutton")).toBeNull();
});
