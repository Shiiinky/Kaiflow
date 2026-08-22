import { ListOrdered, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fifoSequence, johnsonSequence, SAMPLE_JOHNSON_JOBS } from "@/lib/flow/johnson";
import { uid } from "@/lib/flow/engine";
import type { JohnsonJob } from "@/lib/flow/types";

export function JohnsonPanel({
  jobs,
  onChange,
}: {
  jobs: JohnsonJob[];
  onChange: (jobs: JohnsonJob[]) => void;
}) {
  const opt = johnsonSequence(jobs);
  const fifo = fifoSequence(jobs);
  const gain = fifo.makespan > 0 ? fifo.makespan - opt.makespan : 0;
  const maxT = Math.max(opt.makespan, 1);

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-2">
        n références, 2 machines en série. Johnson minimise le makespan (temps total de passage).
      </p>
      <div className="space-y-2">
        {jobs.map((j) => (
          <div key={j.id} className="grid grid-cols-12 items-center gap-1">
            <input
              className="col-span-5 h-9 rounded-sm border border-border bg-bg px-2 text-sm"
              value={j.name}
              onChange={(e) => onChange(jobs.map((x) => (x.id === j.id ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className="col-span-3 h-9 rounded-sm border border-border bg-bg px-2 text-sm tabular-nums"
              type="number"
              min={0}
              value={j.t1}
              onChange={(e) =>
                onChange(jobs.map((x) => (x.id === j.id ? { ...x, t1: Number(e.target.value) } : x)))
              }
              aria-label="Temps machine 1"
            />
            <input
              className="col-span-3 h-9 rounded-sm border border-border bg-bg px-2 text-sm tabular-nums"
              type="number"
              min={0}
              value={j.t2}
              onChange={(e) =>
                onChange(jobs.map((x) => (x.id === j.id ? { ...x, t2: Number(e.target.value) } : x)))
              }
              aria-label="Temps machine 2"
            />
            <button
              className="col-span-1 text-danger"
              onClick={() => onChange(jobs.filter((x) => x.id !== j.id))}
              aria-label="Retirer"
            >
              <Trash2 className="mx-auto size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onChange([...jobs, { id: uid("j"), name: `Réf. ${jobs.length + 1}`, t1: 40, t2: 50 }])
          }
        >
          <Plus className="size-3.5" />
          Référence
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onChange(SAMPLE_JOHNSON_JOBS.map((j) => ({ ...j })))}>
          Exemple 5 refs
        </Button>
      </div>
      {opt.order.length > 0 ? (
        <div className="rounded-md border border-border bg-bg p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ListOrdered className="size-4 text-accent" />
            Séquence optimale
          </div>
          <ol className="mt-2 flex flex-wrap gap-1 text-xs">
            {opt.order.map((j, i) => (
              <li key={j.id} className="rounded-xs border border-border px-2 py-1">
                {i + 1}. {j.name}
              </li>
            ))}
          </ol>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted">Makespan Johnson</div>
              <div className="font-display text-lg tabular-nums text-ok">{opt.makespan}s</div>
            </div>
            <div>
              <div className="text-muted">Ordre FIFO</div>
              <div className="font-display text-lg tabular-nums">{fifo.makespan}s</div>
            </div>
          </div>
          {gain > 0 ? (
            <p className="mt-1 text-xs text-ok">Gain : {gain}s vs l'ordre saisi.</p>
          ) : (
            <p className="mt-1 text-xs text-muted">L'ordre actuel est déjà optimal, ou identique.</p>
          )}
          <div className="mt-3 space-y-2">
            <GanttLane label="M1" machine="m1" bars={opt.gantt.map((b) => ({ ...b, range: b.m1 }))} maxT={maxT} />
            <GanttLane label="M2" machine="m2" bars={opt.gantt.map((b) => ({ ...b, range: b.m2 }))} maxT={maxT} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Ajoutez des références avec des temps M1 / M2.</p>
      )}
    </div>
  );
}

function GanttLane({
  label,
  machine,
  bars,
  maxT,
}: {
  label: string;
  machine: "m1" | "m2";
  bars: { jobId: string; name: string; range: [number, number] }[];
  maxT: number;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="relative h-7 overflow-hidden rounded-xs bg-surface-2">
        {bars.map((bar) => (
          <div
            key={bar.jobId}
            className={
              machine === "m1"
                ? "absolute inset-y-0.5 overflow-hidden rounded-xs bg-accent px-1 text-[10px] font-medium leading-6 text-accent-fg"
                : "absolute inset-y-0.5 overflow-hidden rounded-xs bg-warn px-1 text-[10px] font-medium leading-6 text-accent-fg"
            }
            style={pct(bar.range, maxT)}
            title={`${bar.name} ${bar.range[0]}–${bar.range[1]}s`}
          >
            <span className="truncate">{bar.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function pct(range: [number, number], max: number) {
  return {
    left: `${(range[0] / max) * 100}%`,
    width: `${(Math.max(0, range[1] - range[0]) / max) * 100}%`,
  };
}
