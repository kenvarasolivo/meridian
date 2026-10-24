"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, {
  type ForceGraphMethods,
  type GraphData,
  type LinkObject,
} from "react-force-graph-3d";
import { Color, Group, Mesh, MeshBasicMaterial, SphereGeometry } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import SpriteText from "three-spritetext";
import { useReducedMotion } from "framer-motion";
import { Crosshair, Maximize, Minus, Plus, RotateCcw, X } from "lucide-react";
import { getAtlasFocus, type AtlasLink, type AtlasPoint } from "@/lib/atlas";
import { getChangeImpact } from "@/lib/impact";
import { rootComponents } from "@/data/application";
import { AtlasFallback, type AtlasViewProps } from "./atlas-view";

type SceneLink = Omit<AtlasLink, "source" | "target"> & {
  source: string | AtlasPoint;
  target: string | AtlasPoint;
};
type GraphMethods = ForceGraphMethods<AtlasPoint, SceneLink>;
const endpoint = (point: string | AtlasPoint) =>
  typeof point === "string" ? point : point.id;
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

export default function AtlasEngine({
  model,
  intent,
  selectedId,
  focusedIds,
  onSelect,
  onSource,
  onMap,
  onReset,
}: AtlasViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const graph = useRef<GraphMethods | undefined>(undefined);
  const nodeMeshes = useRef(new Map<string, Mesh<SphereGeometry, MeshBasicMaterial>>());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const data = useMemo<GraphData<AtlasPoint, SceneLink>>(
    () => ({
      nodes: model.nodes.map((node) => ({ ...node })),
      links: model.links.map((link) => ({ ...link })),
    }),
    [model],
  );
  const impact = useMemo(
    () =>
      intent === "impact" && selectedId
        ? getChangeImpact(model, selectedId)
        : null,
    [model, intent, selectedId],
  );
  const direct = useMemo(
    () => new Set(impact?.direct.map((node) => node.id) ?? []),
    [impact],
  );
  const active = useMemo(
    () =>
      impact
        ? new Set([impact.targetId, ...impact.affectedIds])
        : getAtlasFocus(model, selectedId, focusedIds),
    [model, selectedId, focusedIds, impact],
  );
  const focused = active.size > 0;
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [unavailable, setUnavailable] = useState(false);
  const [hint, setHint] = useState(true);
  const duration = reducedMotion ? 0 : 650;
  const ready = size.width > 0 && size.height > 0;

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    observer.observe(container.current);
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2");
      if (!context) setUnavailable(true);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setUnavailable(true);
    }
    return () => observer.disconnect();
  }, []);

  const fit = useCallback(() => {
    graph.current?.zoomToFit(duration, 65);
  }, [duration]);
  const home = useCallback(() => {
    onReset();
    graph.current?.cameraPosition(
      { x: 25, y: 15, z: 780 },
      { x: 0, y: 0, z: 0 },
      duration,
    );
    window.setTimeout(
      () => graph.current?.zoomToFit(duration, 65),
      reducedMotion ? 0 : 100,
    );
  }, [onReset, duration, reducedMotion]);

  useEffect(() => {
    if (!ready || !graph.current) return;
    const api = graph.current;
    api.d3Force("center", null);
    api.d3Force("charge")?.strength(-9);
    api
      .d3Force("link")
      ?.distance((link: SceneLink) =>
        link.kind === "dependency" ? 170 : link.kind === "import" ? 85 : 42,
      )
      .strength((link: SceneLink) =>
        link.kind === "contains" ? 0.19 : link.kind === "source" ? 0.07 : 0.015,
      );
    api.d3Force("clusters", (alpha: number) => {
      for (const node of data.nodes) {
        if (node.kind === "module") continue;
        const center = data.nodes.find((point) => point.id === node.moduleId)!;
        node.vx = (node.vx ?? 0) + (center.x! - node.x!) * alpha * 0.06;
        node.vy = (node.vy ?? 0) + (center.y! - node.y!) * alpha * 0.06;
        node.vz = (node.vz ?? 0) + (center.z! - node.z!) * alpha * 0.06;
      }
    });
    const controls = api.controls() as OrbitControls;
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.12;
    controls.minDistance = 65;
    controls.maxDistance = 1800;
    api.cameraPosition({ x: 25, y: 15, z: 780 }, { x: 0, y: 0, z: 0 }, 0);
    if (!reducedMotion) api.d3ReheatSimulation();
    const timer = window.setTimeout(() => api.zoomToFit(0, 65), 180);
    return () => window.clearTimeout(timer);
  }, [ready, data, reducedMotion]);

  useEffect(() => {
    if (!ready || !graph.current) return;
    const timer = window.setTimeout(() => {
      if (!selectedId && !focusedIds.length) {
        graph.current?.zoomToFit(duration, 65);
        return;
      }
      if (active.size === 1) {
        const center = data.nodes.find((node) => node.id === selectedId);
        if (center)
          graph.current?.cameraPosition(
            { x: center.x! + 20, y: center.y! + 20, z: center.z! + 300 },
            { x: center.x!, y: center.y!, z: center.z! },
            duration,
          );
        return;
      }
      graph.current?.zoomToFit(duration, 65, (node) => active.has(node.id));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    selectedId,
    focusedIds,
    ready,
    size.width,
    size.height,
    active,
    data,
    duration,
  ]);

  const nodeObject = useCallback(
    (node: AtlasPoint) => {
      const isActive = !focused || active.has(node.id);
      const group = new Group();
      const radius =
        impact?.targetId === node.id && node.kind === "file"
          ? 4.2
          : node.kind === "module"
            ? Math.min(6.8, 3.7 + node.connections * 0.15)
            : node.kind === "component"
              ? 2.6
              : 2;
      const color = new Color(node.color);
      if (node.kind === "file") color.multiplyScalar(0.82);
      if (impact && isActive)
        color.set(
          node.id === impact.targetId
            ? "#eeefe9"
            : direct.has(node.id)
              ? "#75d9ad"
              : "#7b9b89",
        );
      const sphere = new Mesh(
        new SphereGeometry(radius, 18, 12),
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity: isActive
            ? impact && node.id !== impact.targetId && !direct.has(node.id)
              ? 0.7
              : 0.96
            : 0.08,
          depthWrite: isActive,
        }),
      );
      nodeMeshes.current.set(node.id, sphere);
      group.add(sphere);
      if (node.kind === "module" || impact?.targetId === node.id) {
        const label = new SpriteText(
          node.file ? node.name.split("/").at(-1)! : node.name,
        );
        label.color = isActive
          ? impact && node.id !== impact.targetId
            ? direct.has(node.id)
              ? "#a4e8c7"
              : "#8aa593"
            : "#e8ece3"
          : "#586052";
        label.fontFace = "Public Sans Variable, Arial, sans-serif";
        label.fontSize = 60;
        label.fontWeight = "400";
        label.textHeight = 0.018;
        label.material.sizeAttenuation = false;
        label.position.set(0, 15, 0);
        label.material.depthTest = false;
        label.renderOrder = 2;
        group.add(label);
      }
      return group;
    },
    [active, focused, impact, direct],
  );

  useEffect(() => {
    let frame = 0;
    let previousTime = performance.now();
    const animate = (time: number) => {
      const blend = reducedMotion ? 1 : 1 - Math.exp(-(time - previousTime) / 75);
      previousTime = time;
      let moving = false;
      for (const [id, mesh] of nodeMeshes.current) {
        const target = id === hoveredId ? 1.9 : 1;
        const scale = mesh.scale.x + (target - mesh.scale.x) * blend;
        const settled = Math.abs(target - scale) < 0.001;
        mesh.scale.setScalar(settled ? target : scale);
        moving ||= !settled;
      }
      if (moving) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hoveredId, reducedMotion, nodeObject]);

  const isHoveredLink = useCallback(
    (link: LinkObject<AtlasPoint, SceneLink>) =>
      hoveredId !== null &&
      (endpoint(link.source as string | AtlasPoint) === hoveredId ||
        endpoint(link.target as string | AtlasPoint) === hoveredId) &&
      (!impact || impact.linkIds.has(link.id)) &&
      (!focused ||
        (active.has(endpoint(link.source as string | AtlasPoint)) &&
          active.has(endpoint(link.target as string | AtlasPoint)))),
    [hoveredId, impact, focused, active],
  );

  const linkColor = useCallback(
    (link: LinkObject<AtlasPoint, SceneLink>) => {
      const a = endpoint(link.source as string | AtlasPoint);
      const b = endpoint(link.target as string | AtlasPoint);
      if (isHoveredLink(link)) return "#b3efd1";
      if (impact)
        return impact.linkIds.has(link.id)
          ? direct.has(a)
            ? "#75d9ad"
            : "#7b9b89"
          : "#32382f";
      if (focused)
        return active.has(a) && active.has(b) ? "#75d9ad" : "#3a4037";
      return link.kind === "dependency"
        ? "#8a9682"
        : link.kind === "import"
          ? "#64715e"
          : "#64715e";
    },
    [active, focused, impact, direct, isHoveredLink],
  );

  function zoom(factor: number) {
    const api = graph.current;
    if (!api) return;
    const target = (api.controls() as OrbitControls).target;
    const position = api
      .camera()
      .position.clone()
      .sub(target)
      .multiplyScalar(factor)
      .add(target);
    api.cameraPosition(
      { x: position.x, y: position.y, z: position.z },
      { x: target.x, y: target.y, z: target.z },
      reducedMotion ? 0 : 200,
    );
  }

  if (unavailable) return <AtlasFallback onSelect={onSelect} onMap={onMap} />;
  return (
    <div
      className="atlas-canvas"
      ref={container}
      onPointerLeave={() => setHoveredId(null)}
      role="region"
      aria-label="3D codebase atlas. Drag to orbit, scroll to zoom, and select a module or file."
    >
      {ready && (
        <ForceGraph3D<AtlasPoint, SceneLink>
          ref={graph}
          graphData={data}
          width={size.width}
          height={size.height}
          backgroundColor="#1c1e1b"
          controlType="orbit"
          showNavInfo={false}
          nodeThreeObject={nodeObject}
          nodeLabel={(node) =>
            `<span class="atlas-tooltip">${escape(node.name)}${node.kind === "file" ? `<small>${intent === "impact" ? "Trace dependents" : "Open source"}</small>` : ""}</span>`
          }
          linkColor={linkColor}
          linkOpacity={0.4}
          linkWidth={(link) =>
            isHoveredLink(link) ? 1.3 : link.kind === "dependency" ? 0.55 : 0.12
          }
          linkDirectionalArrowLength={(link) =>
            !impact && focused && link.kind === "dependency" ? 3 : 0
          }
          linkDirectionalArrowRelPos={0.88}
          linkDirectionalArrowColor="#75d9ad"
          onNodeClick={(node) => {
            if (node.file && intent === "explore") onSource(node.file);
            else if (node.file) onSelect(node.id);
            else if (node.componentId) onSelect(node.componentId);
          }}
          onNodeHover={(node) => {
            setHoveredId(node?.id ?? null);
            if (container.current)
              container.current.style.cursor = node ? "pointer" : "grab";
          }}
          onBackgroundClick={() => onSelect(null)}
          enableNodeDrag={false}
          warmupTicks={reducedMotion ? 0 : 30}
          cooldownTicks={reducedMotion ? 0 : 95}
          d3VelocityDecay={0.5}
        />
      )}
      <div className="atlas-caption">
        <span>
          {rootComponents.length} modules<span>·</span>
          {model.nodes.filter((node) => node.kind === "file").length} files
        </span>
      </div>
      <div className="canvas-controls atlas-controls">
        <button
          onClick={() => zoom(1.2)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus size={16} />
        </button>
        <button onClick={() => zoom(0.82)} aria-label="Zoom in" title="Zoom in">
          <Plus size={16} />
        </button>
        <span className="control-divider" />
        <button
          onClick={fit}
          aria-label="Fit atlas to view"
          title="Fit to view"
        >
          <Maximize size={15} />
        </button>
        <span className="control-divider" />
        <button onClick={home} aria-label="Reset atlas" title="Reset view">
          <RotateCcw size={15} />
        </button>
      </div>
      {hint && !selectedId && (
        <div className="atlas-hint">
          <span>
            {intent === "impact"
              ? "Select a module or file to trace dependents."
              : "Drag to orbit. Select a module to focus."}
          </span>
          <button
            onClick={() => setHint(false)}
            aria-label="Dismiss atlas hint"
          >
            <X size={13} />
          </button>
        </div>
      )}
      {selectedId && (
        <button className="atlas-show-all" onClick={home}>
          <Crosshair size={13} />
          Show all
        </button>
      )}
      <div className="atlas-keyboard-modules" aria-label="Atlas modules">
        {rootComponents.map((module) => (
          <button key={module.id} onClick={() => onSelect(module.id)}>
            {module.name}
          </button>
        ))}
      </div>
    </div>
  );
}
