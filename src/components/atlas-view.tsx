"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { ArrowRight, Orbit } from "lucide-react";
import { rootComponents, kindMeta } from "@/data/application";
import type { SourceFile } from "@/lib/types";
import type { AtlasModel } from "@/lib/atlas";
import type { AtlasIntent } from "@/lib/impact";

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
      <h2>3D is unavailable in this browser.</h2>
      <p>You can still explore every module.</p>
      <div>
        {rootComponents.map((module) => (
          <button key={module.id} onClick={() => onSelect(module.id)}>
            <i style={{ background: kindMeta[module.kind].color }} />
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
  return (
    <div className="atlas-view-shell">
      <div className="atlas-intent-switch" role="group" aria-label="Atlas mode">
        <button
          aria-pressed={props.intent === "explore"}
          onClick={() => props.onIntentChange("explore")}
        >
          Explore
        </button>
        <button
          aria-pressed={props.intent === "impact"}
          onClick={() => props.onIntentChange("impact")}
        >
          Impact
        </button>
      </div>
      <AtlasBoundary
        fallback={
          <AtlasFallback onSelect={props.onSelect} onMap={props.onMap} />
        }
      >
        <AtlasEngine {...props} />
      </AtlasBoundary>
    </div>
  );
}
