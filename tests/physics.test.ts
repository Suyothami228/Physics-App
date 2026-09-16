import { test, expect } from "vitest";
import { solve } from "../src/physics";
import { C, parseRoute } from "../src/model";
test("horizontal speed changes range without changing time", () => {
  const a = solve({ speed: 10, angle: 0, height: 10 }),
    b = solve({ speed: 20, angle: 0, height: 10 });
  expect(a.flight).toBe(b.flight);
  expect(b.range).toBe(2 * a.range);
});
test("trajectory intersects ground across slider bounds", () => {
  for (const speed of [5, 18, 30])
    for (const angle of [0, 40, 80])
      for (const height of [0, 5, 20]) {
        const s = solve({ speed, angle, height });
        expect(
          height + s.vy * s.flight - 4.905 * s.flight * s.flight,
        ).toBeCloseTo(0, 8);
        expect(s.peak).toBeGreaterThanOrEqual(height);
      }
});
test("all curriculum routes resolve and invalid routes are rejected", () => {
  expect(C.chapters).toHaveLength(11);
  expect(C.chapters.flatMap((c) => c.lessons)).toHaveLength(72);
  for (const c of C.chapters)
    for (const l of c.lessons)
      expect(parseRoute("#/chapter/" + l.id).type).toBe("lesson");
  expect(parseRoute("#/chapter/99/nope").type).toBe("missing");
});
