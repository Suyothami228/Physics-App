// @vitest-environment jsdom
import { test, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppProvider } from "../src/state";
import {
  Caliper3D,
  clampJaw,
  clampMeasurement,
  vernierReading,
} from "../src/components/Caliper3D";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("iyal-language", '"en"');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("mm/cm scale labels convert without changing jaw opening or a recorded answer", () => {
  render(
    <AppProvider>
      <Caliper3D />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Place object" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Close gently to contact" }),
  );
  fireEvent.change(screen.getByRole("spinbutton"), {
    target: { value: "12.5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check measurement" }));
  fireEvent.click(screen.getByRole("button", { name: "cm", exact: true }));
  const scale = screen.getByRole("img", {
    name: "Magnified main scale in cm and ten-division vernier",
  });
  expect(scale.textContent).toContain("1.2");
  expect(scale.querySelectorAll("path")).toHaveLength(26);
  expect(
    screen
      .getByRole("slider", { name: "Move sliding jaw" })
      .getAttribute("aria-valuenow"),
  ).toBe("12.5");
  expect(screen.getByText(/Correct! Measurement/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "mm", exact: true }));
  expect(
    screen.getByRole("img", {
      name: "Magnified main scale in mm and ten-division vernier",
    }).textContent,
  ).toContain("12");
});
test("visual object selection resets contact and zoom preserves measurement", () => {
  const { container } = render(
    <AppProvider>
      <Caliper3D />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Choose an object" }));
  expect(
    screen
      .getByRole("group", { name: "Practice objects" })
      .querySelectorAll("button"),
  ).toHaveLength(13);
  fireEvent.click(screen.getByRole("button", { name: "Cube" }));
  const jaw = screen.getByRole("slider", { name: "Move sliding jaw" });
  expect(jaw.getAttribute("aria-valuenow")).toBe("40");
  fireEvent.keyDown(jaw, { key: "Home" });
  expect(jaw.getAttribute("aria-valuenow")).toBe("20");
  expect(
    container
      .querySelector(".caliper-live-contact")
      ?.getAttribute("data-contact"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Zoom scale" }));
  expect(
    screen.getByRole("button", { name: "2×" }).getAttribute("aria-pressed"),
  ).toBe("true");
  expect(jaw.getAttribute("aria-valuenow")).toBe("20");
  expect(container.querySelector(".caliper-scene")?.textContent).not.toMatch(
    /\b(AB|CD)\b/,
  );
  fireEvent.click(screen.getByRole("button", { name: "Choose an object" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Ring · outside diameter" }),
  );
  expect(
    container
      .querySelector(".caliper-live-contact")
      ?.getAttribute("data-contact"),
  ).toBe("false");
  fireEvent.keyDown(jaw, { key: "Home" });
  expect(jaw.getAttribute("aria-valuenow")).toBe("19.2");
});
test.each([
  ["Ring · inside diameter", 12.6, "Open gently to contact"],
  ["Tube · inside diameter", 18.4, "Open gently to contact"],
  ["Slot · depth", 17.6, "Extend rod to the floor"],
  ["Recess · depth", 26.4, "Extend rod to the floor"],
] as const)(
  "%s starts retracted, stops at contact, and records a corrected reading",
  (name, size, action) => {
    render(
      <AppProvider>
        <Caliper3D />
      </AppProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose an object" }));
    fireEvent.click(screen.getByRole("button", { name }));
    const jaw = screen.getByRole("slider", { name: "Move sliding jaw" });
    expect(jaw.getAttribute("aria-valuenow")).toBe("0");
    expect(jaw.getAttribute("aria-valuemax")).toBe(String(size));
    const check = screen.getByRole("button", {
      name: "Check measurement",
    }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: action }));
    fireEvent.keyDown(jaw, { key: "ArrowRight", shiftKey: true });
    expect(jaw.getAttribute("aria-valuenow")).toBe(String(size));
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: String(size) },
    });
    fireEvent.click(check);
    expect(screen.getByText(/Correct! Measurement/)).toBeTruthy();
    fireEvent.keyDown(jaw, { key: "Home" });
    expect(jaw.getAttribute("aria-valuenow")).toBe("0");
    expect(check.disabled).toBe(true);
  },
);
test("inside and depth contact clamp in the opposite direction to external contact", () => {
  for (const mode of ["internal", "depth"] as const) {
    expect(clampMeasurement(60, 17.6, mode)).toBe(17.6);
    expect(clampMeasurement(-4, 17.6, mode)).toBe(0);
    expect(clampMeasurement(8.3, 17.6, mode)).toBe(8.3);
  }
  expect(clampMeasurement(0, 17.6, "external")).toBe(17.6);
  expect(clampMeasurement(80, null, "depth")).toBe(60);
});
test("direct jaw dragging stops at the object, releases, and supports keyboard adjustment", () => {
  vi.stubGlobal("PointerEvent", MouseEvent);
  render(
    <AppProvider>
      <Caliper3D />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Front view" }));
  fireEvent.click(screen.getByRole("button", { name: "Place object" }));
  const jaw = screen.getByRole("slider", { name: "Move sliding jaw" });
  const scene = jaw.closest("svg")!;
  scene.setPointerCapture = vi.fn();
  scene.releasePointerCapture = vi.fn();
  scene.getBoundingClientRect = () => ({
    width: 380,
    height: 220,
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 380,
    bottom: 220,
    toJSON() {},
  });
  fireEvent.pointerDown(jaw, { clientX: 200, clientY: 100, button: 0 });
  fireEvent.pointerMove(scene, { clientX: 176, clientY: 100 });
  expect(jaw.getAttribute("aria-valuenow")).toBe("30");
  fireEvent.pointerMove(scene, { clientX: 0, clientY: 100 });
  expect(jaw.getAttribute("aria-valuenow")).toBe("12.5");
  expect(screen.getByText(/Jaws in contact/)).toBeTruthy();
  fireEvent.pointerUp(scene);
  fireEvent.pointerMove(scene, { clientX: 300, clientY: 100 });
  expect(jaw.getAttribute("aria-valuenow")).toBe("12.5");
  fireEvent.keyDown(jaw, { key: "ArrowRight" });
  expect(jaw.getAttribute("aria-valuenow")).toBe("12.6");
  fireEvent.keyDown(jaw, { key: "Home" });
  expect(jaw.getAttribute("aria-valuenow")).toBe("12.5");
  fireEvent.pointerDown(scene, { clientX: 200, clientY: 100, button: 0 });
  fireEvent.pointerMove(scene, { clientX: 250, clientY: 140 });
  expect(jaw.getAttribute("aria-valuenow")).toBe("12.5");
  fireEvent.pointerCancel(scene);
  expect(screen.queryByLabelText("Jaw opening control")).toBeNull();
});
test("vernier alignment and signed correction agree with jaw separation", () => {
  for (const gap of [0, 8.3, 12.5, 24.8, 60])
    for (const zero of [-0.3, -0.2, 0, 0.2, 0.3]) {
      const r = vernierReading(gap, zero);
      expect(r.corrected).toBeCloseTo(gap);
      expect(r.main + r.aligned * 0.1).toBeCloseTo(r.observed);
      expect(r.aligned).toBeGreaterThanOrEqual(0);
      expect(r.aligned).toBeLessThan(10);
      expect(r.observed + 0.9 * r.aligned).toBeCloseTo(
        Math.round(r.observed + 0.9 * r.aligned),
      );
    }
  expect(clampJaw(1, 12.5)).toBe(12.5);
  expect(clampJaw(-1, null)).toBe(0);
  expect(clampJaw(80, null)).toBe(60);
});
test("student must make contact before recording; camera changes preserve the reading", () => {
  render(
    <AppProvider>
      <Caliper3D />
    </AppProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Place object" }));
  fireEvent.change(screen.getByRole("spinbutton"), {
    target: { value: "12.5" },
  });
  expect(
    (
      screen.getByRole("button", {
        name: "Check measurement",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Close gently to contact" }),
  );
  fireEvent.change(screen.getByRole("spinbutton"), {
    target: { value: "12.5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check measurement" }));
  expect(screen.getByRole("status").textContent).toContain("Correct!");
  expect(screen.getByText(/Metal cylinder: 12.5 mm/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reveal scale reading" }));
  const before = screen.getAllByRole("status").at(-1)!.textContent;
  fireEvent.click(screen.getByRole("button", { name: "Front view" }));
  expect(screen.getAllByRole("status").at(-1)!.textContent).toBe(before);
  fireEvent.click(screen.getByRole("button", { name: "Open 0.1 mm" }));
  expect(screen.queryByRole("status")).toBeNull();
});
