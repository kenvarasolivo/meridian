"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, {
  type ForceGraphMethods,
  type GraphData,
} from "react-force-graph-3d";
import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  Spherical,
  Vector3,
} from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import SpriteText from "three-spritetext";
import { useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  FileCode2,
  Maximize,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { getAtlasFocus, type AtlasLink, type AtlasPoint } from "@/lib/atlas";
import { globeArc, globePosition } from "@/lib/globe";
import { getChangeImpact } from "@/lib/impact";
import { AtlasFallback, type AtlasViewProps } from "./atlas-view";

type SceneLink = Omit<AtlasLink, "source" | "target"> & {
  source: string | AtlasPoint;
  target: string | AtlasPoint;
};
type GraphMethods = ForceGraphMethods<AtlasPoint, SceneLink>;
const endpoint = (node: string | AtlasPoint) =>
  typeof node === "string" ? node : node.id;
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

/** A stable globe: data locations stay fixed while the visitor orbits the camera. */
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
  const labels = useRef(
    new Map<string, { label: SpriteText; point: AtlasPoint }>(),
  );
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [unavailable, setUnavailable] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 600;
  const ready = size.width > 0 && size.height > 0;
  const data = useMemo<GraphData<AtlasPoint, SceneLink>>(
    () => ({
      nodes: model.nodes.map((node) => ({ ...node })),
      links: model.links.map((link) => ({ ...link })),
    }),
    [model],
  );
  const points = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node])),
    [data],
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
  const visible = useCallback(
    (node: AtlasPoint) =>
      node.kind === "module" || showFiles || active.has(node.id),
    [active, showFiles],
  );
  const visibleCount = data.nodes.filter(
    (node) => visible(node) && node.kind === "file",
  ).length;

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      }),
    );
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

  const viewingDistance = useCallback(() => {
    const fov =
      (graph.current?.camera() as PerspectiveCamera | undefined)?.fov ?? 50;
    return Math.max(
      520,
      235 /
        Math.sin((fov * Math.PI) / 360) /
        Math.min(
          1,
          Math.max(150, size.height - 110) / Math.max(1, size.height),
          Math.max(200, size.width - 65) / Math.max(1, size.height),
        ),
    );
  }, [size]);
  const fit = useCallback(() => {
    const api = graph.current;
    if (!api) return;
    const direction = api
      .camera()
      .position.clone()
      .normalize()
      .multiplyScalar(viewingDistance());
    api.cameraPosition(direction, { x: 0, y: 0, z: 0 }, duration);
  }, [viewingDistance, duration]);
  const home = useCallback(() => {
    onReset();
    setShowFiles(false);
    graph.current?.cameraPosition(
      { x: 0, y: 20, z: viewingDistance() },
      { x: 0, y: 0, z: 0 },
      duration,
    );
  }, [duration, viewingDistance, onReset]);

  useEffect(() => {
    const api = graph.current;
    if (!ready || !api) return;
    api.d3Force("center", null);
    api.d3Force("charge", null);
    api.d3Force("link", null);
    const controls = api.controls() as OrbitControls;
    controls.enablePan = false;
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.1;
    controls.minDistance = 290;
    controls.maxDistance = 1800;
    const updateLabels = () => {
      const cameraDirection = api.camera().position.clone().normalize();
      for (const { label, point } of labels.current.values()) {
        label.visible =
          cameraDirection.dot(
            new Vector3(point.x, point.y, point.z).normalize(),
          ) > 0.06;
      }
    };
    controls.addEventListener("change", updateLabels);
    api.cameraPosition({ x: 0, y: 20, z: 700 }, { x: 0, y: 0, z: 0 }, 0);
    const globe = new Group();
    globe.name = "Meridian globe (decorative coordinate grid)";
    globe.add(
      new Mesh(
        new SphereGeometry(179, 64, 48),
        new MeshPhongMaterial({
          color: "#10253e",
          specular: "#203952",
          shininess: 8,
        }),
      ),
    );
    const gridMaterial = new LineBasicMaterial({
      color: "#507ca7",
      transparent: true,
      opacity: 0.22,
    });
    for (let lng = -180; lng < 180; lng += 20) {
      const coords = Array.from(
        { length: 91 },
        (_, i) => new Vector3(...globePosition(-90 + i * 2, lng, 180)),
      );
      globe.add(
        new Line(new BufferGeometry().setFromPoints(coords), gridMaterial),
      );
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const coords = Array.from(
        { length: 120 },
        (_, i) => new Vector3(...globePosition(lat, i * 3, 180)),
      );
      globe.add(
        new LineLoop(new BufferGeometry().setFromPoints(coords), gridMaterial),
      );
    }
    const dots = [];
    for (let i = 0; i < 1900; i++) {
      const y = 1 - (i / 1899) * 2,
        radius = Math.sqrt(1 - y * y),
        angle = i * Math.PI * (3 - Math.sqrt(5));
      dots.push(
        Math.cos(angle) * radius * 180.3,
        y * 180.3,
        Math.sin(angle) * radius * 180.3,
      );
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(dots, 3));
    globe.add(
      new Points(
        geometry,
        new PointsMaterial({
          color: "#8db8e5",
          size: 0.65,
          transparent: true,
          opacity: 0.5,
          sizeAttenuation: true,
        }),
      ),
    );
    api.scene().add(globe);
    const light = new DirectionalLight("#bfdcff", 1.6);
    light.position.set(-200, 300, 400);
    api.lights([new AmbientLight("#b2cae8", 1.1), light]);
    return () => {
      controls.removeEventListener("change", updateLabels);
      api.scene().remove(globe);
      globe.traverse((object) => {
        if (
          object instanceof Mesh ||
          object instanceof Line ||
          object instanceof Points
        ) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [ready, reducedMotion]);

  useEffect(() => {
    if (!ready || !graph.current) return;
    const node = selectedId ? points.get(selectedId) : undefined;
    const direction = node
      ? new Vector3(node.x, node.y, node.z)
      : new Vector3(0, 20, viewingDistance());
    direction.normalize().multiplyScalar(viewingDistance());
    graph.current.cameraPosition(direction, { x: 0, y: 0, z: 0 }, duration);
  }, [selectedId, ready, points, viewingDistance, duration]);

  const nodeObject = useCallback(
    (node: AtlasPoint) => {
      const group = new Group();
      const isActive = !focused || active.has(node.id);
      const selected = selectedId === node.id;
      const module = node.kind === "module";
      const color = selected
        ? "#eff7ff"
        : impact && isActive
          ? direct.has(node.id)
            ? "#a5d0ff"
            : "#7596bc"
          : module
            ? node.color
            : "#a4c4ea";
      group.add(
        new Mesh(
          new SphereGeometry(
            selected ? 5.3 : module ? 4.1 : node.kind === "file" ? 1.9 : 2.5,
            20,
            14,
          ),
          new MeshBasicMaterial({
            color,
            transparent: true,
            opacity: isActive ? 1 : 0.32,
          }),
        ),
      );
      if (module || selected) {
        const ring = new Mesh(
          new RingGeometry(selected ? 7 : 6, selected ? 8 : 6.5, 40),
          new MeshBasicMaterial({
            color: selected ? "#b4d8ff" : node.color,
            transparent: true,
            opacity: isActive ? 0.65 : 0.2,
            side: 2,
          }),
        );
        ring.quaternion.setFromUnitVectors(
          new Vector3(0, 0, 1),
          new Vector3(node.x, node.y, node.z).normalize(),
        );
        group.add(ring);
        const label = new SpriteText(
          node.file ? node.name.split("/").at(-1)! : node.name,
        );
        label.fontFace = "Public Sans Variable, Arial, sans-serif";
        label.fontWeight = "500";
        label.fontSize = 60;
        label.color = isActive ? "#e0ecfc" : "#889bb3";
        label.backgroundColor = selected ? "#2a4562" : "#14263a";
        label.padding = [0.009, 0.005];
        label.borderRadius = 0.004;
        label.textHeight = 0.019;
        label.material.sizeAttenuation = false;
        label.material.depthTest = false;
        label.renderOrder = 4;
        label.position.set(0, 13, 0);
        label.visible =
          !graph.current ||
          graph.current
            .camera()
            .position.clone()
            .normalize()
            .dot(new Vector3(node.x, node.y, node.z).normalize()) > 0.06;
        labels.current.set(node.id, { label, point: node });
        group.add(label);
      }
      return group;
    },
    [active, direct, focused, impact, selectedId],
  );

  const linkObject = useCallback(
    (link: SceneLink) => {
      const a = points.get(endpoint(link.source))!,
        b = points.get(endpoint(link.target))!;
      const highlighted = impact
        ? impact.linkIds.has(link.id)
        : focused
          ? active.has(a.id) && active.has(b.id)
          : false;
      const hovered = hoveredId === a.id || hoveredId === b.id;
      const geometry = new BufferGeometry().setFromPoints(
        globeArc(
          [a.x, a.y, a.z],
          [b.x, b.y, b.z],
          link.kind === "dependency" ? 32 : 9,
        ).map((point) => new Vector3(...point)),
      );
      return new Line(
        geometry,
        new LineBasicMaterial({
          color: highlighted || hovered ? "#b4d5ff" : "#6b98ca",
          transparent: true,
          opacity: hovered
            ? 0.9
            : highlighted
              ? impact
                ? 0.9
                : link.kind === "contains"
                  ? 0.26
                  : link.kind === "source"
                    ? 0.48
                    : 0.7
              : focused
                ? 0.12
                : 0.5,
        }),
      );
    },
    [points, focused, active, hoveredId, impact],
  );

  function zoom(factor: number) {
    const api = graph.current;
    if (!api) return;
    const position = api
      .camera()
      .position.clone()
      .multiplyScalar(factor)
      .clampLength(290, 1800);
    api.cameraPosition(position, { x: 0, y: 0, z: 0 }, reducedMotion ? 0 : 200);
  }
  function rotate(angle: number) {
    const api = graph.current;
    if (!api) return;
    const position = api
      .camera()
      .position.clone()
      .applyAxisAngle(new Vector3(0, 1, 0), angle);
    api.cameraPosition(position, { x: 0, y: 0, z: 0 }, reducedMotion ? 0 : 200);
  }
  function tilt(angle: number) {
    const api = graph.current;
    if (!api) return;
    const spherical = new Spherical().setFromVector3(api.camera().position);
    spherical.phi = Math.max(
      0.12,
      Math.min(Math.PI - 0.12, spherical.phi + angle),
    );
    api.cameraPosition(
      new Vector3().setFromSpherical(spherical),
      { x: 0, y: 0, z: 0 },
      reducedMotion ? 0 : 200,
    );
  }
  if (unavailable) return <AtlasFallback onSelect={onSelect} onMap={onMap} />;
  return (
    <div
      className="atlas-canvas"
      ref={container}
      tabIndex={0}
      role="region"
      aria-label="3D codebase globe. Drag to rotate, scroll to zoom. Arrow keys rotate; plus and minus zoom; Home resets."
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (
          [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "+",
            "=",
            "-",
            "Home",
          ].includes(event.key)
        )
          event.preventDefault();
        if (event.key === "ArrowLeft") rotate(-0.25);
        if (event.key === "ArrowRight") rotate(0.25);
        if (event.key === "ArrowUp") tilt(-0.2);
        if (event.key === "ArrowDown") tilt(0.2);
        if (event.key === "+" || event.key === "=") zoom(0.85);
        if (event.key === "-") zoom(1.18);
        if (event.key === "Home") home();
      }}
    >
      {ready && (
        <ForceGraph3D<AtlasPoint, SceneLink>
          ref={graph}
          graphData={data}
          width={size.width}
          height={size.height}
          backgroundColor="#0b1522"
          controlType="orbit"
          showNavInfo={false}
          nodeVisibility={visible}
          nodeThreeObject={nodeObject}
          nodeLabel={(node) =>
            `<span class="atlas-tooltip">${escape(node.name)}<small>${node.file ? (intent === "impact" ? "Trace dependents" : "Open source") : "Select to look inside"}</small></span>`
          }
          linkVisibility={(link) =>
            visible(points.get(endpoint(link.source))!) &&
            visible(points.get(endpoint(link.target))!)
          }
          linkThreeObject={linkObject}
          linkPositionUpdate={() => true}
          onNodeClick={(node) => {
            if (node.file && intent === "explore") onSource(node.file);
            else onSelect(node.id);
          }}
          onNodeHover={(node) => {
            setHoveredId(node?.id ?? null);
            if (container.current)
              container.current.style.cursor = node ? "pointer" : "grab";
          }}
          onBackgroundClick={() => onSelect(null)}
          enableNodeDrag={false}
          warmupTicks={0}
          cooldownTicks={0}
        />
      )}
      <div className="atlas-scene-top">
        <span>
          <i /> {focused ? "Focused connections" : "System overview"}
        </span>
        <button
          className={showFiles ? "is-active" : ""}
          onClick={() => setShowFiles((value) => !value)}
          aria-pressed={showFiles}
        >
          <FileCode2 size={14} />
          {showFiles ? "Hide files" : "Show all files"}
        </button>
      </div>
      <div className="canvas-controls atlas-controls">
        <button
          onClick={() => rotate(-0.25)}
          aria-label="Rotate atlas left"
          title="Rotate left"
        >
          <ArrowLeft size={15} />
        </button>
        <button
          onClick={() => rotate(0.25)}
          aria-label="Rotate atlas right"
          title="Rotate right"
        >
          <ArrowRight size={15} />
        </button>
        <span className="control-divider" />
        <button onClick={() => zoom(1.18)} aria-label="Zoom out">
          <Minus size={16} />
        </button>
        <button onClick={() => zoom(0.85)} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button onClick={fit} aria-label="Fit atlas to view">
          <Maximize size={15} />
        </button>
        <button onClick={home} aria-label="Reset atlas">
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="atlas-navigation-hint">
        Drag to rotate <span>·</span> Scroll to zoom
      </div>
      <div className="atlas-scene-foot">
        {visibleCount
          ? `${visibleCount} source files visible`
          : "Select a module to reveal its files"}
        {selectedId && (
          <button onClick={home}>
            <Crosshair size={13} /> Show all modules
          </button>
        )}
      </div>
    </div>
  );
}
