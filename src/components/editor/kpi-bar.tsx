import { analyzeFlow, formatDuration, formatSeconds } from "@/lib/flow/engine";
import { cn } from "@/lib/cn";
import type { FlowDoc } from "@/lib/flow/types";

export function KpiBar({ doc }: { doc: FlowDoc }) {
  const a = analyzeFlow(doc);
  const over = a.rendement !== null && a.rendement < 100;
  const items = [
    { k: "Takt net", v: formatSeconds(a.takt), sub: "demande / ouverture", warn: false },
    { k: "Cycle max", v: formatSeconds(a.maxCycle), sub: "poste le plus lent", warn: over },
    { k: "Lead time", v: formatDuration(a.leadTime), sub: "chemin critique", warn: false },
    { k: "Goulot", v: a.bottleneck?.label ?? "—", sub: over ? "dépasse le takt" : "dans les limites", warn: over },
    { k: "Rendement", v: a.rendement !== null ? `${a.rendement}%` : "—", sub: "takt / cycle", warn: (a.rendement ?? 100) < 85 },
    { k: "VA", v: a.vaPercent !== null ? `${a.vaPercent}%` : "—", sub: "valeur ajoutée", warn: (a.vaPercent ?? 100) < 60 },
    { k: "Charge", v: a.charge !== null ? `${a.charge}%` : "—", sub: "moyenne postes", warn: (a.charge ?? 0) > 100 },
    { k: "Blocs", v: String(a.stationCount), sub: "sur le canvas", warn: false },
  ];
  return (
    <div className="flex shrink-0 overflow-x-auto border-t border-border bg-surface">
      {items.map((it) => (
        <div key={it.k} className="min-w-[108px] flex-1 border-r border-border px-3 py-2 last:border-r-0">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted">{it.k}</div>
          <div
            className={cn(
              "truncate font-display text-lg font-extrabold leading-tight tabular-nums",
              it.warn ? "text-warn" : "text-fg",
            )}
            title={it.v}
          >
            {it.v}
          </div>
          <div className="text-[10px] text-muted">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
