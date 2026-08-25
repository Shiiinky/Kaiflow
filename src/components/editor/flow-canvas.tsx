import { useEffect, useRef, useState } from "react";
import { NodeCard } from "./node-card";
import { NODE_H, NODE_W } from "@/lib/flow/blocks";
import type { Connection, FlowNode } from "@/lib/flow/types";

function port(node: FlowNode, side: "in" | "out", scale: number, pan: { x: number; y: number }) {
  const x = (node.x + (side === "out" ? NODE_W : 0)) * scale + pan.x;
  const y = (node.y + NODE_H / 2) * scale + pan.y;
  return { x, y };
}

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.45);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function FlowCanvas({
  nodes,
  connections,
  scale,
  onScaleChange,
  selectedId,
  bottleneckIds,
  linkMode,
  linkSource,
  onSelect,
  onNodePointerDown,
  onDropBlock,
  recenterToken = 0,
}: {
  nodes: FlowNode[];
  connections: Connection[];
  scale: number;
  onScaleChange?: (scale: number) => void;
  selectedId: string | null;
  bottleneckIds: string[];
  linkMode: boolean;
  linkSource: string | null;
  onSelect: (id: string | null) => void;
  onNodePointerDown: (e: React.PointerEvent, id: string) => void;
  onDropBlock: (type: string, label: string, x: number, y: number) => void;
  recenterToken?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pan, setPan] = useState({ x: 16, y: 16 });
  const panDrag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{
    dist: number;
    scale: number;
    panX: number;
    panY: number;
    midX: number;
    midY: number;
  } | null>(null);
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  scaleRef.current = scale;
  panRef.current = pan;

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const fitView = () => {
    const el = ref.current;
    const list = nodesRef.current;
    if (!el || list.length === 0) return;
    if (el.clientWidth < 8 || el.clientHeight < 8) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of list) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W);
      maxY = Math.max(maxY, n.y + NODE_H);
    }
    const s = scaleRef.current;
    const bw = (maxX - minX) * s;
    const bh = (maxY - minY) * s;
    const pad = 24;
    const vw = Math.max(0, el.clientWidth - pad * 2);
    const vh = Math.max(0, el.clientHeight - pad * 2);
    setPan({
      x: pad + (vw - bw) / 2 - minX * s,
      y: pad + (vh - bh) / 2 - minY * s,
    });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = requestAnimationFrame(fitView);
    const ro = new ResizeObserver(() => fitView());
    ro.observe(el);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [recenterToken]);

  const sourceNode = nodes.find((n) => n.id === linkSource);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onScaleChange) return;

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey) && Math.abs(e.deltaY) < 50) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const prev = scaleRef.current;
      const next = Math.min(2.2, Math.max(0.28, prev * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
      if (next === prev) return;
      const p = panRef.current;
      setPan({
        x: mx - ((mx - p.x) / prev) * next,
        y: my - ((my - p.y) / prev) * next,
      });
      onScaleChange(next);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const r = el.getBoundingClientRect();
      const p = panRef.current;
      pinch.current = {
        dist: dist({ x: t0.clientX, y: t0.clientY }, { x: t1.clientX, y: t1.clientY }),
        scale: scaleRef.current,
        panX: p.x,
        panY: p.y,
        midX: (t0.clientX + t1.clientX) / 2 - r.left,
        midY: (t0.clientY + t1.clientY) / 2 - r.top,
      };
      panDrag.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinch.current) return;
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const r = el.getBoundingClientRect();
      const d = dist({ x: t0.clientX, y: t0.clientY }, { x: t1.clientX, y: t1.clientY });
      const midX = (t0.clientX + t1.clientX) / 2 - r.left;
      const midY = (t0.clientY + t1.clientY) / 2 - r.top;
      const prev = pinch.current.scale;
      const next = Math.min(2.2, Math.max(0.28, prev * (d / Math.max(1, pinch.current.dist))));
      const worldX = (pinch.current.midX - pinch.current.panX) / prev;
      const worldY = (pinch.current.midY - pinch.current.panY) / prev;
      setPan({
        x: midX - worldX * next,
        y: midY - worldY * next,
      });
      onScaleChange(next);
    };

    const onTouchEnd = () => {
      pinch.current = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onScaleChange]);

  return (
    <div
      ref={ref}
      className="canvas-grid absolute inset-0 h-full w-full overflow-hidden touch-none overscroll-none"
      style={{
        backgroundSize: `${32 * scale}px ${32 * scale}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      onPointerDown={(e) => {
        if (pinch.current) return;
        const t = e.target as HTMLElement;
        if (t === e.currentTarget || t.dataset.canvas === "svg") {
          onSelect(null);
          panDrag.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        if (pinch.current) return;
        if (panDrag.current) {
          setPan({
            x: panDrag.current.x + (e.clientX - panDrag.current.px),
            y: panDrag.current.y + (e.clientY - panDrag.current.py),
          });
        }
        if (!linkMode || !linkSource) return;
        const r = e.currentTarget.getBoundingClientRect();
        setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onPointerUp={() => {
        panDrag.current = null;
      }}
      onPointerCancel={() => {
        panDrag.current = null;
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("block-type");
        const label = e.dataTransfer.getData("block-label");
        if (!type) return;
        const r = e.currentTarget.getBoundingClientRect();
        onDropBlock(
          type,
          label,
          (e.clientX - r.left - pan.x) / scale - NODE_W / 2,
          (e.clientY - r.top - pan.y) / scale - 24,
        );
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" data-canvas="svg">
        {connections.map((c) => {
          const from = nodes.find((n) => n.id === c.from);
          const to = nodes.find((n) => n.id === c.to);
          if (!from || !to) return null;
          const hot = bottleneckIds.includes(from.id) || bottleneckIds.includes(to.id);
          return (
            <path
              key={c.id}
              d={curve(port(from, "out", scale, pan), port(to, "in", scale, pan))}
              fill="none"
              stroke={hot ? "#ff6b35" : "#00e5ff"}
              strokeOpacity={hot ? 0.85 : 0.55}
              strokeWidth={Math.max(1.5, 2 * Math.min(1, scale + 0.2))}
            />
          );
        })}
        {linkMode && sourceNode && cursor ? (
          <path
            d={curve(port(sourceNode, "out", scale, pan), cursor)}
            fill="none"
            stroke="#00e5ff"
            strokeDasharray="6 6"
            strokeWidth={1.5}
          />
        ) : null}
      </svg>
      {nodes.map((n) => (
        <NodeCard
          key={n.id}
          node={{ ...n, x: n.x + pan.x / scale, y: n.y + pan.y / scale }}
          scale={scale}
          selected={selectedId === n.id}
          bottleneck={bottleneckIds.includes(n.id)}
          linkSource={linkSource === n.id}
          onPointerDown={(e) => onNodePointerDown(e, n.id)}
        />
      ))}
    </div>
  );
}
