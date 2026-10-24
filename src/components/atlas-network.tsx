"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import type { AtlasModel, AtlasPoint } from "@/lib/atlas";
import { initialNetworkCamera, interpolateNetworkCamera, layoutAtlas, projectNetworkPoint, rotateNetwork, zoomNetwork, type NetworkCamera } from "@/lib/atlas-layout";
import { atlasNodeLabel, describeAtlasNode, getAtlasNeighborhood, getAtlasOverviewLinks } from "@/lib/atlas-discovery";

export type AtlasNetworkHandle = {
  zoom: (factor: number) => void;
  rotate: (yaw: number, pitch?: number) => void;
  reset: () => void;
  focus: (id: string) => void;
};

type Props = {
  ref?: Ref<AtlasNetworkHandle>;
  model: AtlasModel;
  selectedId: string | null;
  activeIds?: Set<string>;
  activeLinks?: Set<string>;
  showFiles?: boolean;
  interactiveWheel?: boolean;
  autoRotate?: boolean;
  showAllLinks?: boolean;
  onSelect: (node: AtlasPoint | null) => void;
  onUnavailable?: () => void;
};

/** A perspective-projected 3D network. No opaque globe or continuously running physics. */
export function AtlasNetwork({ ref, ...props }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef(props);
  const invalidate = useRef<() => void>(() => {});
  const camera = useRef<NetworkCamera>({ ...initialNetworkCamera });
  const flight = useRef<{ from: NetworkCamera; to: NetworkCamera; start: number; duration: number } | null>(null);
  const attentionUntil = useRef(0);
  const touched = useRef(false);
  const reset = useRef<() => void>(() => {});
  const layout = useMemo(() => layoutAtlas(props.model), [props.model]);
  const overview = useMemo(() => new Set(getAtlasOverviewLinks(props.model).map((link) => link.id)), [props.model]);
  const [hovered, setHovered] = useState<AtlasPoint | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const moveCamera = useCallback((to: NetworkCamera, duration = 720) => {
    touched.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      flight.current = null;
      camera.current = to;
    } else {
      flight.current = { from: { ...camera.current }, to, start: performance.now(), duration };
    }
    invalidate.current();
  }, []);
  const focusNode = useCallback((id: string) => {
    const node = layout.find((node) => node.id === id);
    if (!node) return;
    hoveredRef.current = null;
    setHovered(null);
    attentionUntil.current = performance.now() + 1400;
    moveCamera({
      yaw: -Math.atan2(node.x, node.z),
      pitch: Math.atan2(node.y, Math.hypot(node.x, node.z)),
      zoom: Math.max(1, camera.current.zoom),
    });
  }, [layout, moveCamera]);
  useEffect(() => {
    options.current = props;
    invalidate.current();
  }, [props]);
  useEffect(() => {
    if (props.selectedId) focusNode(props.selectedId);
  }, [props.selectedId, focusNode]);

  useImperativeHandle(ref, () => ({
    focus: focusNode,
    zoom(factor) {
      moveCamera(zoomNetwork(flight.current?.to ?? camera.current, factor), 260);
    },
    rotate(yaw, pitch = 0) {
      const target = flight.current?.to ?? camera.current;
      moveCamera({ ...target, yaw: target.yaw + yaw, pitch: Math.max(-1.35, Math.min(1.35, target.pitch + pitch)) }, 340);
    },
    reset: () => reset.current(),
  }), [focusNode, moveCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      options.current.onUnavailable?.();
      return;
    }
    let width = 0, height = 0, baseScale = 1, frame = 0, visible = true, last = 0;
    let disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointer: { id: number; x: number; y: number; startX: number; startY: number; moved: boolean } | null = null;
    let targets: { node: AtlasPoint; x: number; y: number; radius: number }[] = [];
    const nodeMotion = new Map<string, { focus: number; hover: number; selected: number }>();
    const linkOpacity = new Map<string, number>();
    function draw(time: number) {
      frame = 0;
      if (!canvas || !ctx || disposed || !visible || document.hidden || !width || !height) return;
      const spinning = options.current.autoRotate && !touched.current && !reduced.matches && !pointer && !hoveredRef.current && !flight.current;
      if (spinning && !flight.current && last && time - last < 40) { frame = requestAnimationFrame(draw); return; }
      const elapsed = Math.min(last ? time - last : 16, 64);
      let animating = false;
      const approach = (value: number, target: number) => {
        if (reduced.matches || Math.abs(value - target) < 0.002) return target;
        animating = true;
        return value + (target - value) * (1 - Math.exp(-elapsed / 65));
      };
      if (flight.current) {
        const { from, to, start, duration } = flight.current;
        const progress = reduced.matches ? 1 : (time - start) / duration;
        camera.current = interpolateNetworkCamera(from, to, progress);
        if (progress >= 1) flight.current = null;
        else animating = true;
      }
      if (spinning) camera.current.yaw += Math.min(last ? time - last : 0, 60) * 0.00008;
      last = time;
      const { selectedId, activeIds, activeLinks, showFiles = true } = options.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const project = (point: [number, number, number]) => {
        const p = projectNetworkPoint(point, camera.current);
        return { ...p, x: width / 2 + p.x * baseScale, y: height / 2 + p.y * baseScale };
      };
      const neighborhood = getAtlasNeighborhood(options.current.model, hoveredRef.current ?? selectedId);
      const emphasized = activeLinks ?? neighborhood.links;
      const focusIds = activeLinks ? activeIds : neighborhood.ids;
      const hasFocus = !!focusIds?.size;
      const projected = layout.map((node) => ({ node, ...project([node.x, node.y, node.z]) })).sort((a, b) => a.z - b.z);
      const byId = new Map(projected.map((p) => [p.node.id, p]));
      const shown = (node: AtlasPoint) => showFiles || node.kind !== "file" || activeIds?.has(node.id) || node.id === selectedId;
      const flowing = !reduced.matches && !pointer && (!!hoveredRef.current || (!!selectedId && time < attentionUntil.current));
      for (const { node } of projected) {
        const target = { focus: !hasFocus || focusIds?.has(node.id) ? 1 : 0, hover: node.id === hoveredRef.current ? 1 : 0, selected: node.id === selectedId ? 1 : 0 };
        const previous = nodeMotion.get(node.id) ?? { focus: 1, hover: 0, selected: 0 };
        nodeMotion.set(node.id, { focus: approach(previous.focus, target.focus), hover: approach(previous.hover, target.hover), selected: approach(previous.selected, target.selected) });
      }
      // Radial guides preserve the hollow ball's structure independently of dependencies.
      const center = project([0, 0, 0]);
      for (const point of projected) {
        if (!shown(point.node)) continue;
        const focus = nodeMotion.get(point.node.id)!.focus;
        const depth = Math.max(0, Math.min(1, (point.z + 220) / 440));
        ctx.strokeStyle = point.node.color;
        ctx.globalAlpha = 0.045 + focus * (0.075 + depth * 0.2);
        ctx.lineWidth = point.node.kind === "module" ? 0.9 : 0.65;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(center.x, center.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Edges first, so even the smallest file points always sit above their links.
      for (const [index, link] of options.current.model.links.entries()) {
        const from = byId.get(link.source)!;
        const to = byId.get(link.target)!;
        const highlight = emphasized.has(link.id);
        const hover = hoveredRef.current === from.node.id || hoveredRef.current === to.node.id;
        const depth = Math.max(0, Math.min(1, ((from.z + to.z) / 2 + 220) / 440));
        const sameGroup = from.node.moduleId === to.node.moduleId;
        ctx.strokeStyle = sameGroup ? from.node.color : "#a4b3c6";
        const visibleLink = shown(from.node) && shown(to.node) && (options.current.showAllLinks !== false || overview.has(link.id) || highlight);
        const targetOpacity = !visibleLink ? 0 : hover ? 0.85 : highlight ? 0.75 : hasFocus ? 0.04 : (sameGroup ? 0.28 : 0.09) + depth * 0.13;
        const opacity = approach(linkOpacity.get(link.id) ?? targetOpacity, targetOpacity);
        linkOpacity.set(link.id, opacity);
        if (opacity < 0.002) continue;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = highlight || hover ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (flowing && highlight && visibleLink) {
          const progress = (time / 1500 + index * 0.137) % 1;
          ctx.beginPath();
          ctx.arc(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = from.node.color;
          ctx.globalAlpha = opacity * Math.sin(progress * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      targets = [];
      const labelBoxes: { x: number; y: number; width: number; height: number }[] = [];
      for (const p of projected) {
        const { node } = p;
        if (!shown(node)) continue;
        const isSelected = node.id === selectedId;
        const isHovered = node.id === hoveredRef.current;
        const active = !hasFocus || focusIds?.has(node.id);
        const motion = nodeMotion.get(node.id)!;
        const emphasis = Math.max(motion.hover, motion.selected);
        const depth = Math.max(0, Math.min(1, (p.z + 220) / 440));
        const baseRadius = (node.kind === "module" ? 7 : node.kind === "component" ? 3.8 : 2.6) * (0.8 + depth * 0.3) * Math.min(1.4, Math.sqrt(camera.current.zoom));
        const radius = baseRadius * (1 + (reduced.matches ? 0 : emphasis * 0.3));
        // Wide, faint circular halos overlap into a soft field around the globe.
        // Keep the spread independent of node size so small files contribute equally.
        const glowRadius = Math.max(58, Math.min(width, height) * 0.16) * (1 + emphasis * 0.12);
        if (p.x < -glowRadius || p.x > width + glowRadius || p.y < -glowRadius || p.y > height + glowRadius) continue;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        glow.addColorStop(0, node.color);
        glow.addColorStop(0.18, `${node.color}b3`);
        glow.addColorStop(0.5, `${node.color}4d`);
        glow.addColorStop(0.8, `${node.color}0d`);
        glow.addColorStop(1, `${node.color}00`);
        ctx.save();
        ctx.globalAlpha = (0.015 + motion.focus * 0.095 + emphasis * 0.07) * (0.75 + depth * 0.25);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (emphasis > 0.002) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 3 + emphasis * 4, 0, Math.PI * 2);
          ctx.globalAlpha = emphasis;
          ctx.strokeStyle = isSelected ? "#eff7ff" : node.color;
          ctx.lineWidth = isSelected ? 1.5 : 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.globalAlpha = 0.18 + depth * 0.12 + motion.focus * (0.44 + depth * 0.26);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        targets.push({ node, x: p.x, y: p.y, radius: baseRadius });
        if ((node.kind === "module" && active) || isHovered || isSelected || (hasFocus && active && p.z > 0) || (camera.current.zoom > 1.8 && node.kind === "component" && p.z > 0)) {
          const text = atlasNodeLabel(node);
          ctx.font = `${node.kind === "module" ? 500 : 400} ${width < 450 ? 12 : node.kind === "module" ? 14 : 12}px "Public Sans Variable", sans-serif`;
          const textWidth = ctx.measureText(text).width;
          const group = projected.filter((other) => other.node.moduleId === node.moduleId);
          const positions = [
            ...(node.kind === "module" ? [
              { x: p.x - textWidth / 2, y: Math.min(...group.map((other) => other.y)) - 12 },
              { x: p.x - textWidth / 2, y: Math.max(...group.map((other) => other.y)) + 24 },
            ] : []),
            { x: p.x - textWidth / 2, y: p.y - radius - 10 },
            { x: p.x + radius + 10, y: p.y + 4 },
            { x: p.x - textWidth - radius - 10, y: p.y + 4 },
            { x: p.x - textWidth / 2, y: p.y + radius + 23 },
            { x: p.x - textWidth / 2, y: p.y - 36 },
            { x: p.x - textWidth / 2, y: p.y + 43 },
          ].map((position) => ({ ...position, x: Math.max(8, Math.min(width - textWidth - 8, position.x)) }));
          const position = positions.find((candidate) => {
            const box = { x: candidate.x - 4, y: candidate.y - 12, width: textWidth + 8, height: 18 };
            if (box.y < 2 || box.y + box.height > height - 2) return false;
            if (labelBoxes.some((b) => box.x < b.x + b.width && box.x + box.width > b.x && box.y < b.y + b.height && box.y + box.height > b.y)) return false;
            return !projected.some((other) => other.node.id !== node.id && shown(other.node) && other.x > box.x - 5 && other.x < box.x + box.width + 5 && other.y > box.y - 5 && other.y < box.y + box.height + 5);
          }) ?? (node.kind === "module" || isSelected || isHovered ? positions[0] : null);
          if (!position) continue;
          const { x, y } = position;
          const box = { x: x - 4, y: y - 12, width: textWidth + 8, height: 18 };
          labelBoxes.push(box);
          ctx.strokeStyle = "#060b12";
          ctx.lineWidth = 4;
          ctx.strokeText(text, x, y);
          ctx.fillStyle = isSelected || isHovered ? "#eff7ff" : node.kind === "module" ? node.color : active ? "#d3dfef" : "#8da5c5";
          ctx.fillText(text, x, y);
        }
      }
      if (spinning || animating || flowing) frame = requestAnimationFrame(draw);
    }
    const requestDraw = () => {
      if (!disposed && !frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    invalidate.current = requestDraw;
    reset.current = () => {
      hoveredRef.current = null;
      setHovered(null);
      moveCamera({ ...initialNetworkCamera });
    };
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Leave room for labels while letting the network fill its stage at every size.
      baseScale = Math.max(1, Math.min(width - 64, height - 80)) / 430;
      requestDraw();
    });
    resize.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestDraw();
    });
    intersection.observe(canvas);
    const visibility = () => { last = 0; requestDraw(); };
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", visibility);
    void document.fonts.ready.then(requestDraw);

    const hit = (x: number, y: number, touch = false) => {
      let closest: (typeof targets)[number] | null = null;
      let nearest = Infinity;
      for (const target of targets) {
        const distance = Math.hypot(target.x - x, target.y - y);
        if (distance < (touch ? 22 : 14) + target.radius && distance < nearest) {
          closest = target;
          nearest = distance;
        }
      }
      return closest?.node ?? null;
    };
    const point = (event: PointerEvent | WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const hover = (node: AtlasPoint | null) => {
      if (hoveredRef.current === (node?.id ?? null)) return;
      hoveredRef.current = node?.id ?? null;
      setHovered(node);
      requestDraw();
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || pointer) return;
      touched.current = true;
      flight.current = null;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false };
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId) {
        pointer.moved ||= Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 5;
        if (pointer.moved) {
          camera.current = rotateNetwork(camera.current, event.clientX - pointer.x, event.clientY - pointer.y, width);
          hover(null);
          requestDraw();
        }
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        canvas.style.cursor = "grabbing";
      } else {
        const p = point(event);
        const node = hit(p.x, p.y, event.pointerType === "touch");
        hover(node);
        canvas.style.cursor = node ? "pointer" : "grab";
      }
    };
    const up = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      if (!pointer.moved && event.type === "pointerup") {
        const p = point(event);
        options.current.onSelect(hit(p.x, p.y, event.pointerType === "touch"));
      }
      pointer = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.style.cursor = "grab";
    };
    const lost = () => { pointer = null; canvas.style.cursor = "grab"; };
    const leave = () => { if (!pointer) hover(null); };
    const wheel = (event: WheelEvent) => {
      // Landing pages keep normal wheel scrolling; explicit controls zoom the preview.
      if (!options.current.interactiveWheel) return;
      event.preventDefault();
      touched.current = true;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
      moveCamera(zoomNetwork(flight.current?.to ?? camera.current, Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002)), 180);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", lost);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", visibility);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", lost);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel);
      invalidate.current = () => {};
    };
  }, [layout, overview, moveCamera]);

  return (
    <div className="atlas-network">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="region"
        aria-label="3D codebase globe. Drag to rotate. Arrow keys rotate; plus and minus zoom; Home resets. Tab to browse nodes."
        style={{ touchAction: props.interactiveWheel ? "none" : "pan-y" }}
        onFocus={() => { touched.current = true; invalidate.current(); }}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home", "Escape"].includes(event.key)) return;
          event.preventDefault();
          touched.current = true;
          if (event.key === "Home") reset.current();
          if (event.key === "Escape") props.onSelect(null);
          const target = { ...(flight.current?.to ?? camera.current) };
          if (event.key === "ArrowLeft") target.yaw -= 0.2;
          if (event.key === "ArrowRight") target.yaw += 0.2;
          if (event.key === "ArrowUp") target.pitch = Math.max(-1.35, target.pitch - 0.2);
          if (event.key === "ArrowDown") target.pitch = Math.min(1.35, target.pitch + 0.2);
          if (["+", "=", "-"].includes(event.key)) moveCamera(zoomNetwork(target, event.key === "-" ? 1 / 1.2 : 1.2), 260);
          else if (event.key.startsWith("Arrow")) moveCamera(target, 340);
        }}
      >Connected modules, components, and source files in the example codebase.</canvas>
      <div className="network-node-browser" aria-label="Browse network nodes">
        {layout.filter((node) => props.showFiles !== false || node.kind !== "file" || props.activeIds?.has(node.id)).map((node) => (
          <button key={node.id} aria-pressed={props.selectedId === node.id} onClick={() => props.onSelect(node)}>{node.name}</button>
        ))}
      </div>
      {hovered && <div className="network-hover" key={hovered.id} role="status"><span>{hovered.kind === "file" ? "Source file" : hovered.kind === "module" ? "Module" : "Component"}</span><strong>{atlasNodeLabel(hovered)}</strong><p>{describeAtlasNode(hovered)}</p></div>}
    </div>
  );
}
