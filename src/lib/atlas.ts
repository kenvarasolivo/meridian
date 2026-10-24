import {
  componentById,
  components,
  kindMeta,
  project,
  relationships,
  rootComponents,
  subgraphRelationships,
} from "@/data/application";
import type { SourceFile } from "./types";

export type AtlasPoint = {
  id: string;
  name: string;
  kind: "module" | "component" | "file";
  moduleId: string;
  componentId?: string;
  file?: SourceFile;
  color: string;
  connections: number;
  x: number;
  y: number;
  z: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

export type AtlasLink = {
  id: string;
  source: string;
  target: string;
  kind: "dependency" | "contains" | "source" | "import";
  label: string;
};

export type AtlasModel = { nodes: AtlasPoint[]; links: AtlasLink[] };

const centers: Record<string, [number, number, number]> = {
  frontend: [-220, 15, 65],
  api: [-25, 15, 0],
  auth: [-55, 165, -55],
  database: [180, 140, -20],
  payments: [195, -30, 75],
  jobs: [70, -185, -60],
  notifications: [-165, -160, 30],
};

export function getModuleId(componentId: string): string {
  let component = componentById[componentId];
  while (component?.parentId) component = componentById[component.parentId];
  return component?.id ?? componentId;
}

function getFileModule(file: SourceFile): string {
  if (/auth|middleware/.test(file.path)) return "auth";
  if (/stripe|checkout\.ts/.test(file.path)) return "payments";
  if (/schema|lib\/db/.test(file.path)) return "database";
  if (/jobs\/|lib\/jobs|services\/orders/.test(file.path)) return "jobs";
  if (/notifications|emails\//.test(file.path)) return "notifications";
  if (/app\/api|validation/.test(file.path)) return "api";
  return "frontend";
}

function position(id: string, moduleId: string): [number, number, number] {
  let seed = 2166136261;
  for (const char of id)
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const theta = random() * Math.PI * 2;
  const vertical = random() * 2 - 1;
  const radius = 30 + random() * 42;
  const horizontal = Math.sqrt(1 - vertical * vertical);
  const center = centers[moduleId];
  return [
    center[0] + radius * horizontal * Math.cos(theta),
    center[1] + radius * vertical,
    center[2] + radius * horizontal * Math.sin(theta),
  ];
}

/** Every point and edge comes from the example model. No decorative filler nodes. */
export function buildAtlasModel(): AtlasModel {
  const nodes: AtlasPoint[] = components.map((component) => {
    const moduleId = getModuleId(component.id);
    const module = componentById[moduleId];
    const isModule = !component.parentId;
    const [x, y, z] = isModule
      ? centers[moduleId]
      : position(component.id, moduleId);
    return {
      id: component.id,
      name: component.name,
      kind: isModule ? "module" : "component",
      moduleId,
      componentId: component.id,
      color: kindMeta[module.kind].color,
      connections: 0,
      x,
      y,
      z,
      ...(isModule ? { fx: x, fy: y, fz: z } : {}),
    };
  });
  for (const file of project.files) {
    const moduleId = getFileModule(file);
    const [x, y, z] = position(file.path, moduleId);
    nodes.push({
      id: `file:${file.path}`,
      name: file.path,
      kind: "file",
      moduleId,
      file,
      color: kindMeta[componentById[moduleId].kind].color,
      connections: 0,
      x,
      y,
      z,
    });
  }
  const links: AtlasLink[] = [
    ...relationships,
    ...Object.values(subgraphRelationships).flat(),
  ].map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    kind: "dependency",
    label: edge.label,
  }));
  for (const component of components) {
    if (component.parentId)
      links.push({
        id: `contains:${component.id}`,
        source: component.parentId,
        target: component.id,
        kind: "contains",
        label: "contains",
      });
    for (const file of component.files)
      links.push({
        id: `source:${component.id}:${file.path}`,
        source: component.id,
        target: `file:${file.path}`,
        kind: "source",
        label: "uses source",
      });
  }
  const paths = new Set(project.files.map((file) => file.path));
  for (const file of project.files) {
    for (const match of file.code.matchAll(/from\s+['"]@\/([^'"]+)['"]/g)) {
      const target = [`${match[1]}.ts`, `${match[1]}.tsx`].find((path) =>
        paths.has(path),
      );
      if (target)
        links.push({
          id: `import:${file.path}:${target}`,
          source: `file:${file.path}`,
          target: `file:${target}`,
          kind: "import",
          label: "imports",
        });
    }
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  for (const link of links) {
    nodeById.get(link.source)!.connections++;
    nodeById.get(link.target)!.connections++;
  }
  return { nodes, links };
}

export function getAtlasFocus(
  model: AtlasModel,
  selectedId: string | null,
  focusedIds: string[] = [],
) {
  const modules = new Set(focusedIds.map(getModuleId));
  if (selectedId && modules.size === 0) modules.add(getModuleId(selectedId));
  const active = new Set(
    model.nodes
      .filter((node) => modules.has(node.moduleId))
      .map((node) => node.id),
  );
  for (const link of model.links) {
    if (link.kind === "source" && active.has(link.source))
      active.add(link.target);
  }
  return active;
}

export const atlasModuleCount = rootComponents.length;
