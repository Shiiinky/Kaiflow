import type { FlowAnalysis } from "@/lib/flow/types";

export function Yamazumi({ analysis }: { analysis: FlowAnalysis }) {
  const max = Math.max(analysis.takt, analysis.maxCycle, 1) * 1.2;
  if (analysis.groups.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">Ajoutez des postes pour tracer le Yamazumi.</p>;
  }
  const taktH = (analysis.takt / max) * 112;
  return (
    <div className="flex w-full items-end gap-2 px-3 pb-2 pt-1">
      {analysis.groups.map((g) => {
        const h = Math.max(6, (g.eqCycle / max) * 112);
        const over = analysis.takt > 0 && g.eqCycle > analysis.takt;
        const vaH = g.eqCycle > 0 ? (g.va / g.eqCycle) * h : 0;
        const nvaH = g.eqCycle > 0 ? (g.nva / g.eqCycle) * h : 0;
        return (
          <div key={g.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="relative flex h-28 w-full items-end justify-center">
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent/70"
                style={{ bottom: taktH }}
              />
              <div
                className={`relative flex w-[72%] flex-col-reverse overflow-hidden rounded-t-sm ${over ? "ring-1 ring-warn" : ""}`}
                style={{ height: h }}
              >
                <div className="bg-ok" style={{ height: vaH }} />
                <div className="bg-warn" style={{ height: nvaH }} />
              </div>
            </div>
            <div className={`mt-1 font-display text-xs tabular-nums ${over ? "text-warn" : "text-fg"}`}>
              {g.eqCycle}s
            </div>
            <div className="w-full truncate text-center text-[10px] text-muted" title={g.label}>
              {g.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
