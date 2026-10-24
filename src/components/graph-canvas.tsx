"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  useNodesState,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import {
  ArrowLeft,
  ChevronRight,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { componentIcons } from "./icons";
import { kindMeta } from "@/data/application";
import { workflowById } from "@/data/workflows";
import { getGraphModel } from "@/lib/layout";
import type { ViewMode } from "@/lib/types";
import { ArchitectureNode, type ComponentNode } from "./architecture-node";
import { RoutedEdge } from "./routed-edge";

const nodeTypes = { component: ArchitectureNode };
const edgeTypes = { routed: RoutedEdge };
const proOptions = { hideAttribution: true };
const fitPadding = {
  top: "30px",
  bottom: "30px",
  left: "24px",
  right: "78px",
} as const;

interface Props {
  mode: ViewMode;
  scope: string[];
  selectedId: string | null;
  focusedIds: string[];
  workflowId: string | null;
  step: number;
  resetKey: number;
  onSelect: (id: string | null) => void;
  onExplore: (id: string) => void;
  onReset: () => void;
}

export function GraphCanvas(props: Props) {
  const { mode, scope, selectedId, focusedIds, workflowId, step, onExplore } =
    props;
  const model = useMemo(() => getGraphModel(mode, scope), [mode, scope]);
  const { fitView, zoomIn, zoomOut, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(1);
  const [hint, setHint] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<ComponentNode>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const duration = reducedMotion ? 0 : 420;
  const refit = useCallback(
    () =>
      fitView({
        padding: fitPadding,
        duration,
        maxZoom: 1.05,
        ...(focusedIds.length
          ? { nodes: focusedIds.map((id) => ({ id })) }
          : {}),
      }),
    [fitView, duration, focusedIds],
  );

  useEffect(() => {
    if (!container.current) return;
    let timer: number;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void refit();
      }, 80);
    });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [refit]);

  useEffect(() => {
    setNodes(
      model.components.map((component) => ({
        id: component.id,
        type: "component",
        ariaLabel: `${component.name}: ${component.description}. Press Enter to inspect.`,
        position: model.positions[component.id],
        data: {
          component,
          dimmed: false,
          active: false,
          compact: mode === "architecture",
          onExplore,
        },
      })),
    );
  }, [model, mode, setNodes, onExplore, props.resetKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refit();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [model, props.resetKey, refit]);

  const displayNodes = useMemo(() => {
    const steps = workflowId ? workflowById[workflowId].steps : [];
    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedId,
      data: {
        ...node.data,
        dimmed: focusedIds.length > 0 && !focusedIds.includes(node.id),
        active: focusedIds.includes(node.id),
        workflowStep:
          steps[step]?.componentId === node.id
            ? step
            : steps.some((s) => s.componentId === node.id)
              ? steps.findIndex((s) => s.componentId === node.id)
              : undefined,
      },
    }));
  }, [nodes, selectedId, focusedIds, workflowId, step]);

  const edges = useMemo<Edge[]>(
    () =>
      model.relationships.map((relationship) => {
        const highlighted = workflowId
          ? workflowById[workflowId].relationshipIds.includes(relationship.id)
          : focusedIds.length > 0 &&
            focusedIds.includes(relationship.source) &&
            focusedIds.includes(relationship.target);
        const dimmed = focusedIds.length > 0 && !highlighted;
        const start = model.positions[relationship.source];
        const end = model.positions[relationship.target];
        const sourceHandle =
          relationship.sourceHandle ??
          (end.y > start.y
            ? "bottom"
            : end.y < start.y
              ? "top"
              : end.x < start.x
                ? "left"
                : "right");
        const targetHandle =
          relationship.targetHandle ??
          (end.y > start.y
            ? "top"
            : end.y < start.y
              ? "bottom"
              : end.x < start.x
                ? "right"
                : "left");
        return {
          ...relationship,
          type:
            relationship.id === "api-database"
              ? "routed"
              : relationship.id === "jobs-database"
                ? "smoothstep"
                : "default",
          sourceHandle,
          targetHandle,
          animated: highlighted && !reducedMotion,
          className: `${highlighted ? "highlighted-edge" : ""} ${dimmed ? "dimmed-edge" : ""}`,
          style: {
            stroke: highlighted
              ? "var(--graph-edge-active, #75d9ad)"
              : "var(--graph-edge, #525952)",
            strokeWidth: highlighted ? 1.8 : 1.2,
          },
          label: relationship.label,
          labelStyle: {
            fill: highlighted
              ? "var(--graph-label-active, #9ae2bf)"
              : "var(--graph-label, #a4aaa3)",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
          },
          labelBgStyle: {
            fill: "var(--graph-label-ground, #1d1f1b)",
            fillOpacity: 1,
          },
          labelBgPadding: [7, 4] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: highlighted ? "#75d9ad" : "#636c63",
            width: 15,
            height: 15,
          },
        };
      }),
    [model, focusedIds, workflowId, mode, reducedMotion],
  );

  useEffect(() => {
    if (!selectedId || !focusedIds.length) return;
    const timer = window.setTimeout(() => {
      void fitView({
        nodes: focusedIds.map((id) => ({ id })),
        padding: fitPadding,
        duration,
        maxZoom: 1.05,
      });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [focusedIds, selectedId, fitView, duration, step]);

  return (
    <div
      className="graph-canvas"
      ref={container}
      role="region"
      aria-label={`${mode === "domain" ? "Domain entity" : "Application architecture"} interactive graph`}
      onKeyDownCapture={(event) => {
        const element = event.target as HTMLElement;
        if (
          element.classList.contains("react-flow__node") &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          event.stopPropagation();
          const id = element.dataset.id;
          if (id) props.onSelect(id);
        }
      }}
    >
      <ReactFlow<ComponentNode, Edge>
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => props.onSelect(node.id)}
        onNodeDoubleClick={(_, node) => {
          if (mode === "map") onExplore(node.id);
        }}
        onPaneClick={() => {
          if (!workflowId) props.onSelect(null);
        }}
        onMove={(_, viewport) => setZoom(viewport.zoom)}
        onInit={() => {
          setZoom(getZoom());
        }}
        fitView
        fitViewOptions={{ padding: fitPadding, maxZoom: 1.05 }}
        minZoom={0.35}
        maxZoom={1.7}
        nodesDraggable={mode === "map"}
        nodesConnectable={false}
        deleteKeyCode={null}
        edgesFocusable={false}
        connectionMode={ConnectionMode.Loose}
        selectionOnDrag={false}
        panOnScroll
        zoomOnScroll
        panOnDrag={true}
        proOptions={proOptions}
        colorMode="dark"
        aria-label="Codebase map. Select a component to inspect it."
        preventScrolling
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={23}
          size={1}
          color="#3c413b"
        />
      </ReactFlow>
      <div className="mobile-component-list">
        <div className="mobile-list-heading">
          <div>
            <strong>
              {mode === "domain"
                ? "Entities"
                : scope.length
                  ? "Components"
                  : "Components"}
            </strong>
          </div>
          <button
            className="icon-button"
            onClick={props.onReset}
            aria-label="Reset compact view"
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="mobile-list-scroll">
          {model.components.map((component) => {
            const Icon = componentIcons[component.kind];
            return (
              <div
                className={`mobile-component-row ${selectedId === component.id ? "selected" : ""} ${focusedIds.length && !focusedIds.includes(component.id) ? "dimmed" : ""}`}
                key={component.id}
              >
                <button onClick={() => props.onSelect(component.id)}>
                  <Icon
                    size={20}
                    style={{ color: kindMeta[component.kind].color }}
                  />
                  <span>
                    <strong>{component.name}</strong>
                    <small>{component.description}</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
                {component.children?.length && mode === "map" ? (
                  <button
                    className="mobile-drill"
                    onClick={() => onExplore(component.id)}
                    aria-label={`Explore inside ${component.name}`}
                  >
                    Explore
                    <ArrowLeft
                      size={12}
                      style={{ transform: "rotate(180deg)" }}
                    />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="canvas-controls">
        <button
          onClick={() => void zoomOut({ duration: reducedMotion ? 0 : 180 })}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus size={16} />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => void zoomIn({ duration: reducedMotion ? 0 : 180 })}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus size={16} />
        </button>
        <span className="control-divider" />
        <button
          onClick={() => void refit()}
          aria-label="Fit graph to view"
          title="Fit to view"
        >
          <Maximize size={15} />
        </button>
        <span className="control-divider" />
        <button
          onClick={props.onReset}
          aria-label="Reset graph"
          title="Reset map and positions"
        >
          <RotateCcw size={15} />
        </button>
      </div>
      {hint && !workflowId && !scope.length && (
        <div className="canvas-hint">
          <MousePointer2 size={14} />
          <span>Select a component to inspect it.</span>
          <button onClick={() => setHint(false)} aria-label="Dismiss map hint">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
