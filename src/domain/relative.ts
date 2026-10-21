export type Velocity = [number, number];
export function relative(a: Velocity, b: Velocity): Velocity {
  return [a[0] - b[0], a[1] - b[1]];
}
export function river(
  speed: number,
  current: number,
  width: number,
  angle: number,
) {
  const rad = (angle * Math.PI) / 180;
  const x = current - speed * Math.sin(rad),
    y = speed * Math.cos(rad);
  const time = y > 1e-9 ? width / y : Infinity;
  return { x, y, time, drift: x * time };
}
export function upstreamAngle(speed: number, current: number) {
  return speed > current ? (Math.asin(current / speed) * 180) / Math.PI : null;
}
