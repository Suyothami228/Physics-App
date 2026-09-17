export const TM_LC = 0.01; // 50 vernier divisions span 49 main divisions of 0.5 mm.
export function tmReading(mm: number) {
  const ticks = Math.round(mm * 100);
  const main = Math.floor(ticks / 50) * 0.5;
  return { main, vernier: ((ticks % 50) + 50) % 50, total: ticks / 100 };
}
export function tmClamp(value: number, min: number, max: number) {
  return Math.round(Math.max(min, Math.min(max, value)) * 100) / 100;
}
export const tubeEdges = {
  outer: [26.38, 38.82],
  inner: [29.14, 36.06],
} as const;
export const glassFocus = { reference: 40, apparent: 45, top: 55 } as const;
export function refractiveIndex(
  reference: number,
  apparent: number,
  top: number,
) {
  const real = top - reference,
    depth = top - apparent;
  return real > 0 && depth > 0 && depth <= real
    ? { real, apparent: depth, index: real / depth }
    : null;
}
export const tmSpecimens = {
  rubberOuter: {
    en: "Rubber tube · external diameter",
    ta: "இறப்பர் குழாய் · வெளிவிட்டம்",
    shape: "rubber",
    outer: 6.22,
    inner: 3.46,
    radius: 6.22,
    focus: 41,
    zoom: 18,
  },
  rubberInner: {
    en: "Rubber tube · internal diameter",
    ta: "இறப்பர் குழாய் · உள்விட்டம்",
    shape: "rubber",
    outer: 6.22,
    inner: 3.46,
    radius: 3.46,
    focus: 41,
    zoom: 18,
  },
  bubble: {
    en: "Soap bubble · diameter",
    ta: "சவர்க்காரக் குமிழ் · விட்டம்",
    shape: "bubble",
    outer: 5,
    inner: 0,
    radius: 5,
    focus: 45,
    zoom: 20,
  },
  capillary: {
    en: "Capillary tube · internal diameter",
    ta: "மயிர்த்துளைக் குழாய் · உள்விட்டம்",
    shape: "capillary",
    outer: 2,
    inner: 0.6,
    radius: 0.6,
    focus: 42,
    zoom: 70,
  },
} as const;
export type TMSpecimen = keyof typeof tmSpecimens;
export function tmEdge(specimen: TMSpecimen, side: 0 | 1) {
  return (
    Math.round(
      (32.6 + (side === 0 ? -1 : 1) * tmSpecimens[specimen].radius) * 100,
    ) / 100
  );
}
