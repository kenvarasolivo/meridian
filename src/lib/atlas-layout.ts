import type { AtlasModel, AtlasPoint } from "./atlas";
import { globePosition, type GlobeVector } from "./globe";

export type NetworkCamera = { yaw: number; pitch: number; zoom: number };
export const initialNetworkCamera: NetworkCamera = { yaw: 0, pitch: 0, zoom: 1 };
const regions: Record<string, [number, number]> = {
  frontend: [35, -42],
  api: [8, 15],
  auth: [34, 95],
  database: [-37, -20],
  payments: [-14, 78],
  jobs: [-32, -112],
  notifications: [52, -152],
};

/** Compact satellite clusters in each hub's tangent plane, distributed around a 3D globe. */
export function layoutAtlas(model: AtlasModel) {
  const counts = new Map<string, number>();
  return model.nodes.map((node): AtlasPoint => {
    const [lat, lng] = regions[node.moduleId] ?? [0, 0];
    const center = globePosition(lat, lng, 216);
    if (node.kind === "module") {
      const [x, y, z] = center;
      return { ...node, x, y, z, fx: x, fy: y, fz: z };
    }
    const index = counts.get(node.moduleId) ?? 0;
    counts.set(node.moduleId, index + 1);
    const angle = index * 2.3999632297;
    const spread = 28 + Math.sqrt(index) * 11;
    const latitude = lat * Math.PI / 180;
    const longitude = lng * Math.PI / 180;
    const east = [Math.cos(longitude), 0, -Math.sin(longitude)];
    const north = [-Math.sin(latitude) * Math.sin(longitude), Math.cos(latitude), -Math.sin(latitude) * Math.cos(longitude)];
    const local = center.map((value, axis) => value + spread * (Math.cos(angle) * east[axis] + Math.sin(angle) * north[axis]));
    const radius = 214 + (index % 3) * 3;
    const length = Math.hypot(...local);
    const [x, y, z] = local.map((value) => value / length * radius);
    return { ...node, x, y, z, fx: x, fy: y, fz: z };
  });
}

/** Positive drag deltas move the front hemisphere right and down, like grabbing a globe. */
export function rotateNetwork(camera: NetworkCamera, dx: number, dy: number, width: number): NetworkCamera {
  const sensitivity = 4 / Math.max(260, width);
  return { ...camera, yaw: camera.yaw + dx * sensitivity, pitch: Math.max(-1.35, Math.min(1.35, camera.pitch + dy * sensitivity)) };
}

export function projectNetworkPoint(point: GlobeVector, camera: NetworkCamera) {
  const cosYaw = Math.cos(camera.yaw), sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch), sinPitch = Math.sin(camera.pitch);
  const x = point[0] * cosYaw + point[2] * sinYaw;
  const rawZ = -point[0] * sinYaw + point[2] * cosYaw;
  const y = point[1] * cosPitch - rawZ * sinPitch;
  const z = point[1] * sinPitch + rawZ * cosPitch;
  const perspective = 900 / (900 - z);
  return { x: x * perspective * camera.zoom, y: -y * perspective * camera.zoom, z, perspective };
}

export function zoomNetwork(camera: NetworkCamera, factor: number): NetworkCamera {
  return { ...camera, zoom: Math.max(0.6, Math.min(2.6, camera.zoom * factor)) };
}
