export type Force = { magnitude: number; angle: number; name?: string };
export const radians = (degrees: number) => (degrees * Math.PI) / 180;
export function resultant(forces: Force[]) {
  const x = forces.reduce(
    (s, f) => s + f.magnitude * Math.cos(radians(f.angle)),
    0,
  );
  const y = forces.reduce(
    (s, f) => s + f.magnitude * Math.sin(radians(f.angle)),
    0,
  );
  const magnitude = Math.hypot(x, y);
  return {
    x: Math.abs(x) < 1e-10 ? 0 : x,
    y: Math.abs(y) < 1e-10 ? 0 : y,
    magnitude: magnitude < 1e-10 ? 0 : magnitude,
    angle: magnitude < 1e-10 ? null : (Math.atan2(y, x) * 180) / Math.PI,
  };
}
// Angles are measured above the horizontal. Cables are massless and taut.
export function tensions(weight: number, left: number, right: number) {
  const a = radians(left),
    b = radians(right),
    denominator = Math.sin(a + b);
  if (
    weight <= 0 ||
    left <= 0 ||
    right <= 0 ||
    left >= 90 ||
    right >= 90 ||
    denominator <= 1e-10
  )
    return null;
  return {
    left: (weight * Math.cos(b)) / denominator,
    right: (weight * Math.cos(a)) / denominator,
  };
}
export const forceExamples: { en: string; ta: string; forces: Force[] }[] = [
  {
    en: "8 N and 6 N at 90°",
    ta: "8 N, 6 N — 90°",
    forces: [
      { magnitude: 8, angle: 0 },
      { magnitude: 6, angle: 90 },
    ],
  },
  {
    en: "3 N and 5 N at 60°",
    ta: "3 N, 5 N — 60°",
    forces: [
      { magnitude: 3, angle: 0 },
      { magnitude: 5, angle: 60 },
    ],
  },
  {
    en: "20 N each at 60°",
    ta: "தலா 20 N — 60°",
    forces: [
      { magnitude: 20, angle: 0 },
      { magnitude: 20, angle: 60 },
    ],
  },
  {
    en: "18 N each at 120°",
    ta: "தலா 18 N — 120°",
    forces: [
      { magnitude: 18, angle: 0 },
      { magnitude: 18, angle: 120 },
    ],
  },
  {
    en: "12 N each at 90°",
    ta: "தலா 12 N — 90°",
    forces: [
      { magnitude: 12, angle: 0 },
      { magnitude: 12, angle: 90 },
    ],
  },
  {
    en: "Hexagon · example 1",
    ta: "அறுகோணி · எடுத்துக்காட்டு 1",
    forces: [
      { magnitude: 8 * Math.sqrt(3), angle: 0 },
      { magnitude: 6, angle: 30 },
      { magnitude: 6 * Math.sqrt(3), angle: 60 },
      { magnitude: 4, angle: 90 },
      { magnitude: 2 * Math.sqrt(3), angle: 120 },
    ],
  },
  {
    en: "Hexagon · example 2",
    ta: "அறுகோணி · எடுத்துக்காட்டு 2",
    forces: [
      { magnitude: 2, angle: 0 },
      { magnitude: 4 * Math.sqrt(3), angle: 30 },
      { magnitude: 8, angle: 60 },
      { magnitude: 2 * Math.sqrt(3), angle: 90 },
      { magnitude: 4, angle: 120 },
    ],
  },
  {
    en: "Square · three forces",
    ta: "சதுரம் · மூன்று விசைகள்",
    forces: [
      { magnitude: 4, angle: 0 },
      { magnitude: 4 * Math.sqrt(2), angle: 45 },
      { magnitude: 2, angle: 90 },
    ],
  },
  {
    en: "Seven forces around a point",
    ta: "ஒரு புள்ளியில் ஏழு விசைகள்",
    forces: [
      { magnitude: 4, angle: 0 },
      { magnitude: 12 * Math.sqrt(2), angle: 45 },
      { magnitude: 8, angle: 90 },
      { magnitude: 15, angle: 180 },
      { magnitude: 2 * Math.sqrt(2), angle: 225 },
      { magnitude: 5, angle: 270 },
      { magnitude: 7 * Math.sqrt(2), angle: 315 },
    ],
  },
];
