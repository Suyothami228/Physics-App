import { expect, test } from "vitest";
import {
  journeyState,
  constantAcceleration,
  gravityRatio,
} from "../src/domain/velocity";
import content from "../src/domain/velocity.json";
import { C } from "../src/model";
test("equal-distance return averages use total time and signed displacement", () => {
  const trip = journeyState([60, 30], 120, true, 6);
  expect(trip.distance).toBe(240);
  expect(trip.displacement).toBe(0);
  expect(trip.averageSpeed).toBe(40);
  expect(trip.averageVelocity).toBe(0);
  expect(journeyState([40, 10], 120, true, 15).averageSpeed).toBe(16);
  const returning = journeyState([60, 30], 120, true, 3);
  expect(returning.displacement).toBe(90);
  expect(returning.distance).toBe(150);
  expect(returning.velocity).toBe(-30);
  expect(journeyState([60, 30], 120, true, 0).averageSpeed).toBeNull();
});
test("three equal distances, reversals and gravity preserve physics", () => {
  const trip = journeyState([60, 30, 10], 120, false, 18);
  expect(trip.averageSpeed).toBe(20);
  expect(trip.averageVelocity).toBe(20);
  expect(constantAcceleration(10, -2, 5)).toEqual({
    velocity: 0,
    displacement: 25,
  });
  expect(constantAcceleration(0, -10, 2)).toEqual({
    velocity: -20,
    displacement: -20,
  });
  expect(gravityRatio(0)).toBe(0);
  expect(gravityRatio(1)).toBe(1);
  expect(gravityRatio(2)).toBe(0.25);
});
test("Velocity is available and all quick checks have bilingual answers", () => {
  expect(C.getLesson("02", "velocity")?.available).toBe(true);
  const checks = content["02/velocity"].filter((b) => b.kind === "check");
  expect(checks).toHaveLength(6);
  checks.forEach((b) => {
    expect(b.options_en!.split("\n").length).toBe(
      b.options_ta!.split("\n").length,
    );
    expect(b.explanation_en).toBeTruthy();
    expect(b.explanation_ta).toBeTruthy();
  });
});
