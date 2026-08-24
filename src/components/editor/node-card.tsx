import {
  AlertTriangle,
  BadgeCheck,
  CircleDot,
  FileText,
  GitBranch,
  Hourglass,
  Package,
  Truck,
  UserCog,
  Wrench,
} from "lucide-react";
import { getEffectiveCycle, getNodeVaPercent } from "@/lib/flow/engine";
import { cn } from "@/lib/cn";
import type { FlowNode, NodeType } from "@/lib/flow/types";
import { DECISION_SIZE, NODE_H, NODE_W } from "@/lib/flow/blocks";

const ICONS: Record<NodeType, typeof Wrench> = {
  work: Wrench,
  stock: Package,
  transport: Truck,
  control: BadgeCheck,
  step: UserCog,
  decision: GitBranch,
  queue: Hourglass,
  startend: CircleDot,
  document: FileText,
};

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
  const Icon = ICONS[node.type] ?? Wrench;
  const cycle = getEffectiveCycle(node);
  const va = getNodeVaPercent(node);
  const trs = Math.round((node.dispo / 100) * (1 - node.rebut / 100) * 100);
  const isAdmin =
    node.type === "step" ||
    node.type === "decision" ||
    node.type === "queue" ||
    node.type === "startend" ||
    node.type === "document";
  const isDecision = node.type === "decision";
  const w = isDecision ? DECISION_SIZE : NODE_W;
  const h = isDecision ? DECISION_SIZE : NODE_H;
  const accent = node.color || undefined;

  if (isDecision) {
    return (
      <div
        data-node-id={node.id}
        onPointerDown={onPointerDown}
        className={cn("absolute select-none touch-none", linkSource && "z-10")}
        style={{
          left: node.x * scale,
          top: node.y * scale,
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          className={cn(
            "absolute left-1/2 top-1/2 size-[72%] -translate-x-1/2 -translate-y-1/2 rotate-45 border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
            selected ? "border-accent" : "border-border",
            bottleneck && "border-warn shadow-[0_0_24px_rgba(255,107,53,0.22)]",
            linkSource && "ring-2 ring-accent",
          )}
          style={accent ? { borderColor: accent } : undefined}
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
          <GitBranch
            className={cn("mb-1 size-3.5", bottleneck ? "text-warn" : "text-accent")}
            strokeWidth={2}
          />
          <span className="line-clamp-3 font-display text-xs font-semibold leading-tight">
            {node.label}
          </span>
          {node.role ? (
            <span className="mt-1 max-w-full truncate text-[10px] text-muted">{node.role}</span>
          ) : null}
          {bottleneck ? <AlertTriangle className="mt-1 size-3 text-warn" /> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      data-node-id={node.id}
      onPointerDown={onPointerDown}
      className={cn(
        "absolute select-none touch-none border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        "rounded-md",
        selected ? "border-accent" : "border-border",
        bottleneck && "border-warn shadow-[0_0_24px_rgba(255,107,53,0.22)]",
        linkSource && "ring-2 ring-accent",
        node.type === "startend" && "border-dashed",
        node.type === "document" && "border-l-4 border-l-accent/60",
      )}
      style={{
        left: node.x * scale,
        top: node.y * scale,
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        ...(accent ? { borderColor: accent } : {}),
      }}
    >
      <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-xs",
            bottleneck ? "bg-warn/15 text-warn" : "bg-accent/10 text-accent",
          )}
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold">
          {node.label}
        </span>
        {bottleneck ? <AlertTriangle className="size-3.5 shrink-0 text-warn" /> : null}
      </div>
      <div className="space-y-0.5 px-2.5 py-2 text-[11px]">
        {node.type === "startend" ? (
          <div className="text-muted">Borne du parcours</div>
        ) : isAdmin ? (
          <>
            {node.role ? (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Resp.</span>
                <span className="truncate font-medium">{node.role}</span>
              </div>
            ) : null}
            {node.inputs ? (
              <div className="truncate text-muted" title={node.inputs}>
                <span className="text-accent/80">↓</span> {node.inputs}
              </div>
            ) : null}
            {node.outputs ? (
              <div className="truncate text-muted" title={node.outputs}>
                <span className="text-ok">↑</span> {node.outputs}
              </div>
            ) : null}
            {!node.role && !node.inputs && !node.outputs ? (
              <div className="flex justify-between gap-2">
                <span className="text-muted">
                  {node.type === "queue" ? "En file" : "Durée"}
                </span>
                <span className="tabular-nums">
                  {node.type === "queue"
                    ? `${node.qty} dossiers`
                    : Number.isFinite(cycle) && cycle > 0
                      ? `${cycle}s`
                      : "—"}
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex justify-between gap-2">
              <span className="text-muted">Temps utile</span>
              <span
                className={cn(
                  "tabular-nums font-medium",
                  bottleneck ? "text-warn" : "text-fg",
                )}
              >
                {Number.isFinite(cycle) && cycle > 0 ? `${cycle}s` : "—"}
              </span>
            </div>
            {node.type === "stock" ? (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Stock</span>
                <span className="tabular-nums">{node.qty} pcs</span>
              </div>
            ) : (
              <div className="flex justify-between gap-2">
                <span className="text-muted">
                  {node.type === "transport" ? "Distance" : "Opérateurs"}
                </span>
                <span className="tabular-nums">
                  {node.type === "transport" ? `${node.dist} m` : node.ops}
                  {node.machines > 1 ? ` · ×${node.machines}` : ""}
                </span>
              </div>
            )}
            {trs < 100 && (node.type === "work" || node.type === "control") ? (
              <div className="flex justify-between gap-2 text-warn">
                <span>TRS estimé</span>
                <span className="tabular-nums">{trs}%</span>
              </div>
            ) : null}
          </>
        )}
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
