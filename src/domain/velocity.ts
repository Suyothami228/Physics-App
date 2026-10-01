export function journeyState(
  speeds: number[],
  length: number,
  returning: boolean,
  time: number,
) {
  const durations = speeds.map((v) => length / v);
  const totalTime = durations.reduce((a, b) => a + b, 0);
  let remaining = Math.max(0, Math.min(time, totalTime));
  let distance = 0,
    displacement = 0,
    velocity = 0;
  durations.forEach((duration, i) => {
    const elapsed = Math.min(remaining, duration);
    const direction = returning && i === 1 ? -1 : 1;
    distance += elapsed * speeds[i];
    displacement += direction * elapsed * speeds[i];
    if (remaining > 0 && remaining <= duration)
      velocity = direction * speeds[i];
    remaining = Math.max(0, remaining - duration);
  });
  if (time >= totalTime || time <= 0) velocity = 0;
  return {
    distance,
    displacement,
    velocity,
    totalTime,
    durations,
    averageSpeed: time > 0 ? distance / Math.min(time, totalTime) : null,
    averageVelocity: time > 0 ? displacement / Math.min(time, totalTime) : null,
  };
}
export function constantAcceleration(u: number, a: number, t: number) {
  return { velocity: u + a * t, displacement: u * t + 0.5 * a * t * t };
}
// Ideal uniform-density spherical Earth, normalized to surface gravity.
export function gravityRatio(radius: number) {
  return radius <= 1 ? Math.max(0, radius) : 1 / (radius * radius);
}
