import { analyzeFlow, formatDuration, formatSeconds } from "@/lib/flow/engine";
import { cn } from "@/lib/cn";
import type { FlowDoc } from "@/lib/flow/types";

export function KpiBar({ doc }: { doc: FlowDoc }) {
  const a = analyzeFlow(doc);
  const over = a.rendement !== null && a.rendement < 100;
  const items = [
    { k: "Takt", v: formatSeconds(a.takt), sub: "net", warn: false },
    { k: "Cycle max", v: formatSeconds(a.maxCycle), sub: "plus lent", warn: over },
    { k: "Lead", v: formatDuration(a.leadTime), sub: "critique", warn: false },
    { k: "Goulot", v: a.bottleneck?.label ?? "—", sub: over ? "hors takt" : "OK", warn: over },
    {
      k: "Rend.",
      v: a.rendement !== null ? `${a.rendement}%` : "—",
      sub: "takt/cycle",
      warn: (a.rendement ?? 100) < 85,
    },
    { k: "VA", v: a.vaPercent !== null ? `${a.vaPercent}%` : "—", sub: "valeur", warn: (a.vaPercent ?? 100) < 60 },
    { k: "Charge", v: a.charge !== null ? `${a.charge}%` : "—", sub: "moyenne", warn: (a.charge ?? 0) > 100 },
    { k: "Blocs", v: String(a.stationCount), sub: "canvas", warn: false },
  ];
  return (
    <div className="flex shrink-0 overflow-x-auto border-t border-border bg-surface [-webkit-overflow-scrolling:touch]">
      {items.map((it) => (
        <div
          key={it.k}
          className="min-w-[88px] flex-1 border-r border-border px-2.5 py-1.5 last:border-r-0 sm:min-w-[108px] sm:px-3 sm:py-2"
        >
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted sm:text-[10px]">{it.k}</div>
          <div
            className={cn(
              "truncate font-display text-base font-extrabold leading-tight tabular-nums sm:text-lg",
              it.warn ? "text-warn" : "text-fg",
            )}
            title={it.v}
          >
            {it.v}
          </div>
          <div className="hidden text-[10px] text-muted sm:block">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
