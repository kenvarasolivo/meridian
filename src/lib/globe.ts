/** Shared globe coordinates; latitude is positive north, longitude positive east. */
export const globeLocations = [
  { id: "frontend", label: "Frontend", lat: 38, lng: -38 },
  { id: "api", label: "API", lat: 19, lng: 31 },
  { id: "auth", label: "Authentication", lat: 0, lng: -53 },
  { id: "database", label: "Database", lat: -31, lng: 5 },
  { id: "payments", label: "Payments", lat: -12, lng: 65 },
  { id: "jobs", label: "Background jobs", lat: -46, lng: -39 },
  { id: "notifications", label: "Notifications", lat: 57, lng: 33 },
];

export type GlobeVector = [number, number, number];

export function globePosition(
  lat: number,
  lng: number,
  radius = 1,
): GlobeVector {
  const a = (lat * Math.PI) / 180,
    b = (lng * Math.PI) / 180;
  return [
    radius * Math.cos(a) * Math.sin(b),
    radius * Math.sin(a),
    radius * Math.cos(a) * Math.cos(b),
  ];
}

/** Deterministic points on a curved route, kept outside the globe surface. */
export function globeArc(
  start: GlobeVector,
  end: GlobeVector,
  lift = 24,
  segments = 48,
): GlobeVector[] {
  const a = Math.hypot(...start),
    b = Math.hypot(...end);
  const dot = Math.max(
    -1,
    Math.min(
      1,
      start.reduce(
        (sum, value, index) => sum + ((value / a) * end[index]) / b,
        0,
      ),
    ),
  );
  const angle = Math.acos(dot);
  let tangent = end.map(
    (value, index) => value / b - (start[index] / a) * dot,
  ) as GlobeVector;
  if (Math.hypot(...tangent) < 1e-8) {
    tangent =
      Math.abs(start[0] / a) < 0.8
        ? [0, start[2], -start[1]]
        : [-start[2], 0, start[0]];
  }
  const tangentLength = Math.hypot(...tangent);
  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments;
    const vector = start.map(
      (value, index) =>
        (value / a) * Math.cos(angle * t) +
        (tangent[index] / tangentLength) * Math.sin(angle * t),
    ) as GlobeVector;
    const length = Math.hypot(...vector);
    const radius = a * (1 - t) + b * t + Math.sin(Math.PI * t) * lift;
    return vector.map(
      (value) => (value / Math.max(length, 0.00001)) * radius,
    ) as GlobeVector;
  });
}
