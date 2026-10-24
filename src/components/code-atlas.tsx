"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Maximize, Minus, Plus, Search, X } from "lucide-react";
import { atlasGroupColors, buildAtlasModel } from "@/lib/atlas";
import { getAtlasNeighborhood, describeAtlasNode, atlasNodeLabel } from "@/lib/atlas-discovery";
import { project, rootComponents } from "@/data/application";
import { AtlasNetwork, type AtlasNetworkHandle } from "./atlas-network";
import { AtlasFinder } from "./atlas-finder";

export function CodeAtlas({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const model = useMemo(buildAtlasModel, []);
  const active = useMemo(() => getAtlasNeighborhood(model, selected).ids, [model, selected]);
  const selectedNode = model.nodes.find((node) => node.id === selected);
  const destination = `/explore#atlas${selectedNode ? `?${new URLSearchParams(selectedNode.file ? { file: selectedNode.file.path } : { module: selectedNode.id })}` : ""}`;
  const network = useRef<AtlasNetworkHandle>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div className="landing-atlas" data-ui>
      <div className="landing-atlas-heading">
        <span><i /> {project.name}</span>
        <button className="landing-atlas-search-toggle" aria-label={searchOpen ? "Close node search" : "Search graph nodes"} aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}>{searchOpen ? <X size={16} /> : <Search size={16} />}</button>
      </div>
      {searchOpen && <div className="landing-atlas-search"><AtlasFinder model={model} onSelect={(id) => { network.current?.focus(id); onSelect(id); setSearchOpen(false); }} /></div>}
      <AtlasNetwork
        ref={network}
        model={model}
        selectedId={selected === "all" ? null : selected}
        activeIds={active}
        showAllLinks
        onSelect={(node) => onSelect(node ? node.id === selected ? "all" : node.id : "all")}
      />
      <div className="landing-atlas-footer">
        <span className="landing-atlas-hint">Drag to explore</span>
        <div className="landing-atlas-controls" role="group" aria-label="Atlas navigation">
          <button onClick={() => network.current?.rotate(-0.25)} aria-label="Rotate atlas left"><ArrowLeft size={15} /></button>
          <button onClick={() => network.current?.rotate(0.25)} aria-label="Rotate atlas right"><ArrowRight size={15} /></button>
          <button onClick={() => network.current?.zoom(1 / 1.2)} aria-label="Zoom atlas out"><Minus size={15} /></button>
          <button onClick={() => network.current?.zoom(1.2)} aria-label="Zoom atlas in"><Plus size={15} /></button>
          <button onClick={() => { network.current?.reset(); onSelect("all"); }} aria-label="Fit atlas to view"><Maximize size={14} /></button>
        </div>
      </div>
      <nav className="landing-atlas-modules" aria-label="Highlight an atlas module">
        <button aria-pressed={selected === "all"} onClick={() => onSelect("all")}>All</button>
        {rootComponents.map((module) => <button key={module.id} aria-pressed={selected === module.id} onClick={() => onSelect(module.id)}><i style={{ background: atlasGroupColors[module.id] }} />{module.name}</button>)}
      </nav>
      <div className="landing-atlas-caption"><span aria-live="polite">{selectedNode ? <><strong>{atlasNodeLabel(selectedNode)}</strong> {describeAtlasNode(selectedNode)}</> : `${model.nodes.length} connected nodes. One codebase.`}</span><Link href={destination}>Open Atlas <ArrowUpRight size={14} /></Link></div>
    </div>
  );
}
