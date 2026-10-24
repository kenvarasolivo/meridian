"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { ChevronRight, KeyRound } from "lucide-react";
import { kindMeta } from "@/data/application";
import type { CodeComponent, DomainEntity } from "@/lib/types";
import { componentIcons } from "./icons";

export type ComponentNode = Node<
  {
    component: CodeComponent;
    dimmed: boolean;
    active: boolean;
    compact: boolean;
    workflowStep?: number;
    onExplore: (id: string) => void;
  },
  "component"
>;

export const ArchitectureNode = memo(function ArchitectureNode({
  data,
  selected,
}: NodeProps<ComponentNode>) {
  const {
    component: c,
    dimmed,
    active,
    compact,
    workflowStep,
    onExplore,
  } = data;
  const Icon = componentIcons[c.kind];
  const meta = kindMeta[c.kind];
  const entity = c as DomainEntity;
  return (
    <div
      title={`${c.name} · ${c.type} · ${c.technology}`}
      className={`architecture-node ${selected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""} ${active ? "is-path" : ""} ${compact ? "is-compact" : ""} ${entity.fields ? "entity-node" : ""}`}
      style={{ "--node-color": meta.color } as React.CSSProperties}
    >
      {[Position.Left, Position.Right, Position.Top, Position.Bottom].map(
        (position) => (
          <Handle
            key={position}
            id={position}
            type="source"
            position={position}
            isConnectable={false}
          />
        ),
      )}
      {workflowStep !== undefined && (
        <span className="node-step">{workflowStep + 1}</span>
      )}
      {!entity.fields && !compact && c.children?.length ? (
        <button
          className="nodrag node-drill"
          aria-label={`Explore inside ${c.name}`}
          title={`Explore ${c.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onExplore(c.id);
          }}
        >
          <ChevronRight size={14} />
        </button>
      ) : null}
      <div className="node-title">
        <Icon size={21} strokeWidth={1.65} />
        <span>{c.name}</span>
      </div>
      {!compact && <p className="node-description">{c.description}</p>}
      {entity.fields ? (
        <div className="entity-fields">
          {entity.fields.map((field) => (
            <div key={field.name}>
              <span>
                {field.primary || field.foreign ? (
                  <span
                    title={
                      field.primary
                        ? "Primary key: uniquely identifies this record"
                        : "Foreign key: links to a record in another entity"
                    }
                    tabIndex={0}
                  >
                    <KeyRound
                      size={11}
                      className={field.primary ? "primary-key" : "foreign-key"}
                    />
                  </span>
                ) : (
                  <span className="field-dot">·</span>
                )}
                {field.name}
              </span>
              <span>{field.type}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});
