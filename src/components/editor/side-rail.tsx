import { AlertTriangle, Lightbulb, Timer } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { analyzeFlow, formatDuration, formatSeconds, getEffectiveCycle, simulateExtraMachine } from "@/lib/flow/engine";
import { cn } from "@/lib/cn";
import type { FlowDoc, FlowNode } from "@/lib/flow/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-sm border border-border bg-bg px-3 text-sm text-fg outline-none focus:border-accent";

export function KpiGrid({ doc }: { doc: FlowDoc }) {
  const a = analyzeFlow(doc);
  const items = [
    { k: "Takt", v: formatSeconds(a.takt), warn: false },
    { k: "Cycle goulot", v: formatSeconds(a.maxCycle), warn: a.rendement !== null && a.rendement < 100 },
    { k: "Rendement", v: a.rendement !== null ? `${a.rendement}%` : "—", warn: (a.rendement ?? 100) < 85 },
    { k: "Lead time", v: formatDuration(a.leadTime), warn: false },
    { k: "VA", v: a.vaPercent !== null ? `${a.vaPercent}%` : "—", warn: (a.vaPercent ?? 100) < 60 },
    { k: "Charge moy.", v: a.charge !== null ? `${a.charge}%` : "—", warn: (a.charge ?? 0) > 100 },
    { k: "Débit", v: a.throughputPerHour !== null ? `${a.throughputPerHour}/h` : "—", warn: false },
    { k: "ETP", v: a.etp !== null ? `${a.etp}` : "—", warn: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <div key={it.k} className="rounded-md border border-border bg-surface p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted">{it.k}</div>
          <div className={cn("font-display text-lg font-semibold tabular-nums", it.warn ? "text-warn" : "text-fg")}>
            {it.v}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Recs({ doc }: { doc: FlowDoc }) {
  const recs = analyzeFlow(doc).recommendations;
  return (
    <div className="space-y-2">
      {recs.map((r) => (
        <div key={r.id} className="rounded-md border border-border bg-surface p-3">
          <div className="flex items-start gap-2">
            {r.severity === "critical" ? (
              <AlertTriangle className="mt-0.5 size-4 text-warn" />
            ) : (
              <Lightbulb className="mt-0.5 size-4 text-accent" />
            )}
            <div>
              <div className="text-sm font-medium">{r.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-2">{r.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WhatIf({ doc }: { doc: FlowDoc }) {
  const a = analyzeFlow(doc);
  const bnId = a.bottleneck?.ids[0];
  if (!bnId) return <p className="text-sm text-muted">Pas de goulot calculable.</p>;
  const alt = analyzeFlow(simulateExtraMachine(doc, bnId));
  const node = doc.nodes.find((n) => n.id === bnId);
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-sm font-medium">Et si +1 machine sur {node?.label} ?</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted">Cycle actuel</div>
          <div className="font-display text-base tabular-nums text-warn">{a.maxCycle}s</div>
        </div>
        <div>
          <div className="text-muted">Cycle simulé</div>
          <div className="font-display text-base tabular-nums text-ok">{alt.maxCycle}s</div>
        </div>
        <div>
          <div className="text-muted">Rendement</div>
          <div className="tabular-nums">
            {a.rendement}% → {alt.rendement}%
          </div>
        </div>
        <div>
          <div className="text-muted">Débit / h</div>
          <div className="tabular-nums">
            {a.throughputPerHour} → {alt.throughputPerHour}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PropsForm({
  node,
  onChange,
  onOpenMos,
}: {
  node: FlowNode;
  onChange: (patch: Partial<FlowNode>) => void;
  onOpenMos: () => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Nom">
        <input className={inputClass} value={node.label} onChange={(e) => onChange({ label: e.target.value })} />
      </Field>
      {node.type !== "stock" ? (
        <Field label="Temps de cycle (s)">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={node.cycle}
            onChange={(e) => onChange({ cycle: Number(e.target.value) })}
          />
        </Field>
      ) : (
        <>
          <Field label="Quantité">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={node.qty}
              onChange={(e) => onChange({ qty: Number(e.target.value) })}
            />
          </Field>
          <Field label="Stock max">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={node.stockMax}
              onChange={(e) => onChange({ stockMax: Number(e.target.value) })}
            />
          </Field>
        </>
      )}
      {node.type === "work" || node.type === "control" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Opérateurs">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={node.ops}
                onChange={(e) => onChange({ ops: Number(e.target.value) })}
              />
            </Field>
            <Field label="Machines">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={node.machines}
                onChange={(e) => onChange({ machines: Number(e.target.value) })}
              />
            </Field>
            <Field label="Dispo %">
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                value={node.dispo}
                onChange={(e) => onChange({ dispo: Number(e.target.value) })}
              />
            </Field>
            <Field label="Rebut %">
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                value={node.rebut}
                onChange={(e) => onChange({ rebut: Number(e.target.value) })}
              />
            </Field>
          </div>
          <p className="text-xs text-muted">
            Temps utile : <span className="tabular-nums text-fg">{getEffectiveCycle(node)}s</span>
          </p>
          <Button variant="secondary" size="sm" className="w-full" onClick={onOpenMos}>
            Mode opératoire (MOS)
          </Button>
        </>
      ) : null}
      {node.type === "transport" ? (
        <Field label="Distance (m)">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={node.dist}
            onChange={(e) => onChange({ dist: Number(e.target.value) })}
          />
        </Field>
      ) : null}
      <Field label="VSM">
        <select
          className={inputClass}
          value={node.vsm}
          onChange={(e) => onChange({ vsm: e.target.value as FlowNode["vsm"] })}
        >
          <option value="va">Valeur ajoutée</option>
          <option value="nva">Non valeur ajoutée</option>
        </select>
      </Field>
    </div>
  );
}

export function Chrono({ onApply }: { onApply: (seconds: number) => void }) {
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      if (startRef.current == null) return;
      setMs(Date.now() - startRef.current);
    }, 80);
    return () => window.clearInterval(t);
  }, [running]);

  const secs = ms / 1000;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(Math.floor(secs % 60)).padStart(2, "0");
  const th = String(Math.floor((ms % 1000) / 100));

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2 text-muted">
        <Timer className="size-4" />
        <span className="text-xs uppercase tracking-wider">Chrono terrain</span>
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">
        {mm}:{ss}.{th}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (running) {
              setRunning(false);
            } else {
              startRef.current = Date.now() - ms;
              setRunning(true);
            }
          }}
        >
          {running ? "Pause" : ms ? "Reprendre" : "Démarrer"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setMs(0);
            startRef.current = null;
          }}
        >
          Reset
        </Button>
        <Button size="sm" onClick={() => onApply(Math.round(secs))} disabled={secs < 1}>
          Appliquer au poste
        </Button>
      </div>
    </div>
  );
}
