import type { AtlasLink, AtlasModel } from "./atlas";

export type AtlasIntent = "explore" | "impact";
export type ImpactHop = {
  from: string;
  to: string;
  linkId: string;
  reason: string;
};
export type ImpactDependent = { id: string; depth: number; path: ImpactHop[] };
export type ChangeImpact = {
  targetId: string;
  direct: ImpactDependent[];
  indirect: ImpactDependent[];
  affectedIds: Set<string>;
  linkIds: Set<string>;
};

/** Follow callers/importers in reverse. Containment is layout, not dependency. */
export function getChangeImpact(
  model: AtlasModel,
  targetId: string,
): ChangeImpact {
  const result: ChangeImpact = {
    targetId,
    direct: [],
    indirect: [],
    affectedIds: new Set(),
    linkIds: new Set(),
  };
  const nodes = new Map(model.nodes.map((node) => [node.id, node]));
  if (!nodes.has(targetId)) return result;
  const incoming = new Map<string, AtlasLink[]>();
  for (const link of model.links) {
    if (link.kind === "contains") continue;
    const edges = incoming.get(link.target) ?? [];
    edges.push(link);
    incoming.set(link.target, edges);
  }
  const visited = new Map<string, ImpactDependent>([
    [targetId, { id: targetId, depth: 0, path: [] }],
  ]);
  const queue = [visited.get(targetId)!];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const link of incoming.get(current.id) ?? []) {
      if (visited.has(link.source)) continue;
      const dependent: ImpactDependent = {
        id: link.source,
        depth: current.depth + 1,
        path: [
          ...current.path,
          {
            from: current.id,
            to: link.source,
            linkId: link.id,
            reason:
              link.kind === "import"
                ? `${nodes.get(link.source)!.name} imports ${nodes.get(link.target)!.name}.`
                : link.kind === "source"
                  ? `${nodes.get(link.source)!.name} uses ${nodes.get(link.target)!.name}.`
                  : `${nodes.get(link.source)!.name} depends on ${nodes.get(link.target)!.name} (${link.label}).`,
          },
        ],
      };
      visited.set(dependent.id, dependent);
      queue.push(dependent);
      result.affectedIds.add(dependent.id);
      (dependent.depth === 1 ? result.direct : result.indirect).push(dependent);
      for (const hop of dependent.path) result.linkIds.add(hop.linkId);
    }
  }
  return result;
}
