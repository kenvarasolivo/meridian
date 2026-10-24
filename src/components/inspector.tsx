"use client";

import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Braces,
  ChevronRight,
  Code2,
  FileCode2,
  Layers3,
  X,
} from "lucide-react";
import { componentById, domainEntities, kindMeta } from "@/data/application";
import { getGraphModel } from "@/lib/layout";
import type {
  DomainEntity,
  ExplanationLevel,
  SourceFile,
  ViewMode,
  Workflow,
} from "@/lib/types";
import { componentIcons } from "./icons";
import { CodePreview } from "./code-preview";
import { WorkflowPanel } from "./workflows";

interface Props {
  selectedId: string | null;
  scope: string[];
  mode: ViewMode;
  level: ExplanationLevel;
  workflow: Workflow | null;
  step: number;
  mobileOpen: boolean;
  onLevel: (level: ExplanationLevel) => void;
  onSelect: (id: string | null) => void;
  onExplore: (id: string) => void;
  onSource: (file: SourceFile) => void;
  onStep: (step: number) => void;
  onEndWorkflow: () => void;
  onCloseMobile: () => void;
}

export function Inspector(props: Props) {
  const selected = props.selectedId
    ? (componentById[props.selectedId] ??
      domainEntities.find((entity) => entity.id === props.selectedId))
    : null;
  const model = getGraphModel(props.mode, props.scope);
  const relationships = selected
    ? model.relationships.filter(
        (r) => r.source === selected.id || r.target === selected.id,
      )
    : [];
  if (!selected && !props.workflow) return null;
  const Icon = selected ? componentIcons[selected.kind] : Layers3;

  return (
    <aside
      className={`inspector ${props.mobileOpen ? "mobile-open" : ""}`}
      aria-label="Component inspector"
    >
      <div className="inspector-header">
        <span>{props.workflow ? "Workflow" : "Details"}</span>
        <button
          className="icon-button"
          onClick={() => {
            if (props.workflow) props.onEndWorkflow();
            else props.onSelect(null);
            props.onCloseMobile();
          }}
          aria-label="Clear selection and close inspector"
        >
          <X size={15} />
        </button>
      </div>
      <div
        className="explanation-switch"
        role="group"
        aria-label="Explanation detail"
      >
        <button
          aria-pressed={props.level === "beginner"}
          className={props.level === "beginner" ? "active" : ""}
          onClick={() => props.onLevel("beginner")}
          title="Plain-English explanations with less jargon"
        >
          Beginner
        </button>
        <button
          aria-pressed={props.level === "developer"}
          className={props.level === "developer" ? "active" : ""}
          onClick={() => props.onLevel("developer")}
          title="Implementation details, handlers, and schemas"
        >
          <Code2 size={13} />
          Developer
        </button>
      </div>
      <div className="inspector-scroll">
        {props.workflow ? (
          <WorkflowPanel
            workflow={props.workflow}
            step={props.step}
            level={props.level}
            onStep={props.onStep}
            onEnd={props.onEndWorkflow}
            onSource={props.onSource}
          />
        ) : selected ? (
          <>
            <div className="component-detail-heading">
              <span
                className="detail-icon"
                style={{ color: kindMeta[selected.kind].color }}
              >
                <Icon size={28} strokeWidth={1.4} />
              </span>
              <h2>{selected.name}</h2>
              {props.level === "developer" && (
                <span className="detail-tech">{selected.technology}</span>
              )}
            </div>
            <section className="inspector-section">
              <p>{selected.purpose[props.level]}</p>
            </section>
            {props.mode === "domain" && (
              <section className="inspector-section">
                <h3>
                  Fields
                  <span className="count-label">
                    {(selected as DomainEntity).fields.length}
                  </span>
                </h3>
                <div className="inspector-fields">
                  {(selected as DomainEntity).fields.map((field) => (
                    <div key={field.name}>
                      <code>
                        {field.name}
                        {field.primary && (
                          <small title="Primary key: identifies one record">
                            PK
                          </small>
                        )}
                        {field.foreign && (
                          <small title="Foreign key: points to another record">
                            FK
                          </small>
                        )}
                      </code>
                      <span>{field.type}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="inspector-section">
              <h3>
                Source files
                <span className="count-label">{selected.files.length}</span>
              </h3>
              <div className="source-file-list">
                {selected.files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => props.onSource(file)}
                    title={file.path}
                  >
                    <FileCode2 size={15} />
                    <span>{file.path}</span>
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            </section>
            <section className="inspector-section">
              <h3>
                Connections
                <span className="count-label">{relationships.length}</span>
              </h3>
              {relationships.length ? (
                <div className="connection-list">
                  {relationships.map((relationship) => {
                    const incoming = relationship.target === selected.id;
                    const otherId = incoming
                      ? relationship.source
                      : relationship.target;
                    const other =
                      componentById[otherId] ??
                      domainEntities.find((e) => e.id === otherId)!;
                    return (
                      <button
                        aria-label={`${other.name} ${incoming ? "Incoming" : "Outgoing"} ${relationship.label}`}
                        key={relationship.id}
                        onClick={() => props.onSelect(otherId)}
                      >
                        <span className="connection-direction">
                          {incoming ? (
                            <ArrowDownLeft size={15} />
                          ) : (
                            <ArrowUpRight size={15} />
                          )}
                        </span>
                        <span>
                          <strong>{other.name}</strong>
                          <small>{relationship.label}</small>
                        </span>
                        <ChevronRight size={12} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">No connections here.</p>
              )}
            </section>
            <details className="implementation-details" key={selected.id}>
              <summary>
                Implementation
                <ChevronRight size={13} />
              </summary>
              <section className="inspector-section">
                <h3>
                  {props.mode === "domain" ? "Query example" : "Entry points"}
                  <Braces size={13} />
                </h3>
                <div className="entry-points">
                  {selected.functions.map((fn) => (
                    <code key={fn}>{fn}</code>
                  ))}
                </div>
              </section>
              <section className="inspector-section snippet-section">
                <h3>
                  In the source
                  <button
                    className="text-button"
                    onClick={() => props.onSource(selected.files[0])}
                  >
                    Open file
                    <ArrowUpRight size={12} />
                  </button>
                </h3>
                <CodePreview file={selected.files[0]} limit={7} />
              </section>
            </details>
          </>
        ) : null}
      </div>
      {!props.workflow && selected && (
        <div className="inspector-footer">
          {selected.children?.length && props.mode === "map" ? (
            <button
              className="primary-button explore-button"
              onClick={() => props.onExplore(selected.id)}
            >
              <Layers3 size={16} />
              Explore deeper
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              className="secondary-button explore-button"
              onClick={() => props.onSource(selected.files[0])}
            >
              <FileCode2 size={16} />
              Explore source
              <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
