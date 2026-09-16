export type Parameters = { speed: number; angle: number; height: number };
export function solve({ speed, angle, height }: Parameters) {
  const a = (angle * Math.PI) / 180,
    vx = speed * Math.cos(a),
    vy = speed * Math.sin(a),
    flight = (vy + Math.sqrt(vy * vy + 2 * 9.81 * height)) / 9.81;
  return {
    vx,
    vy,
    flight,
    range: vx * flight,
    peak: height + (vy * vy) / (2 * 9.81),
  };
}
function arrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
) {
  if (Math.hypot(dx, dy) < 2) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  const a = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 8 * Math.cos(a - 0.45), y + dy - 8 * Math.sin(a - 0.45));
  ctx.lineTo(x + dx - 8 * Math.cos(a + 0.45), y + dy - 8 * Math.sin(a + 0.45));
  ctx.fill();
}
export function draw(
  canvas: HTMLCanvasElement,
  p: Parameters,
  s: ReturnType<typeof solve>,
  time: number,
  vectors: boolean,
  lang: string,
) {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    dpr = window.devicePixelRatio || 1;
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const left = 43,
    bottom = h - 49,
    scale = Math.min((w - 76) / 110, (h - 75) / 70),
    X = (x: number) => left + x * scale,
    Y = (y: number) => bottom - y * scale;
  ctx.font = "11px Segoe UI";
  ctx.textAlign = "center";
  for (let x = 0; x <= 110; x += 10) {
    ctx.strokeStyle = "#25414b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(x), 20);
    ctx.lineTo(X(x), bottom);
    ctx.stroke();
    if (x % 20 === 0) {
      ctx.fillStyle = "#8daab4";
      ctx.fillText(x + "", X(x), bottom + 18);
    }
  }
  ctx.textAlign = "right";
  for (let y = 0; y <= 60; y += 10) {
    ctx.strokeStyle = "#25414b";
    ctx.beginPath();
    ctx.moveTo(left, Y(y));
    ctx.lineTo(w - 20, Y(y));
    ctx.stroke();
    ctx.fillStyle = "#8daab4";
    ctx.fillText(y + "", left - 9, Y(y) + 4);
  }
  ctx.fillStyle = "#b3c8ce";
  ctx.fillText("x (m)", w - 18, bottom + 18);
  ctx.textAlign = "left";
  ctx.fillText("y (m)", 9, 15);
  ctx.strokeStyle = "#6c929a";
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(w - 20, bottom);
  ctx.stroke();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = "#438782";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 150; i++) {
    const t = (s.flight * i) / 150,
      x = X(s.vx * t),
      y = Y(Math.max(0, p.height + s.vy * t - 4.905 * t * t));
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#5de0ca";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const t = (time * i) / 100,
      x = X(s.vx * t),
      y = Y(Math.max(0, p.height + s.vy * t - 4.905 * t * t));
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  const x = X(s.vx * time),
    y = Y(Math.max(0, p.height + s.vy * time - 4.905 * time * time));
  if (vectors) {
    arrow(ctx, x, y, s.vx * 1.9, 0, "#6ce3d3");
    arrow(ctx, x, y, 0, -(s.vy - 9.81 * time) * 1.9, "#ffc569");
  }
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fillStyle = "#5de0ca22";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#a4fff0";
  ctx.fill();
  ctx.fillStyle = "#aec6cd";
  ctx.font = "12px Segoe UI";
  ctx.fillText(
    lang === "ta" ? "பாதை முன்னோட்டம்" : "Trajectory preview",
    left + 10,
    30,
  );
}
