"use client";

import { useEffect, useRef } from "react";
import { relationships } from "@/data/application";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { globeLocations } from "@/lib/globe";

type Vector = [number, number, number];
const locations = globeLocations;

function sphere(lat: number, lng: number): Vector {
  const a = (lat * Math.PI) / 180,
    b = (lng * Math.PI) / 180;
  return [Math.cos(a) * Math.sin(b), -Math.sin(a), Math.cos(a) * Math.cos(b)];
}

/** A canvas illustration of the example modules, independent of the actual Atlas. */
export function CodeGlobe({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef({ yaw: 0, pitch: 0, touched: false });
  const activeRef = useRef(selected);
  const selectRef = useRef(onSelect);
  useEffect(() => {
    if (activeRef.current !== selected) {
      const location = locations.find((location) => location.id === selected);
      if (location)
        rotation.current = {
          yaw: (-location.lng * Math.PI) / 180,
          pitch: (-location.lat * Math.PI) / 180,
          touched: true,
        };
    }
    activeRef.current = selected;
  }, [selected]);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const points: Vector[] = [];
    for (let i = 0; i < 4400; i++) {
      const y = 1 - (i / 4399) * 2;
      const r = Math.sqrt(1 - y * y),
        phi = i * Math.PI * (3 - Math.sqrt(5));
      points.push([Math.cos(phi) * r, y, Math.sin(phi) * r]);
    }
    let frame = 0,
      last = 0,
      visible = true,
      paused = document.hidden;
    let targets: { id: string; x: number; y: number }[] = [];
    let dragging = false;
    let pointerId: number | null = null;
    let start = { x: 0, y: 0 },
      previous = { x: 0, y: 0 };
    let moved = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);
    const pause = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", pause);

    function render(time: number) {
      frame = requestAnimationFrame(render);
      if (!ctx || !canvas || !visible || paused || time - last < 33) return;
      const delta = last ? Math.min(time - last, 50) : 0;
      last = time;
      if (!reduced.matches && !dragging && !rotation.current.touched)
        rotation.current.yaw += delta * 0.000014;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(canvas.width / 800, 0, 0, canvas.height / 800, 0, 0);
      ctx.clearRect(0, 0, 800, 800);
      const cx = 400,
        cy = 396,
        radius = 276;
      function project(v: Vector) {
        const a = rotation.current.yaw,
          x = v[0] * Math.cos(a) + v[2] * Math.sin(a);
        const rawZ = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
        const pitch = rotation.current.pitch;
        const y = v[1] * Math.cos(pitch) - rawZ * Math.sin(pitch);
        const z = v[1] * Math.sin(pitch) + rawZ * Math.cos(pitch);
        const tilt = -0.13;
        return {
          x: cx + (x * Math.cos(tilt) - y * Math.sin(tilt)) * radius,
          y: cy + (x * Math.sin(tilt) + y * Math.cos(tilt)) * radius,
          z,
        };
      }
      const atmosphere = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.9,
        cx,
        cy,
        radius * 1.2,
      );
      atmosphere.addColorStop(0, "#266dff00");
      atmosphere.addColorStop(0.38, "#3a83ff30");
      atmosphere.addColorStop(0.53, "#276bff18");
      atmosphere.addColorStop(1, "#266dff00");
      ctx.fillStyle = atmosphere;
      ctx.fillRect(0, 0, 800, 800);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      const body = ctx.createRadialGradient(315, 225, 0, cx, cy, radius * 1.25);
      body.addColorStop(0, "#0b1c36");
      body.addColorStop(0.67, "#071a45");
      body.addColorStop(0.86, "#0849ba");
      body.addColorStop(1, "#70baff");
      ctx.fillStyle = body;
      ctx.fillRect(0, 0, 800, 800);
      const bottom = ctx.createRadialGradient(440, 700, 5, 430, 653, 310);
      bottom.addColorStop(0, "#559bff");
      bottom.addColorStop(0.35, "#125fffb0");
      bottom.addColorStop(1, "#125fff00");
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 0, 800, 800);
      ctx.lineWidth = 0.65;
      for (let lng = 0; lng < 180; lng += 20) {
        ctx.beginPath();
        for (let step = 0; step <= 180; step++) {
          const angle = (step * Math.PI) / 90;
          const v: Vector = [
            Math.sin(angle) * Math.sin((lng * Math.PI) / 180),
            Math.cos(angle),
            Math.sin(angle) * Math.cos((lng * Math.PI) / 180),
          ];
          const p = project(v);
          if (step === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "#7cafff16";
        ctx.stroke();
      }
      for (const point of points) {
        const p = project(point);
        const bright = Math.max(0, p.z);
        ctx.fillStyle = `rgba(165,201,255,${0.04 + bright * 0.65})`;
        ctx.fillRect(p.x, p.y, 0.65 + bright * 0.8, 0.65 + bright * 0.8);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#74acff75";
      ctx.lineWidth = 1;
      ctx.stroke();

      const nodes = locations.map((n) => ({ ...n, v: sphere(n.lat, n.lng) }));
      const active = nodes.find((n) => n.id === activeRef.current) ?? nodes[0];
      for (const edge of relationships) {
        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);
        if (!source || !target) continue;
        ctx.beginPath();
        for (let j = 0; j <= 65; j++) {
          const t = j / 65,
            lift = 1 + Math.sin(Math.PI * t) * 0.2;
          const v = source.v.map(
            (a, i) => a * (1 - t) + target.v[i] * t,
          ) as Vector;
          const length = Math.hypot(...v);
          const p = project(v.map((a) => (a / length) * lift) as Vector);
          if (j === 0 || p.z < 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle =
          source.id === active.id || target.id === active.id
            ? "#faab6bcc"
            : "#78adff60";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      targets = [];
      ctx.font = '500 13px "Public Sans Variable", Arial';
      for (const node of nodes) {
        const p = project(node.v),
          isActive = node.id === active.id;
        if (p.z < 0.05) continue;
        targets.push({
          id: node.id,
          x: (p.x / 800) * width,
          y: (p.y / 800) * height,
        });
        ctx.beginPath();
        ctx.arc(p.x, p.y, isActive ? 11 : 7, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? "#ffa66830" : "#97c4ff18";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, isActive ? 4 : 2.8, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? "#ffb27a" : "#c5ddff";
        ctx.fill();
        const textWidth = ctx.measureText(node.label).width;
        const labelX = p.x + (p.x < cx ? -textWidth - 22 : 15),
          labelY = p.y - 20;
        ctx.fillStyle = "#07101cdb";
        ctx.fillRect(labelX - 7, labelY - 14, textWidth + 14, 25);
        ctx.fillStyle = isActive ? "#ffc59d" : "#d4e4fc";
        ctx.fillText(node.label, labelX, labelY + 3);
      }
    }
    frame = requestAnimationFrame(render);
    const hit = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return targets.find(
        (t) =>
          Math.hypot(
            t.x - (event.clientX - rect.left),
            t.y - (event.clientY - rect.top),
          ) < 30,
      );
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || pointerId !== null) return;
      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      rotation.current.touched = true;
      start = previous = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (event: PointerEvent) => {
      if (dragging && event.pointerId === pointerId) {
        const dx = event.clientX - previous.x,
          dy = event.clientY - previous.y;
        const scale = 3.5 / Math.max(1, canvas.clientWidth);
        rotation.current.yaw += dx * scale;
        rotation.current.pitch = Math.max(
          -1.25,
          Math.min(1.25, rotation.current.pitch + dy * scale),
        );
        moved ||=
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5;
        previous = { x: event.clientX, y: event.clientY };
      } else canvas.style.cursor = hit(event) ? "pointer" : "grab";
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (event.type === "pointerup" && !moved) {
        const node = hit(event);
        if (node) selectRef.current(node.id);
      }
      dragging = false;
      pointerId = null;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      canvas.style.cursor = "grab";
    };
    const lost = () => {
      dragging = false;
      pointerId = null;
      canvas.style.cursor = "grab";
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("lostpointercapture", lost);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", pause);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
      canvas.removeEventListener("lostpointercapture", lost);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="code-globe"
        role="region"
        tabIndex={0}
        aria-label="Interactive code globe. Drag to rotate, or use the arrow keys. Press Home to reset."
        onKeyDown={(event) => {
          if (
            ![
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
            ].includes(event.key)
          )
            return;
          event.preventDefault();
          rotation.current.touched = true;
          if (event.key === "Home") {
            rotation.current.yaw = 0;
            rotation.current.pitch = 0;
          }
          if (event.key === "ArrowLeft") rotation.current.yaw -= 0.2;
          if (event.key === "ArrowRight") rotation.current.yaw += 0.2;
          if (event.key === "ArrowUp")
            rotation.current.pitch = Math.max(
              -1.25,
              rotation.current.pitch - 0.2,
            );
          if (event.key === "ArrowDown")
            rotation.current.pitch = Math.min(
              1.25,
              rotation.current.pitch + 0.2,
            );
        }}
      />
      <div className="landing-globe-controls" aria-label="Globe rotation">
        <span>Drag to explore</span>
        <button
          aria-label="Rotate globe left"
          onClick={() => {
            rotation.current.touched = true;
            rotation.current.yaw -= 0.3;
          }}
        >
          <ArrowLeft size={14} />
        </button>
        <button
          aria-label="Rotate globe right"
          onClick={() => {
            rotation.current.touched = true;
            rotation.current.yaw += 0.3;
          }}
        >
          <ArrowRight size={14} />
        </button>
        <button
          aria-label="Reset globe rotation"
          onClick={() => {
            rotation.current = { yaw: 0, pitch: 0, touched: true };
          }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </>
  );
}
