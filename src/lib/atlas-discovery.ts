import { componentById } from "@/data/application";
import type { AtlasLink, AtlasModel, AtlasPoint } from "./atlas";

export type AtlasNodeKind = AtlasPoint["kind"] | "all";

export function describeAtlasNode(node: AtlasPoint) {
  return node.file?.description ?? componentById[node.id]?.purpose.beginner ?? node.name;
}

export function atlasNodeLabel(node: AtlasPoint) {
  if (!node.file) return node.name;
  const parts = node.name.split("/");
  const name = parts.at(-1)!;
  return /^(route|page|layout|index|loading|error)\.(ts|tsx)$/.test(name) ? parts.slice(-2).join("/") : name;
}

/** One representative, real parent/reference edge for each smaller node. */
export function getAtlasOverviewLinks(model: AtlasModel): AtlasLink[] {
  const nodes = new Map(model.nodes.map((node) => [node.id, node]));
  const result: AtlasLink[] = [];
  for (const node of model.nodes) {
    if (node.kind === "module") continue;
    const candidates = model.links.filter((link) => link.target === node.id && link.kind === (node.kind === "file" ? "source" : "contains"));
    const parent = candidates.find((link) => nodes.get(link.source)?.moduleId === node.moduleId) ?? candidates[0];
    if (parent) result.push(parent);
  }
  return result;
}

/** Direct neighbours only: additional dependency paths are reserved for Impact. */
export function getAtlasNeighborhood(model: AtlasModel, id: string | null) {
  const ids = new Set<string>();
  const links = new Set<string>();
  if (!id || !model.nodes.some((node) => node.id === id)) return { ids, links };
  ids.add(id);
  for (const link of model.links) {
    if (link.source !== id && link.target !== id) continue;
    ids.add(link.source);
    ids.add(link.target);
    links.add(link.id);
  }
  return { ids, links };
}

export function searchAtlasNodes(model: AtlasModel, query: string, kind: AtlasNodeKind = "all") {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const ranked = model.nodes.filter((node) => kind === "all" || node.kind === kind).map((node) => {
    const component = componentById[node.componentId ?? ""];
    const module = componentById[node.moduleId];
    const name = node.name.toLowerCase();
    const label = atlasNodeLabel(node).toLowerCase();
    const text = [name, describeAtlasNode(node), module?.name, component?.technology, component?.functions.join(" ")].join(" ").toLowerCase();
    const match = tokens.every((token) => text.includes(token));
    const q = query.toLowerCase().trim();
    const score = label === q ? 0 : label.startsWith(q) ? 1 : name.includes(q) ? 2 : 3;
    return { node, match, score };
  });
  return ranked.filter(({ node, match }) => match && (tokens.length > 0 || kind !== "all" || node.kind === "module"))
    .sort((a, b) => a.score - b.score || a.node.name.localeCompare(b.node.name)).map(({ node }) => node);
}
