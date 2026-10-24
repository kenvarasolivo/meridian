"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  FileCode2,
  GitBranch,
  X,
} from "lucide-react";
import { componentIcons } from "./icons";
import { componentById } from "@/data/application";
import type { AtlasModel, AtlasPoint } from "@/lib/atlas";
import type { ChangeImpact, ImpactDependent } from "@/lib/impact";
import type { SourceFile } from "@/lib/types";

interface Props {
  model: AtlasModel;
  impact: ChangeImpact;
  mobileOpen: boolean;
  onClose: () => void;
  onSource: (file: SourceFile) => void;
  onInspect: (id: string) => void;
  onExplore: (id: string) => void;
}

export function ImpactPanel({
  model,
  impact,
  mobileOpen,
  onClose,
  onSource,
  onInspect,
  onExplore,
}: Props) {
  const target = model.nodes.find((node) => node.id === impact.targetId);
  if (!target) return null;
  const component = target.componentId
    ? componentById[target.componentId]
    : null;
  return (
    <aside
      className={`inspector impact-panel ${mobileOpen ? "mobile-open" : ""}`}
      aria-label="Dependencies inspector"
    >
      <div className="inspector-header">
        <span>Dependencies</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dependencies"
        >
          <X size={15} />
        </button>
      </div>
      <div className="inspector-scroll">
        <div className="impact-heading">
          <GitBranch size={25} />
          <h2>
            {target.kind === "file"
              ? target.name.split("/").at(-1)
              : target.name}
          </h2>
          {target.file && <code>{target.file.path}</code>}
        </div>
        <div className="impact-counts" aria-label="Dependents">
          <span>
            <i className="impact-direct-dot" />
            <strong>{impact.direct.length}</strong> direct
          </span>
          <span>
            <i className="impact-indirect-dot" />
            <strong>{impact.indirect.length}</strong> indirect
          </span>
        </div>
        {impact.affectedIds.size ? (
          <>
            <section className="impact-group">
              <h3>Direct dependents</h3>
              {impact.direct.map((dependent) => (
                <DependentRow
                  key={dependent.id}
                  model={model}
                  dependent={dependent}
                  onSource={onSource}
                  onInspect={onInspect}
                />
              ))}
            </section>
            {impact.indirect.length > 0 && (
              <details className="impact-group impact-indirect">
                <summary>
                  Indirect dependents
                  <span>
                    {impact.indirect.length}
                    <ChevronRight size={13} />
                  </span>
                </summary>
                {impact.indirect.map((dependent) => (
                  <DependentRow
                    key={dependent.id}
                    model={model}
                    dependent={dependent}
                    onSource={onSource}
                    onInspect={onInspect}
                  />
                ))}
              </details>
            )}
          </>
        ) : (
          <div className="impact-empty">
            <h3>No dependents found.</h3>
            <p>No other code depends on this selection in the example graph.</p>
          </div>
        )}
        <p className="impact-note">
          Shows code that depends on this selection, directly or indirectly,
          in the example codebase.
        </p>
      </div>
      <div className="inspector-footer">
        {target.file ? (
          <button
            className="secondary-button explore-button"
            onClick={() => onSource(target.file!)}
          >
            <FileCode2 size={15} />
            Open source
            <ArrowRight size={15} />
          </button>
        ) : component?.children?.length ? (
          <button
            className="primary-button explore-button"
            onClick={() => onExplore(component.id)}
          >
            Explore deeper
            <ArrowRight size={15} />
          </button>
        ) : component ? (
          <button
            className="secondary-button explore-button"
            onClick={() => onSource(component.files[0])}
          >
            Open source
            <ArrowRight size={15} />
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function PointIcon({ point }: { point: AtlasPoint }) {
  const Icon = point.file
    ? FileCode2
    : componentIcons[componentById[point.componentId!].kind];
  return <Icon size={15} />;
}

function DependentRow({
  model,
  dependent,
  onSource,
  onInspect,
}: {
  model: AtlasModel;
  dependent: ImpactDependent;
  onSource: Props["onSource"];
  onInspect: Props["onInspect"];
}) {
  const [open, setOpen] = useState(false);
  const node = model.nodes.find((node) => node.id === dependent.id)!;
  const target = model.nodes.find(
    (node) => node.id === dependent.path[0].from,
  )!;
  return (
    <div className={`impact-dependent ${open ? "is-open" : ""}`}>
      <button
        className="impact-dependent-trigger"
        aria-expanded={open}
        aria-label={`Show dependency path for ${node.name}`}
        onClick={() => setOpen(!open)}
      >
        <PointIcon point={node} />
        <span>
          <strong>{node.file ? node.name.split("/").at(-1) : node.name}</strong>
          {node.file && <small>{node.file.path}</small>}
        </span>
        <ChevronRight size={13} />
      </button>
      {open && (
        <div className="impact-path">
          <div className="impact-path-origin">
            <i />
            {target.file ? target.name.split("/").at(-1) : target.name}
            <small>selected</small>
          </div>
          <ol>
            {dependent.path.map((hop) => {
              const point = model.nodes.find((node) => node.id === hop.to)!;
              return (
                <li key={hop.linkId}>
                  <span>
                    {point.file ? point.name.split("/").at(-1) : point.name}
                  </span>
                  <p>{hop.reason}</p>
                </li>
              );
            })}
          </ol>
          <button
            className="text-button"
            onClick={() =>
              node.file ? onSource(node.file) : onInspect(node.id)
            }
          >
            {node.file ? "Open source" : "Inspect component"}
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
