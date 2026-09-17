export const surfaces = {
  flat: { en: "Flat glass", ta: "கண்ணாடித்தட்டு", h: 0 },
  convex: { en: "Convex surface", ta: "குவிவு மேற்பரப்பு", h: 1.24 },
  concave: { en: "Concave surface", ta: "குழிவு மேற்பரப்பு", h: -0.86 },
  sheet: { en: "Thin sheet", ta: "மெல்லிய தகடு", h: 0.38 },
} as const;
export type Surface = keyof typeof surfaces;
export function screwReading(height: number) {
  const ticks = Math.round((height + 5) * 100);
  return {
    main: Math.floor(ticks / 100),
    circular: ((ticks % 100) + 100) % 100,
    total: ticks / 100,
  };
}
export function radiusOfCurvature(a: number, h: number) {
  return h > 0 && a > 0 ? (a * a) / (6 * h) + h / 2 : null;
}
export function clampProbe(height: number, surface: Surface) {
  return (
    Math.round(Math.max(surfaces[surface].h, Math.min(4, height)) * 100) / 100
  );
}
