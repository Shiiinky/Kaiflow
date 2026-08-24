import { analyzeFlow, formatDuration, formatSeconds } from "@/lib/flow/engine";
import { cn } from "@/lib/cn";
import type { FlowDoc } from "@/lib/flow/types";
import { isAdminMode } from "@/lib/flow/types";

export function KpiBar({ doc }: { doc: FlowDoc }) {
  const a = analyzeFlow(doc);
  const admin = isAdminMode(doc);

  if (admin) {
    const items = [
      { k: "Lead", v: formatDuration(a.leadTime), sub: "chemin critique", warn: false },
      {
        k: "Étape max",
        v: formatSeconds(a.maxCycle),
        sub: a.bottleneck?.label ?? "—",
        warn: a.maxCycle > 0 && (a.rendement ?? 100) < 100,
      },
      { k: "Étapes", v: String(a.stepCount ?? 0), sub: "traitement", warn: false },
      {
        k: "Décisions",
        v: String(a.decisionCount ?? 0),
        sub: "points",
        warn: (a.decisionCount ?? 0) >= 4,
      },
      {
        k: "File",
        v: String(a.queueItems ?? 0),
        sub: "dossiers",
        warn: (a.queueItems ?? 0) > 20,
      },
      {
        k: "Rework",
        v: a.avgRework !== null && a.avgRework !== undefined ? `${a.avgRework}%` : "—",
        sub: "moyen",
        warn: (a.avgRework ?? 0) > 15,
      },
      {
        k: "Cible",
        v: formatSeconds(a.takt),
        sub: "temps / dossier",
        warn: false,
      },
      { k: "Blocs", v: String(a.stationCount), sub: "canvas", warn: false },
    ];
    return <Bar items={items} />;
  }

  const over = a.rendement !== null && a.rendement < 100;
  const items = [
    { k: "Takt", v: formatSeconds(a.takt), sub: "net", warn: false },
    { k: "Cycle max", v: formatSeconds(a.maxCycle), sub: "plus lent", warn: over },
    { k: "Lead", v: formatDuration(a.leadTime), sub: "critique", warn: false },
    { k: "Goulot", v: a.bottleneck?.label ?? "\u2014", sub: over ? "hors takt" : "OK", warn: over },
    {
      k: "Rend.",
      v: a.rendement !== null ? `${a.rendement}%` : "\u2014",
      sub: "takt/cycle",
      warn: (a.rendement ?? 100) < 85,
    },
    {
      k: "VA",
      v: a.vaPercent !== null ? `${a.vaPercent}%` : "\u2014",
      sub: "valeur",
      warn: (a.vaPercent ?? 100) < 60,
    },
    {
      k: "Charge",
      v: a.charge !== null ? `${a.charge}%` : "\u2014",
      sub: "moyenne",
      warn: (a.charge ?? 0) > 100,
    },
    { k: "Blocs", v: String(a.stationCount), sub: "canvas", warn: false },
  ];
  return <Bar items={items} />;
}

function Bar({
  items,
}: {
  items: { k: string; v: string; sub: string; warn: boolean }[];
}) {
  return (
    <div className="flex shrink-0 overflow-x-auto border-t border-border bg-surface [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((it) => (
        <div
          key={it.k}
          className="min-w-[72px] shrink-0 border-r border-border px-2 py-1.5 last:border-r-0 sm:min-w-[100px] sm:flex-1 sm:px-3 sm:py-2"
        >
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted sm:text-[10px]">
            {it.k}
          </div>
          <div
            className={cn(
              "truncate font-display text-sm font-extrabold leading-tight tabular-nums sm:text-lg",
              it.warn ? "text-warn" : "text-fg",
            )}
            title={`${it.k}: ${it.v}`}
          >
            {it.v}
          </div>
          <div className="hidden text-[10px] text-muted sm:block">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
