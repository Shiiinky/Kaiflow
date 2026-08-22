import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Download, FileJson, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand";
import { AccountChip } from "@/components/account-chip";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { analyzeFlow, formatSeconds } from "@/lib/flow/engine";
import { useFlowStore } from "@/lib/flow/store";
import { TEMPLATE_CARDS } from "@/lib/flow/templates";
import type { FlowDoc } from "@/lib/flow/types";

export const Route = createFileRoute("/app")({
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const flows = useFlowStore((s) => s.flows);
  const createFrom = useFlowStore((s) => s.createFrom);
  const deleteFlow = useFlowStore((s) => s.deleteFlow);
  const duplicate = useFlowStore((s) => s.duplicate);
  const importJson = useFlowStore((s) => s.importJson);
  const navigate = useNavigate();
  const [creating, setCreating] = useState<(typeof TEMPLATE_CARDS)[number] | null>(null);
  const [nom, setNom] = useState("");
  const [usine, setUsine] = useState("");
  const [atelier, setAtelier] = useState("");

  const open = (id: string) => navigate({ to: "/editor/$id", params: { id } });

  const byUsine = new Map<string, typeof flows>();
  for (const f of flows) {
    const key = f.usine || "Site";
    const list = byUsine.get(key) ?? [];
    list.push(f);
    byUsine.set(key, list);
  }

  const confirmCreate = () => {
    if (!creating) return;
    const base = creating.build();
    const id = createFrom(base, {
      nom: nom.trim() || base.nom,
      usine: usine.trim() || base.usine,
      atelier: atelier.trim() || base.atelier,
    });
    setCreating(null);
    void open(id);
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
        <BrandMark to="/" />
        <div className="flex items-center gap-2">
          <AccountChip />
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-border px-3 text-sm text-muted hover:text-fg">
            <FileJson className="size-4" />
            <span className="hidden sm:inline">Importer</span>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const id = importJson(await file.text());
                if (id) void open(id);
              }}
            />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Atelier</h1>
            <p className="mt-1 text-sm text-muted">Vos flux restent dans ce navigateur — aucun compte.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {TEMPLATE_CARDS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                const base = t.build();
                setCreating(t);
                setNom(t.id === "blank" ? "" : base.nom);
                setUsine(base.usine);
                setAtelier(base.atelier);
              }}
              className="rounded-lg border border-border bg-card p-4 text-left hover:border-accent/40"
            >
              <div className="flex flex-row items-center gap-2 text-accent">
                <Plus className="size-4 shrink-0" />
                <span className="font-display font-bold text-fg">{t.title}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 space-y-10">
          {flows.length === 0 ? (
            <p className="text-muted">Aucun flux. Créez-en un depuis un modèle.</p>
          ) : (
            [...byUsine.entries()].map(([usineName, list]) => (
              <section key={usineName}>
                <h2 className="mb-4 font-display text-xl font-bold">{usineName}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.map((f) => (
                    <FlowCard
                      key={f.id}
                      flow={f}
                      onDuplicate={() => {
                        const nid = duplicate(f.id);
                        if (nid) void open(nid);
                      }}
                      onDelete={() => deleteFlow(f.id)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {creating ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 p-4"
          onClick={() => setCreating(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-bold">Nouvelle ligne</h2>
              <button className="p-1 text-muted" onClick={() => setCreating(null)}>
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">Modèle : {creating.title}</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                Nom de la ligne
                <input
                  className="mt-1 h-10 w-full rounded-sm border border-border bg-bg px-3"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex. Ligne assemblage stylos"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  Usine / site
                  <input
                    className="mt-1 h-10 w-full rounded-sm border border-border bg-bg px-3"
                    value={usine}
                    onChange={(e) => setUsine(e.target.value)}
                    placeholder="Usine Nord"
                  />
                </label>
                <label className="block text-sm">
                  Atelier
                  <input
                    className="mt-1 h-10 w-full rounded-sm border border-border bg-bg px-3"
                    value={atelier}
                    onChange={(e) => setAtelier(e.target.value)}
                    placeholder="Menuiserie"
                  />
                </label>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setCreating(null)}>
                Annuler
              </Button>
              <Button className="flex-[2]" onClick={confirmCreate}>
                Créer la ligne
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FlowCard({
  flow,
  onDuplicate,
  onDelete,
}: {
  flow: FlowDoc;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const a = analyzeFlow(flow);
  const warn = (a.rendement ?? 100) < 100;
  const download = () => {
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement("a");
    aEl.href = url;
    aEl.download = `${flow.nom.replace(/\s+/g, "-")}.kaiflow.json`;
    aEl.click();
    URL.revokeObjectURL(url);
  };
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            to="/editor/$id"
            params={{ id: flow.id }}
            className="font-display text-lg font-bold hover:text-accent"
          >
            {flow.nom}
          </Link>
          <p className="text-xs text-muted">{flow.atelier}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${warn ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok"}`}
        >
          {warn ? "Goulot" : "OK takt"}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-muted">Takt</dt>
          <dd className="font-display text-base tabular-nums">{formatSeconds(a.takt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Cycle</dt>
          <dd className="font-display text-base tabular-nums">{formatSeconds(a.maxCycle)}</dd>
        </div>
        <div>
          <dt className="text-muted">Rendement</dt>
          <dd className="font-display text-base tabular-nums">
            {a.rendement !== null ? `${a.rendement}%` : "—"}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link to="/editor/$id" params={{ id: flow.id }}>
            Ouvrir
          </Link>
        </Button>
        <Button size="sm" variant="secondary" onClick={onDuplicate}>
          <Copy className="size-3.5" />
          Dupliquer
        </Button>
        <Button size="sm" variant="ghost" onClick={download} aria-label="Exporter">
          <Download className="size-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}
