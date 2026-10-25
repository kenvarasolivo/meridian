import {
  componentById,
  domainEntities,
  domainRelationships,
  relationships,
  rootComponents,
  subgraphRelationships,
} from "@/data/application";
import type { CodeRelationship, ViewMode } from "./types";

const overviewPositions: Record<string, { x: number; y: number }> = {
  frontend: { x: 0, y: 180 },
  api: { x: 330, y: 180 },
  auth: { x: 330, y: 0 },
  database: { x: 660, y: 0 },
  payments: { x: 660, y: 180 },
  jobs: { x: 660, y: 360 },
  notifications: { x: 330, y: 360 },
};
const domainPositions: Record<string, { x: number; y: number }> = {
  "entity-user": { x: 0, y: 0 },
  "entity-order": { x: 310, y: 0 },
  "entity-product": { x: 0, y: 260 },
  "entity-item": { x: 310, y: 260 },
  "entity-payment": { x: 620, y: 0 },
};

export function getGraphModel(mode: ViewMode, scope: string[]) {
  if (mode === "domain")
    return {
      components: domainEntities,
      relationships: domainRelationships,
      positions: domainPositions,
    };
  const parentId = scope.at(-1);
  if (parentId) {
    const children = (componentById[parentId].children ?? []).map(
      (id) => componentById[id],
    );
    const positions = Object.fromEntries(
      children.map((c, i) => [
        c.id,
        { x: (i % 2) * 370, y: Math.floor(i / 2) * 250 },
      ]),
    );
    if (parentId === "api")
      Object.assign(positions, {
        "api-middleware": { x: 0, y: 0 },
        routes: { x: 370, y: 0 },
        validation: { x: 0, y: 250 },
        services: { x: 370, y: 250 },
      });
    const edges: CodeRelationship[] =
      subgraphRelationships[parentId] ??
      children.slice(1).map((c, i) => ({
        id: `${children[i].id}-${c.id}`,
        source: children[i].id,
        target: c.id,
        label: "passes work to",
      }));
    return { components: children, relationships: edges, positions };
  }
  return {
    components: rootComponents,
    relationships,
    positions: overviewPositions,
  };
}

export function getComponentScope(id: string): string[] {
  const scope: string[] = [];
  let current = componentById[id];
  while (current?.parentId) {
    scope.unshift(current.parentId);
    current = componentById[current.parentId];
  }
  return scope;
}
