export function resultant(
  a: number,
  b: number,
  angle: number,
  subtract = false,
) {
  const rad = (angle * Math.PI) / 180;
  const bx = (subtract ? -1 : 1) * b * Math.cos(rad);
  const by = (subtract ? -1 : 1) * b * Math.sin(rad);
  const x = a + bx,
    y = by,
    magnitude = Math.hypot(x, y);
  return {
    x,
    y,
    bx,
    by,
    magnitude,
    direction: magnitude < 1e-9 ? null : (Math.atan2(y, x) * 180) / Math.PI,
  };
}
export type VectorPath = {
  en: string;
  ta: string;
  points: Record<string, [number, number]>;
  paths: string[][];
  formula: string;
  noteEn: string;
  noteTa: string;
};
export const vectorPaths: VectorPath[] = [
  {
    en: "Triangle rule",
    ta: "முக்கோண விதி",
    points: { A: [0, 0], B: [5, 0], C: [3, 3] },
    paths: [["A", "B", "C"]],
    formula: "AB⃗ + BC⃗ = AC⃗;  AB⃗ + BC⃗ + CA⃗ = 0⃗",
    noteEn:
      "Follow the arrow directions. The resultant joins the first tail to the last head. Closing the loop gives zero.",
    noteTa:
      "அம்புத் திசைகளைப் பின்பற்றுக. முதல் ஆரம்பத்தையும் இறுதி முடிவையும் விளையுள் இணைக்கும். மூடிய பாதையின் காவிக் கூட்டுத்தொகை பூச்சியம்.",
  },
  {
    en: "Polygon rule",
    ta: "பல்கோண விதி",
    points: {
      A: [0, 0],
      B: [3, 0.5],
      C: [4, 3],
      D: [2, 5],
      E: [-1, 4],
      F: [-2, 1],
    },
    paths: [["A", "B", "C", "D", "E", "F"]],
    formula: "AB⃗ + BC⃗ + CD⃗ + DE⃗ + EF⃗ = AF⃗",
    noteEn:
      "Adding FA closes the polygon: the total is the zero vector. The travelled path is not the resultant.",
    noteTa:
      "FA காவியைச் சேர்த்தால் பல்கோணம் மூடப்படும்; கூட்டுத்தொகை பூச்சியக் காவி. சென்ற பாதை விளையுள் அல்ல.",
  },
  {
    en: "Six arrows",
    ta: "ஆறு காவிகள்",
    points: { A: [0, 0], B: [6, 0], C: [3, 3], D: [1, -2], E: [5, -2] },
    paths: [
      ["A", "C", "B"],
      ["A", "D", "E", "B"],
      ["A", "B"],
    ],
    formula: "(AC⃗ + CB⃗) + (AD⃗ + DE⃗ + EB⃗) + AB⃗ = 3AB⃗",
    noteEn:
      "Each of the three paths starts at A and ends at B. Add one AB for each path, not one for each arrow.",
    noteTa:
      "மூன்று பாதைகளும் A இல் தொடங்கி B இல் முடிகின்றன. ஒவ்வொரு பாதைக்கும் ஓர் AB காவியைச் சேர்க்கவும்; ஒவ்வொரு அம்பிற்கும் அல்ல.",
  },
  {
    en: "Eight arrows",
    ta: "எட்டு காவிகள்",
    points: {
      A: [0, 0],
      B: [6, 0],
      C: [1.5, 2],
      D: [4.5, 2],
      E: [2, -2],
      F: [4, -2],
      G: [3, -5],
    },
    paths: [
      ["A", "C", "D", "B"],
      ["A", "E", "F", "B"],
      ["A", "G", "B"],
    ],
    formula: "(AC⃗ + CD⃗ + DB⃗) + (AE⃗ + EF⃗ + FB⃗) + (AG⃗ + GB⃗) = 3AB⃗",
    noteEn:
      "Eight arrows form three complete A-to-B paths. The total remains 3AB.",
    noteTa:
      "எட்டு அம்புகள் மூன்று முழுமையான A முதல் B வரையிலான பாதைகளை உருவாக்குகின்றன. கூட்டுத்தொகை 3AB ஆகும்.",
  },
  {
    en: "Ten arrows and cancellation",
    ta: "பத்து காவிகளும் நீக்கலும்",
    points: {
      A: [0, 0],
      B: [3, 5],
      C: [6, 0],
      E: [1.5, 0],
      D: [4.5, 0],
      F: [1.5, 2.5],
      G: [4.5, 2.5],
    },
    paths: [
      ["D", "G", "F", "E"],
      ["E", "A", "F", "B", "G", "C", "D"],
      ["E", "D"],
    ],
    formula: "DE⃗ + ED⃗ + ED⃗ = ED⃗",
    noteEn:
      "The first path is D → E, opposite to E → D. One pair cancels, leaving ED. Do not ignore reversed arrows.",
    noteTa:
      "முதல் பாதை D → E; இது E → D இற்கு எதிரானது. ஒரு சோடி நீங்கி ED மீதமாகும். எதிர்த்திசை அம்புகளைப் புறக்கணிக்க வேண்டாம்.",
  },
  {
    en: "10 m north, 10 m east",
    ta: "10 m வடக்கு, 10 m கிழக்கு",
    points: { A: [0, 0], B: [0, 10], C: [10, 10] },
    paths: [["A", "B", "C"]],
    formula: "d = 20 m;  |AC⃗| = √(10² + 10²) = 10√2 m",
    noteEn:
      "Displacement is about 14.14 m, 45° east of north. Distance is 20 m. Here coordinates are in metres; east is +x and north is +y.",
    noteTa:
      "இடப்பெயர்ச்சி சுமார் 14.14 m, வடக்கிலிருந்து கிழக்காக 45°. தூரம் 20 m. இங்கு ஆயங்கள் மீற்றரில்; கிழக்கு +x, வடக்கு +y.",
  },
  {
    en: "North, east, then southwest",
    ta: "வடக்கு, கிழக்கு, பின்னர் தென்மேற்கு",
    points: { A: [0, 0], B: [0, 70], C: [30, 70], D: [-40, 0] },
    paths: [["A", "B", "C", "D"]],
    formula: "R⃗ = (0,70) + (30,0) + (−70,−70) = (−40,0) m",
    noteEn:
      "The southwest leg is 70√2 m, with components −70 m and −70 m. Resultant displacement: 40 m west. Distance: 100 + 70√2 m ≈ 199 m.",
    noteTa:
      "தென்மேற்குப் பகுதி 70√2 m; அதன் கூறுகள் −70 m, −70 m. விளையுள் இடப்பெயர்ச்சி 40 m மேற்கு. தூரம் 100 + 70√2 m ≈ 199 m.",
  },
];
export const quantities = [
  ["Displacement", "இடப்பெயர்ச்சி", true],
  ["Velocity", "வேகம்", true],
  ["Acceleration", "ஆர்முடுகல்", true],
  ["Force", "விசை", true],
  ["Torque / moment", "திருப்பம் / திருப்புத்திறன்", true],
  ["Momentum", "உந்தம்", true],
  ["Impulse", "கணத்தாக்கம்", true],
  ["Electric field strength", "மின்புலவலிமை", true],
  ["Magnetic flux density", "காந்தப்பாய அடர்த்தி", true],
  ["Gravitational field strength", "ஈர்ப்புப் புலவலிமை", true],
  ["Magnetic moment", "காந்தத்திருப்பம்", true],
  ["Speed", "கதி", false],
  ["Mass", "திணிவு", false],
  ["Area", "பரப்பு", false],
  ["Volume", "கனவளவு", false],
  ["Density", "அடர்த்தி", false],
  ["Work", "வேலை", false],
  ["Pressure", "அமுக்கம்", false],
  ["Electric current", "மின்னோட்டம்", false],
  ["Electromotive force", "மின்னியக்கவிசை", false],
  ["Time", "நேரம்", false],
  ["Temperature", "வெப்பநிலை", false],
  ["Power", "திறன்", false],
  ["Relative density", "தொடர்படர்த்தி", false],
  ["Coefficient of friction", "உராய்வுத்திறன்", false],
  ["Distance", "தூரம்", false],
] as const;
