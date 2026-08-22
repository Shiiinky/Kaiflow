import { useRef, useState } from "react";
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

export function FlowCanvas({
  nodes,
  connections,
  scale,
  selectedId,
  bottleneckIds,
  linkMode,
  linkSource,
  onSelect,
  onNodePointerDown,
  onDropBlock,
}: {
  nodes: FlowNode[];
  connections: Connection[];
  scale: number;
  selectedId: string | null;
  bottleneckIds: string[];
  linkMode: boolean;
  linkSource: string | null;
  onSelect: (id: string | null) => void;
  onNodePointerDown: (e: React.PointerEvent, id: string) => void;
  onDropBlock: (type: string, label: string, x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const panDrag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const sourceNode = nodes.find((n) => n.id === linkSource);

  return (
    <div
      ref={ref}
      className="canvas-grid relative min-h-0 flex-1 overflow-hidden"
      style={{ backgroundSize: `${32 * scale}px ${32 * scale}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
      onPointerDown={(e) => {
        const t = e.target as HTMLElement;
        if (t === e.currentTarget || t.dataset.canvas === "svg") {
          onSelect(null);
          panDrag.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
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
              strokeWidth={2}
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
