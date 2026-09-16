import { test } from "vitest";
import assert from "node:assert/strict";
import B from "../src/domain/bank.js";
const now = Date.now();
const row = (id, correct = true, variant = 0, assisted = false, at = now) => ({
  id,
  correct,
  variant,
  assisted,
  at,
});
test("real-paper adaptation: energy fraction gives 60 degrees", () => {
  const q = B.make("energy-1");
  assert.equal(q.value, 60);
  assert.ok(q.source.endsWith("#page=1"));
  assert.equal(B.grade(q, 60).correct, true);
  assert.equal(B.grade(q, 30).correct, false);
  assert.equal(B.make("energy-1", 1).source, null);
});
test("independent numerical examples and signed graph gradient", () => {
  assert.equal(B.make("components-3", 2).value, 15);
  assert.equal(B.make("time-3", 1).value, 4); // 40 + 10t - 5t² = 0
  assert.equal(B.make("range-2", 2).value, 40); // 20² / 10
  assert.equal(B.make("graphs-2", 0).value, -10);
  assert.equal(B.make("energy-2", 1).value, 5); // sqrt(15² - 2*10*10)
  assert.equal(B.grade(B.make("graphs-2"), 10).correct, false);
});
test("all 90 variants have finite, physically valid answers and bilingual content", () => {
  for (const id of B.ids)
    for (let v = 0; v < 5; v++) {
      const q = B.make(id, v);
      assert.ok(q.prompt.en && q.prompt.ta && q.explain.en && q.explain.ta);
      if (q.type === "numeric") {
        assert.ok(Number.isFinite(q.value));
        assert.equal(B.grade(q, q.value.toFixed(2)).correct, true);
      } else {
        assert.equal(q.options.length, 5);
        assert.ok(q.options.every((o) => o.en && o.ta));
        assert.equal(B.grade(q, q.correct).correct, true);
      }
    }
});
test("invalid and blank responses are rejected, zero remains valid", () => {
  const q = B.make("energy-2");
  for (const bad of ["", null, undefined, NaN, Infinity, "abc"])
    assert.equal(B.grade(q, bad).valid, false);
  assert.equal(B.grade(q, 0).correct, true);
  assert.equal(B.grade(B.make("independence-1"), null).valid, false);
  assert.equal(B.grade(B.make("independence-1"), 5).valid, false);
});
test("empty and one-skill practice cannot meet readiness", () => {
  assert.equal(B.evaluate([]).ready, false);
  const rows = [];
  for (const id of ["energy-1", "energy-2", "energy-3"])
    for (let v = 0; v < 5; v++) rows.push(row(id, true, v));
  const s = B.evaluate(rows);
  assert.equal(s.total, 3);
  assert.equal(s.ready, false);
});
test("breadth threshold: 12 correct styles across six skills is ready", () => {
  const rows = Object.keys(B.families).flatMap((f) => [
    row(f + "-1"),
    row(f + "-2"),
  ]);
  const s = B.evaluate(rows, now);
  assert.equal(s.ready, true);
  assert.equal(s.accuracy, 100);
  assert.equal(s.total, 12);
  assert.equal(B.evaluate(rows, now + 3 * 86400000).reviewDue, true);
  assert.equal(B.evaluate(rows, now + 15 * 86400000).ready, false);
});
test("one weak family blocks the shift recommendation", () => {
  const rows = B.ids.map((id) => row(id, !id.startsWith("graphs-")));
  assert.equal(B.evaluate(rows).ready, false);
  assert.equal(
    B.evaluate(rows).skills.find((s) => s.id === "graphs").correct,
    0,
  );
});
test("repeat answers and identical conceptual variants do not inflate results", () => {
  const rows = [
    row("independence-1", false),
    row("independence-1", true),
    row("independence-1", true, 1),
  ];
  const s = B.evaluate(rows);
  assert.equal(s.total, 1);
  assert.equal(s.correct, 0);
});
test("solution exposure stays excluded across subsequent submission", () => {
  const rows = [
    { ...row("time-1", false, 0, true), viewed: true },
    row("time-1", true, 0, true),
    row("time-1", true, 0, false),
  ];
  assert.equal(B.evaluate(rows).total, 0);
  rows.push(row("time-1", true, 1));
  assert.equal(B.evaluate(rows).total, 1);
  assert.equal(B.evaluate(rows).correct, 1);
});
test("fresh numerical variant updates skill evidence without adding coverage", () => {
  const s = B.evaluate([row("range-2", false), row("range-2", true, 1)]);
  assert.equal(s.total, 1);
  assert.equal(s.correct, 1);
});
test("adaptive suggestions prioritize weak skills and eventually exhaust finite bank", () => {
  const rows = [];
  let q;
  for (let i = 0; i < 100; i++) {
    q = B.next(rows);
    if (!q) break;
    assert.ok(
      !rows.some(
        (a) =>
          a.id === q.id && B.make(a.id, a.variant).prompt.en === q.prompt.en,
      ),
    );
    rows.push(row(q.id, true, q.variant));
  }
  assert.equal(q, null);
  assert.equal(B.evaluate(rows).ready, true);
  assert.ok(rows.length > 18 && rows.length < 90);
  const strongEnergy = [row("energy-1"), row("energy-2")];
  assert.notEqual(B.next(strongEnergy).family, "energy");
});
test("malformed saved progress does not crash assessment", () => {
  assert.equal(
    B.evaluate([
      { id: "unknown" },
      null,
      {},
      ...B.ids.map((id) => ({ id, correct: "yes" })),
    ]).total,
    0,
  );
  assert.equal(B.evaluate({}).total, 0);
});
