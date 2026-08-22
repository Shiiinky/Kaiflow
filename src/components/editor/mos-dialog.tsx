import * as Dialog from "@radix-ui/react-dialog";
import { Pause, Play, Plus, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uid } from "@/lib/flow/engine";
import { cn } from "@/lib/cn";
import type { FlowNode, Mos, MosTask, NonCycle } from "@/lib/flow/types";

const inputClass =
  "h-9 w-full rounded-sm border border-border bg-bg px-2 text-sm text-fg outline-none focus:border-accent";

export function MosDialog({
  open,
  node,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  node: FlowNode | null;
  onOpenChange: (v: boolean) => void;
  onSave: (mos: Mos) => void;
}) {
  const [draft, setDraft] = useState<Mos | null>(null);

  useEffect(() => {
    if (open && node) {
      setDraft({
        processName: node.mos.processName,
        author: node.mos.author,
        tasks: (node.mos.tasks ?? []).map((t) => ({ ...t })),
        nc: (node.mos.nc ?? []).map((c) => ({ ...c })),
      });
    }
  }, [open, node]);

  if (!node || !draft) return null;

  const patch = (next: Mos) => setDraft(next);

  let manual = 0;
  let machine = 0;
  let move = 0;
  let wait = 0;
  let va = 0;
  let nva = 0;
  for (const t of draft.tasks) {
    manual += t.manual || 0;
    machine += t.machine || 0;
    move += t.move || 0;
    wait += t.wait || 0;
    const op = (t.manual || 0) + (t.move || 0) + (t.wait || 0);
    if (t.vsm === "va") va += op;
    else nva += op;
  }
  const opCycle = manual + move + wait;
  const cyc = Math.max(opCycle, machine);
  const totGantt = manual + machine + move + wait || 1;
  const vaP = opCycle > 0 ? Math.round((va / opCycle) * 100) : 0;

  const setTask = (id: string, p: Partial<MosTask>) =>
    patch({ ...draft, tasks: draft.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) });
  const setNc = (id: string, p: Partial<NonCycle>) =>
    patch({ ...draft, nc: draft.nc.map((t) => (t.id === id ? { ...t, ...p } : t)) });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80" />
        <Dialog.Content className="fixed inset-x-3 top-[4%] z-50 mx-auto flex max-h-[92dvh] max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl md:inset-x-auto md:left-1/2 md:w-[860px] md:-translate-x-1/2">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <Dialog.Title className="font-display text-lg font-bold">MOS — {node.label}</Dialog.Title>
              <Dialog.Description className="text-xs text-muted">
                Décomposition des tâches · cycle = max(opérateur, machine)
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-sm p-2 text-muted hover:bg-surface-2 hover:text-fg">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ChronoPanel
              onLap={(seconds) =>
                patch({
                  ...draft,
                  tasks: [
                    ...draft.tasks,
                    {
                      id: uid("t"),
                      desc: `Tâche chrono #${draft.tasks.length + 1}`,
                      manual: seconds,
                      machine: 0,
                      move: 0,
                      wait: 0,
                      vsm: "va",
                    },
                  ],
                })
              }
            />

            <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
              {[
                ["Manuel", `${manual}s`, "text-manual"],
                ["Machine", `${machine}s`, "text-machine"],
                ["Dépl.", `${move}s`, "text-move"],
                ["Attente", `${wait}s`, "text-wait"],
                ["Cycle", `${cyc}s`, "text-accent"],
                ["VA", `${vaP}%`, "text-ok"],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-sm border border-border bg-bg px-2 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
                  <div className={cn("font-display text-base font-semibold tabular-nums", c)}>{v}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-xs bg-border">
              <div className="flex h-full">
                <div className="bg-manual" style={{ width: `${(manual / totGantt) * 100}%` }} />
                <div className="bg-machine" style={{ width: `${(machine / totGantt) * 100}%` }} />
                <div className="bg-move" style={{ width: `${(move / totGantt) * 100}%` }} />
                <div className="bg-wait" style={{ width: `${(wait / totGantt) * 100}%` }} />
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-muted">
              <span className="text-manual">Manuel</span>
              <span className="text-machine">Machine</span>
              <span className="text-move">Déplacement</span>
              <span className="text-wait">Attente</span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="block text-xs text-muted">
                Nom du process
                <input
                  className={cn(inputClass, "mt-1")}
                  value={draft.processName}
                  onChange={(e) => patch({ ...draft, processName: e.target.value })}
                />
              </label>
              <label className="block text-xs text-muted">
                Auteur
                <input
                  className={cn(inputClass, "mt-1")}
                  value={draft.author}
                  onChange={(e) => patch({ ...draft, author: e.target.value })}
                />
              </label>
            </div>

            <h3 className="mt-5 font-display text-sm font-bold uppercase tracking-wider text-muted-2">Tâches</h3>
            <div className="mt-2 hidden grid-cols-12 gap-2 px-1 text-[10px] uppercase tracking-wider text-muted md:grid">
              <div className="col-span-4">Description</div>
              <div className="col-span-1 text-center">Man.</div>
              <div className="col-span-1 text-center">Mach.</div>
              <div className="col-span-1 text-center">Dépl.</div>
              <div className="col-span-1 text-center">Att.</div>
              <div className="col-span-1 text-center">Cumul</div>
              <div className="col-span-2 text-center">VSM</div>
              <div className="col-span-1" />
            </div>
            <div className="space-y-2">
              {draft.tasks.map((t, i) => {
                const cumul = draft.tasks
                  .slice(0, i + 1)
                  .reduce((s, x) => s + (x.manual || 0) + (x.move || 0) + (x.wait || 0), 0);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "grid grid-cols-12 items-center gap-2 rounded-md border border-border bg-bg p-2",
                      t.vsm === "va" ? "border-l-2 border-l-ok" : "border-l-2 border-l-warn",
                    )}
                  >
                    <input
                      className={cn(inputClass, "col-span-12 md:col-span-4")}
                      placeholder={`Tâche ${i + 1}`}
                      value={t.desc}
                      onChange={(e) => setTask(t.id, { desc: e.target.value })}
                    />
                    {(["manual", "machine", "move", "wait"] as const).map((k) => (
                      <input
                        key={k}
                        className={cn(inputClass, "col-span-3 tabular-nums md:col-span-1")}
                        type="number"
                        min={0}
                        value={t[k]}
                        onChange={(e) => setTask(t.id, { [k]: Number(e.target.value) })}
                      />
                    ))}
                    <div className="col-span-6 text-center font-display text-xs tabular-nums text-accent md:col-span-1">
                      {cumul}s
                    </div>
                    <div className="col-span-4 flex gap-1 md:col-span-2">
                      <button
                        className={cn(
                          "h-8 flex-1 rounded-full text-[10px] font-semibold",
                          t.vsm === "va" ? "bg-ok/15 text-ok" : "text-muted",
                        )}
                        onClick={() => setTask(t.id, { vsm: "va" })}
                      >
                        VA
                      </button>
                      <button
                        className={cn(
                          "h-8 flex-1 rounded-full text-[10px] font-semibold",
                          t.vsm === "nva" ? "bg-warn/15 text-warn" : "text-muted",
                        )}
                        onClick={() => setTask(t.id, { vsm: "nva" })}
                      >
                        NVA
                      </button>
                    </div>
                    <button
                      className="col-span-2 h-8 text-danger md:col-span-1"
                      onClick={() => patch({ ...draft, tasks: draft.tasks.filter((x) => x.id !== t.id) })}
                    >
                      <X className="mx-auto size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={() =>
                patch({
                  ...draft,
                  tasks: [
                    ...draft.tasks,
                    { id: uid("t"), desc: "", manual: 0, machine: 0, move: 0, wait: 0, vsm: "va" },
                  ],
                })
              }
            >
              <Plus className="size-4" />
              Ajouter une tâche
            </Button>

            <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wider text-muted-2">
              Activités non cyclées
            </h3>
            <p className="mt-1 text-xs text-muted">Amorties : temps / pièces, ajoutées au cycle utile.</p>
            <div className="mt-2 space-y-2">
              {draft.nc.map((item) => (
                <div key={item.id} className="grid grid-cols-12 items-center gap-2 rounded-md border border-border bg-bg p-2">
                  <input
                    className={cn(inputClass, "col-span-12 md:col-span-5")}
                    placeholder="Changement d'outil…"
                    value={item.desc}
                    onChange={(e) => setNc(item.id, { desc: e.target.value })}
                  />
                  <label className="col-span-4 text-[10px] uppercase text-muted md:col-span-2">
                    Temps (s)
                    <input
                      className={cn(inputClass, "mt-1 tabular-nums")}
                      type="number"
                      min={0}
                      value={item.temps}
                      onChange={(e) => setNc(item.id, { temps: Number(e.target.value) })}
                    />
                  </label>
                  <label className="col-span-4 text-[10px] uppercase text-muted md:col-span-2">
                    Pièces
                    <input
                      className={cn(inputClass, "mt-1 tabular-nums")}
                      type="number"
                      min={0}
                      value={item.pieces}
                      onChange={(e) => setNc(item.id, { pieces: Number(e.target.value) })}
                    />
                  </label>
                  <label className="col-span-3 text-[10px] uppercase text-muted md:col-span-2">
                    Fréq.
                    <input
                      className={cn(inputClass, "mt-1 tabular-nums")}
                      type="number"
                      min={0}
                      value={item.freq}
                      onChange={(e) => setNc(item.id, { freq: Number(e.target.value) })}
                    />
                  </label>
                  <button
                    className="col-span-1 text-danger"
                    onClick={() => patch({ ...draft, nc: draft.nc.filter((x) => x.id !== item.id) })}
                  >
                    <X className="mx-auto size-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={() =>
                patch({
                  ...draft,
                  nc: [...draft.nc, { id: uid("nc"), desc: "", temps: 0, pieces: 0, freq: 1 }],
                })
              }
            >
              <Plus className="size-4" />
              Ajouter une activité
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3">
            <div className="text-xs text-muted">
              Cycle <span className="font-display text-fg tabular-nums">{cyc}s</span>
              {" · "}VA <span className="text-ok">{va}s</span>
              {" · "}NVA <span className="text-warn">{nva}s</span>
            </div>
            <Button className="ml-auto" onClick={() => { onSave(draft); onOpenChange(false); }}>
              Valider
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ChronoPanel({ onLap }: { onLap: (seconds: number) => void }) {
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const lastLap = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      if (startRef.current == null) return;
      setMs(Date.now() - startRef.current);
    }, 80);
    return () => window.clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(ms / 1000 / 60)).padStart(2, "0");
  const ss = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
  const th = String(Math.floor((ms % 1000) / 100));

  return (
    <div className="rounded-md border border-border bg-bg p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-muted">
        <Timer className="size-4" />
        <span className="text-[10px] uppercase tracking-wider">Chrono terrain</span>
      </div>
      <div className="mt-1 font-display text-4xl font-extrabold tabular-nums">
        {mm}:{ss}.{th}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (running) setRunning(false);
            else {
              startRef.current = Date.now() - ms;
              setRunning(true);
            }
          }}
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pause" : ms ? "Reprendre" : "Démarrer"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!running}
          onClick={() => {
            const lap = Math.round((ms - lastLap.current) / 1000);
            lastLap.current = ms;
            if (lap > 0) onLap(lap);
          }}
        >
          Tour
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setMs(0);
            startRef.current = null;
            lastLap.current = 0;
          }}
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
