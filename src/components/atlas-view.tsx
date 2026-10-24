"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  Orbit,
  ScanLine,
  Workflow,
} from "lucide-react";
import { rootComponents } from "@/data/application";
import type { SourceFile } from "@/lib/types";
import type { AtlasModel } from "@/lib/atlas";
import type { AtlasIntent } from "@/lib/impact";
import { atlasGroupColors, getModuleId } from "@/lib/atlas";
import { componentIcons } from "./icons";

export interface AtlasViewProps {
  model: AtlasModel;
  intent: AtlasIntent;
  onIntentChange: (intent: AtlasIntent) => void;
  selectedId: string | null;
  focusedIds: string[];
  onSelect: (id: string | null) => void;
  onSource: (file: SourceFile) => void;
  onMap: () => void;
  onReset: () => void;
}

const AtlasEngine = dynamic(() => import("./atlas-engine"), {
  ssr: false,
  loading: () => (
    <div className="atlas-loading" role="status">
      <Orbit size={24} />
      <span>Opening Atlas</span>
    </div>
  ),
});

class AtlasBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function AtlasFallback({
  onSelect,
  onMap,
}: Pick<AtlasViewProps, "onSelect" | "onMap">) {
  return (
    <div className="atlas-fallback">
      <Orbit size={28} />
      <h2>The graph is unavailable in this browser.</h2>
      <p>You can still explore every module.</p>
      <div>
        {rootComponents.map((module) => (
          <button key={module.id} onClick={() => onSelect(module.id)}>
            <i style={{ background: atlasGroupColors[module.id] }} />
            {module.name}
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <button className="secondary-button" onClick={onMap}>
        Open map
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

export function AtlasView(props: AtlasViewProps) {
  const activeModule = props.selectedId?.startsWith("file:")
    ? props.model.nodes.find((node) => node.id === props.selectedId)?.moduleId
    : props.selectedId
      ? getModuleId(props.selectedId)
      : null;
  return (
    <div className="atlas-view-shell">
      <header className="atlas-toolbar">
        <div className="atlas-toolbar-title">
          <Globe2 size={20} />
          <div>
            <strong>{props.intent === "impact" ? "Dependencies" : "Your code, connected."}</strong>
            <span>
              {props.intent === "impact"
                ? "Choose a module or file to see what depends on it."
                : "Choose a module. Discover what’s inside."}
            </span>
          </div>
        </div>
        <div
          className="atlas-intent-switch"
          role="group"
          aria-label="Atlas mode"
        >
          <button
            aria-pressed={props.intent === "explore"}
            onClick={() => props.onIntentChange("explore")}
          >
            <Orbit size={14} /> Explore
          </button>
          <button
            aria-pressed={props.intent === "impact"}
            onClick={() => props.onIntentChange("impact")}
          >
            <ScanLine size={14} /> Dependencies
          </button>
        </div>
      </header>
      <div className="atlas-stage">
        <AtlasBoundary
          fallback={
            <AtlasFallback onSelect={props.onSelect} onMap={props.onMap} />
          }
        >
          <AtlasEngine {...props} />
        </AtlasBoundary>
      </div>
      <nav className="atlas-module-dock" aria-label="Atlas modules">
        <div className="atlas-dock-heading">
          <span>Find a module</span>
          <span>{rootComponents.length} modules</span>
        </div>
        <select
          className="atlas-module-select"
          aria-label="Focus atlas module"
          value={activeModule ?? ""}
          onChange={(event) => props.onSelect(event.target.value || null)}
        >
          <option value="">All modules</option>
          {rootComponents.map((module) => (
            <option value={module.id} key={module.id}>{module.name}</option>
          ))}
        </select>
        <div className="atlas-module-list">
          {rootComponents.map((module) => {
            const Icon = componentIcons[module.kind];
            return (
              <button
                key={module.id}
                aria-label={`Focus ${module.name} in atlas`}
                aria-pressed={activeModule === module.id}
                onClick={() =>
                  props.onSelect(
                    props.selectedId === module.id ? null : module.id,
                  )
                }
              >
                <Icon
                  size={15}
                  style={{ color: atlasGroupColors[module.id] }}
                />
                <span>{module.name}</span>
              </button>
            );
          })}
        </div>
        <button className="atlas-open-map" onClick={props.onMap}>
          <Workflow size={14} /> Open 2D map <ArrowUpRight size={14} />
        </button>
      </nav>
    </div>
  );
}
