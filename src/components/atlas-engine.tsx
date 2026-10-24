"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Crosshair, FileCode2, Maximize, Minus, Plus, RotateCcw, GitBranch, SlidersHorizontal } from "lucide-react";
import { getAtlasNeighborhood, atlasNodeLabel } from "@/lib/atlas-discovery";
import { getChangeImpact } from "@/lib/impact";
import { AtlasNetwork, type AtlasNetworkHandle } from "./atlas-network";
import { AtlasFallback, type AtlasViewProps } from "./atlas-view";
import { AtlasFinder } from "./atlas-finder";

export default function AtlasEngine({ model, intent, selectedId, onSelect, onMap, onReset }: AtlasViewProps) {
  const network = useRef<AtlasNetworkHandle>(null);
  const [showFiles, setShowFiles] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [showAllLinks, setShowAllLinks] = useState(true);
  const impact = useMemo(() => intent === "impact" && selectedId ? getChangeImpact(model, selectedId) : null, [model, intent, selectedId]);
  const neighborhood = useMemo(() => getAtlasNeighborhood(model, selectedId), [model, selectedId]);
  const active = useMemo(() => impact ? new Set([impact.targetId, ...impact.affectedIds]) : neighborhood.ids, [neighborhood, impact]);
  const selected = model.nodes.find((node) => node.id === selectedId);
  const visibleCount = model.nodes.filter((node) => node.kind === "file" && (showFiles || active.has(node.id))).length;
  const home = () => {
    onReset();
    setShowFiles(true);
    setShowAllLinks(true);
    network.current?.reset();
  };
  if (unavailable) return <AtlasFallback onSelect={onSelect} onMap={onMap} />;
  return (
    <div className="atlas-canvas atlas-network-stage" data-ui>
      <div className="atlas-discovery-tools">
        <AtlasFinder model={model} onSelect={(id) => { network.current?.focus(id); onSelect(id); }} />
        <details className="atlas-display-settings">
          <summary><SlidersHorizontal size={15} /><span>Display</span></summary>
          <div className="atlas-display-options">
          <button aria-pressed={showAllLinks} onClick={() => setShowAllLinks((value) => !value)}><GitBranch size={14} />All relationships</button>
          <button aria-label={showFiles ? "Hide files" : "Show all files"} aria-pressed={showFiles} onClick={() => setShowFiles((value) => !value)}><FileCode2 size={14} /><span>Files</span></button>
          </div>
        </details>
      </div>
      <AtlasNetwork
        ref={network}
        model={model}
        selectedId={selectedId}
        activeIds={active}
        activeLinks={impact?.linkIds}
        showAllLinks={showAllLinks}
        showFiles={showFiles}
        interactiveWheel
        onUnavailable={() => setUnavailable(true)}
        onSelect={(node) => {
          onSelect(node?.id === selectedId ? null : node?.id ?? null);
        }}
      />
      <div className="canvas-controls atlas-controls">
        <button onClick={() => network.current?.rotate(-0.25)} aria-label="Rotate atlas left"><ArrowLeft size={15} /></button>
        <button onClick={() => network.current?.rotate(0.25)} aria-label="Rotate atlas right"><ArrowRight size={15} /></button>
        <button onClick={() => network.current?.zoom(1 / 1.2)} aria-label="Zoom out"><Minus size={16} /></button>
        <button onClick={() => network.current?.zoom(1.2)} aria-label="Zoom in"><Plus size={16} /></button>
        <button onClick={() => network.current?.reset()} aria-label="Fit atlas to view"><Maximize size={15} /></button>
        <button onClick={home} aria-label="Reset atlas"><RotateCcw size={15} /></button>
      </div>
      <div className="atlas-navigation-hint">Drag to rotate <span>·</span> Scroll to zoom</div>
      <div className="atlas-scene-foot">
        <span>{impact
          ? `${impact.affectedIds.size} ${impact.affectedIds.size === 1 ? "dependent" : "dependents"}`
          : intent === "impact"
            ? "Select a module or file to see what depends on it"
            : selected ? `${atlasNodeLabel(selected)} · ${neighborhood.ids.size - 1} connected nodes` : `${model.nodes.filter((node) => node.kind === "module").length} modules · ${visibleCount} source files`}</span>
        {selectedId && <button onClick={home}><Crosshair size={13} /> Show all modules</button>}
      </div>
    </div>
  );
}
