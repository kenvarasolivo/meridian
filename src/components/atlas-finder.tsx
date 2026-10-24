"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { componentById } from "@/data/application";
import type { AtlasModel } from "@/lib/atlas";
import { atlasNodeLabel, describeAtlasNode, searchAtlasNodes, type AtlasNodeKind } from "@/lib/atlas-discovery";

export function AtlasFinder({ model, onSelect }: { model: AtlasModel; onSelect: (id: string) => void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AtlasNodeKind>("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = useMemo(() => searchAtlasNodes(model, query, kind), [model, query, kind]);
  const results = matches.slice(0, 8);
  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, open, id]);
  const choose = (nodeId: string) => {
    onSelect(nodeId); setOpen(false);
    if (window.matchMedia("(max-width: 600px)").matches) input.current?.blur();
  };
  return (
    <div className="atlas-finder" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <div className="atlas-finder-field">
        <Search size={16} aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-label="Find atlas nodes"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined}
          placeholder="Find a node…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.stopPropagation(); setOpen(false); }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); setOpen(true);
              setActive((value) => Math.max(0, Math.min(results.length - 1, value + (event.key === "ArrowDown" ? 1 : -1))));
            }
            if (event.key === "Enter" && open && results[active]) { event.preventDefault(); choose(results[active].id); }
          }}
        />
        {query && <button aria-label="Clear node search" onClick={() => { setQuery(""); setActive(0); setOpen(true); }}><X size={14} /></button>}
        <select aria-label="Filter node type" value={kind} onChange={(event) => { setKind(event.target.value as AtlasNodeKind); setActive(0); setOpen(true); }}>
          <option value="all">All nodes</option><option value="module">Modules</option><option value="component">Components</option><option value="file">Files</option>
        </select>
      </div>
      {open && (
        <div className="atlas-finder-popover">
          <div className="atlas-finder-help">{query.trim() || kind !== "all" ? `${matches.length} ${matches.length === 1 ? "match" : "matches"}${matches.length > 8 ? " · showing first 8" : ""}` : "Start with a module, or search names, paths, and purpose."}</div>
          <div role="listbox" aria-label="Atlas search results" id={`${id}-results`}>
            {results.map((node, index) => (
              <button key={node.id} id={`${id}-${index}`} role="option" aria-selected={active === index}
                onPointerDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(node.id)}>
                <span className={`atlas-result-dot atlas-result-${node.kind}`} style={{ background: node.color }} />
                <span><strong>{atlasNodeLabel(node)}</strong><small>{node.file ? node.name : describeAtlasNode(node)}</small><span>{node.kind === "file" ? "File" : node.kind === "module" ? "Module" : "Component"} · {componentById[node.moduleId]?.name}</span></span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          {!matches.length && <p className="atlas-finder-empty">No matching nodes. Try “sign-in”, “checkout”, or a file path.</p>}
        </div>
      )}
    </div>
  );
}
