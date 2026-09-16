export const micrometerName = "நுண்மானித் திருகுக் கணிச்சி";
export const micrometerParts = [
  {
    en: "Anvil",
    ta: "பட்டை",
    point: [0, 0, 4],
    enDetail: "The fixed measuring face supports the object.",
    taDetail: "பொருள் தொடும் நிலையான அளவிடும் முகம்.",
  },
  {
    en: "Spindle",
    ta: "கதிர்க்கோல்",
    point: [20, 0, 4],
    enDetail: "Moves towards the anvil as the screw closes.",
    taDetail: "திருகை மூடும்போது பட்டையை நோக்கி நகரும்.",
  },
  {
    en: "Sleeve / main scale",
    ta: "காப்புறை / பிரதான அளவிடை",
    point: [40, 0, 6],
    enDetail:
      "Read the last exposed graduation, including any half-millimetre mark.",
    taDetail:
      "வெளியே தெரியும் கடைசிப் பிரிவை வாசிக்கவும்; அரை மில்லிமீற்றர் பிரிவு தெரிந்தால் அதையும் சேர்க்கவும்.",
  },
  {
    en: "Circular scale",
    ta: "வட்ட அளவிடை",
    point: [62, 0, 9],
    enDetail: "Read the division aligned with the sleeve reference line.",
    taDetail:
      "காப்புறையின் குறிப்புக் கோட்டுடன் பொருந்தும் பிரிவை வாசிக்கவும்.",
  },
  {
    en: "Ratchet",
    ta: "பற்சுழற்றி",
    point: [80, 0, 5],
    enDetail:
      "Use gentle, consistent contact. The ratchet slips at contact; do not force the object.",
    taDetail:
      "பொருளை உருமாற்றாமல் மெதுவாகத் தொடச் செய்ய உதவும். தொடுகைக்குப் பின்னர் வலிந்து இறுக்க வேண்டாம்.",
  },
];
export function micrometerReading(gap: number, zero: number, pitch: number) {
  const ticks = Math.round((gap + zero) * 100),
    perTurn = Math.round(pitch * 100);
  const turns = Math.floor(ticks / perTurn);
  return {
    main: turns * pitch,
    circular: ticks - turns * perTurn,
    observed: ticks / 100,
    corrected: (ticks - Math.round(zero * 100)) / 100,
  };
}
export function clampSpindle(value: number, objectSize: number | null) {
  return Math.round(Math.max(objectSize ?? 0, Math.min(25, value)) * 100) / 100;
}
