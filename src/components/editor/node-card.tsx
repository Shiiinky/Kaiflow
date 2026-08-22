import { AlertTriangle, BadgeCheck, Package, Truck, Wrench } from "lucide-react";
import { getEffectiveCycle, getNodeVaPercent } from "@/lib/flow/engine";
import { cn } from "@/lib/cn";
import type { FlowNode } from "@/lib/flow/types";
import { NODE_H, NODE_W } from "@/lib/flow/blocks";

const ICONS = {
  work: Wrench,
  stock: Package,
  transport: Truck,
  control: BadgeCheck,
} as const;

export function NodeCard({
  node,
  selected,
  bottleneck,
  linkSource,
  scale,
  onPointerDown,
}: {
  node: FlowNode;
  selected: boolean;
  bottleneck: boolean;
  linkSource: boolean;
  scale: number;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const Icon = ICONS[node.type];
  const cycle = getEffectiveCycle(node);
  const va = getNodeVaPercent(node);
  const trs = Math.round((node.dispo / 100) * (1 - node.rebut / 100) * 100);

  return (
    <div
      data-node-id={node.id}
      onPointerDown={onPointerDown}
      className={cn(
        "absolute select-none rounded-md border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        selected ? "border-accent" : "border-border",
        bottleneck && "border-warn shadow-[0_0_24px_rgba(255,107,53,0.22)]",
        linkSource && "ring-2 ring-accent",
      )}
      style={{
        left: node.x * scale,
        top: node.y * scale,
        width: NODE_W,
        height: NODE_H,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-xs",
            bottleneck ? "bg-warn/15 text-warn" : "bg-accent/10 text-accent",
          )}
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold">{node.label}</span>
        {bottleneck ? <AlertTriangle className="size-3.5 text-warn" /> : null}
      </div>
      <div className="space-y-1 px-2.5 py-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted">Temps utile</span>
          <span className={cn("tabular-nums font-medium", bottleneck ? "text-warn" : "text-fg")}>
            {Number.isFinite(cycle) && cycle > 0 ? `${cycle}s` : "—"}
          </span>
        </div>
        {node.type === "stock" ? (
          <div className="flex justify-between">
            <span className="text-muted">Stock</span>
            <span className="tabular-nums">{node.qty} pcs</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-muted">{node.type === "transport" ? "Distance" : "Opérateurs"}</span>
            <span className="tabular-nums">
              {node.type === "transport" ? `${node.dist} m` : node.ops}
              {node.machines > 1 ? ` · ×${node.machines}` : ""}
            </span>
          </div>
        )}
        {trs < 100 && (node.type === "work" || node.type === "control") ? (
          <div className="flex justify-between text-warn">
            <span>TRS estimé</span>
            <span className="tabular-nums">{trs}%</span>
          </div>
        ) : null}
      </div>
      {va !== null ? (
        <div className="absolute inset-x-0 bottom-0 flex h-1 overflow-hidden rounded-b-md">
          <div className="bg-ok" style={{ width: `${va}%` }} />
          <div className="bg-warn" style={{ width: `${100 - va}%` }} />
        </div>
      ) : null}
    </div>
  );
}
