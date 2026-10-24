"use client";

import { ArrowRight, ArrowUpRight, FileCode2, ScanLine, X } from "lucide-react";
import { componentById } from "@/data/application";
import type { AtlasModel } from "@/lib/atlas";
import { atlasNodeLabel } from "@/lib/atlas-discovery";
import type { SourceFile } from "@/lib/types";

export function AtlasFileInspector({ model, file, mobileOpen, onClose, onSelect, onSource, onImpact }: {
  model: AtlasModel; file: SourceFile; mobileOpen: boolean; onClose: () => void;
  onSelect: (id: string) => void; onSource: (file: SourceFile) => void; onImpact: () => void;
}) {
  const id = `file:${file.path}`;
  const target = model.nodes.find((node) => node.id === id)!;
  const links = model.links.filter((link) => link.source === id || link.target === id);
  return (
    <aside className={`inspector atlas-file-inspector ${mobileOpen ? "mobile-open" : ""}`} aria-label="Source file inspector">
      <div className="inspector-header"><span>Source file</span><button className="icon-button" aria-label="Clear file selection" onClick={onClose}><X size={15} /></button></div>
      <div className="inspector-scroll" key={file.path}>
        <div className="component-detail-heading"><span className="detail-icon"><FileCode2 size={27} /></span><h2>{atlasNodeLabel(target)}</h2><p className="atlas-file-path">{file.path}</p></div>
        <section className="inspector-section"><p>{file.description}</p></section>
        <section className="inspector-section"><h3>Module</h3><button className="atlas-file-module" onClick={() => onSelect(target.moduleId)}>{componentById[target.moduleId].name}<ArrowUpRight size={14} /></button></section>
        <section className="inspector-section"><h3>Direct connections <span className="count-label">{links.length}</span></h3>
          <div className="atlas-file-connections">{links.map((link) => {
            const incoming = link.target === id;
            const other = model.nodes.find((node) => node.id === (incoming ? link.source : link.target))!;
            const explanation = link.kind === "source" ? "Uses this source file" : incoming ? "Imports this file" : "Imported by this file";
            return <button key={link.id} onClick={() => onSelect(other.id)}><span><strong>{atlasNodeLabel(other)}</strong><small>{explanation}</small>{other.file && <span className="atlas-connection-path">{other.file.path}</span>}</span><ArrowRight size={14} /></button>;
          })}</div>
          {!links.length && <p>No direct connections in this example.</p>}
        </section>
      </div>
      <div className="inspector-footer"><button className="secondary-button explore-button" onClick={onImpact}><ScanLine size={15} />Show dependencies<ArrowRight size={15} /></button><button className="primary-button explore-button" onClick={() => onSource(file)}><FileCode2 size={15} />Open source<ArrowUpRight size={15} /></button></div>
    </aside>
  );
}
