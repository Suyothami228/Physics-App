// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import { MicrometerLab } from "../src/components/MicrometerLab";
import { micrometerReading, clampSpindle } from "../src/domain/micrometer";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("dragging the barrel reaches contact at a narrow viewport and turns the object green", () => {
  vi.stubGlobal("PointerEvent", MouseEvent);
  const { container } = render(
    <AppProvider>
      <MicrometerLab />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Front view" }));
  fireEvent.click(screen.getByRole("button", { name: "Wire", exact: true }));
  const handle = screen.getByRole("slider", { name: "Rotate circular scale" }),
    scene = handle.closest("svg")!;
  scene.setPointerCapture = vi.fn();
  scene.releasePointerCapture = vi.fn();
  scene.getBoundingClientRect = () => ({
    width: 410,
    height: 180,
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 410,
    bottom: 180,
    toJSON() {},
  });
  const barrel = scene.querySelector("polygon[data-thimble]")!;
  fireEvent.pointerDown(barrel, { clientX: 300, clientY: 100, button: 0 });
  fireEvent.pointerMove(scene, { clientX: 250, clientY: 100 });
  expect(handle.getAttribute("aria-valuenow")).toBe("0.82");
  expect(screen.getByText(/Measuring faces in contact/)).toBeTruthy();
  expect(container.querySelector('polygon[fill="#54d896"]')).toBeTruthy();
  fireEvent.pointerUp(scene);
  fireEvent.pointerMove(scene, { clientX: 310, clientY: 100 });
  expect(handle.getAttribute("aria-valuenow")).toBe("0.82");
  fireEvent.pointerDown(handle, { clientX: 250, clientY: 100, button: 0 });
  fireEvent.pointerMove(scene, { clientX: 280, clientY: 100 });
  expect(handle.getAttribute("aria-valuenow")).toBe("10.82");
  expect(container.querySelector('polygon[fill="#54d896"]')).toBeNull();
  fireEvent.pointerCancel(scene);
});

test("Understand includes visible Tamil part labels with leader arrows", () => {
  localStorage.setItem("iyal-language", '"ta"');
  const { container } = render(
    <AppProvider>
      <MicrometerLab anatomy />
    </AppProvider>,
  );
  const scene = container.querySelector(".micro-scene svg")!;
  for (const name of [
    "பட்டை",
    "கதிர்க்கோல்",
    "காப்புறை / பிரதான அளவிடை",
    "வட்ட அளவிடை",
    "பற்சுழற்றி",
  ])
    expect(scene.textContent).toContain(name);
  expect(scene.querySelectorAll("path[marker-end]")).toHaveLength(5);
});
test("PDF examples and both screw types retain correct signed readings", () => {
  expect(micrometerReading(5.97, -0.05, 0.5)).toEqual({
    main: 5.5,
    circular: 42,
    observed: 5.92,
    corrected: 5.97,
  });
  expect(micrometerReading(7.69, 0.03, 0.5)).toEqual({
    main: 7.5,
    circular: 22,
    observed: 7.72,
    corrected: 7.69,
  });
  expect(micrometerReading(5.97, -0.05, 1)).toEqual({
    main: 5,
    circular: 92,
    observed: 5.92,
    corrected: 5.97,
  });
  for (const pitch of [0.5, 1])
    for (const gap of [0, 0.28, 0.82, 5.97, 25])
      for (const z of [-0.05, 0, 0.03]) {
        const r = micrometerReading(gap, z, pitch);
        expect(r.main + r.circular * 0.01).toBeCloseTo(r.observed);
        expect(r.corrected).toBeCloseTo(gap);
        expect(r.circular).toBeGreaterThanOrEqual(0);
        expect(r.circular).toBeLessThan(pitch * 100);
      }
  expect(clampSpindle(-1, 0.82)).toBe(0.82);
  expect(clampSpindle(100, null)).toBe(25);
});
test("contact, lock, pitch switch and answer checking form one measurement workflow", () => {
  render(
    <AppProvider>
      <MicrometerLab />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Wire", exact: true }));
  const handle = screen.getByRole("slider", { name: "Rotate circular scale" });
  const check = screen.getByRole("button", {
    name: "Check measurement",
  }) as HTMLButtonElement;
  fireEvent.change(screen.getByRole("spinbutton"), {
    target: { value: ".82" },
  });
  expect(check.disabled).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Use ratchet to contact" }),
  );
  expect(handle.getAttribute("aria-valuenow")).toBe("0.82");
  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  expect(handle.getAttribute("aria-valuenow")).toBe("0.82");
  fireEvent.click(screen.getByRole("button", { name: "Lock", exact: true }));
  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(handle.getAttribute("aria-valuenow")).toBe("0.82");
  fireEvent.change(screen.getByLabelText("Screw type"), {
    target: { value: "1" },
  });
  expect(handle.getAttribute("aria-valuenow")).toBe("0.82");
  fireEvent.change(screen.getByRole("spinbutton"), {
    target: { value: ".82" },
  });
  fireEvent.click(check);
  expect(screen.getByText(/Correct! Recorded/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Unlock", exact: true }));
  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(check.disabled).toBe(true);
});
