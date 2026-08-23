import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Copy, Download, Lock, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand";
import { AccountChip } from "@/components/account-chip";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { analyzeFlow, formatSeconds } from "@/lib/flow/engine";
import { getQuota, type QuotaInfo } from "@/lib/flow/api";
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
  const navigate = useNavigate();
  const [creating, setCreating] = useState<(typeof TEMPLATE_CARDS)[number] | null>(null);
  const [nom, setNom] = useState("");
  const [usine, setUsine] = useState("");
  const [atelier, setAtelier] = useState("");
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);

  const refreshQuota = useCallback(() => {
    void getQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  }, []);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota, flows.length]);

  const open = (id: string) => navigate({ to: "/editor/$id", params: { id } });

  const byUsine = new Map<string, typeof flows>();
  for (const f of flows) {
    const key = f.usine || "Site";
    const list = byUsine.get(key) ?? [];
    list.push(f);
    byUsine.set(key, list);
  }

  const atLimit = quota ? !quota.canCreate : false;

  const tryCreate = (
    builder: () => FlowDoc,
    meta?: Partial<Pick<FlowDoc, "nom" | "usine" | "atelier">>,
  ) => {
    if (quota && !quota.canCreate) {
      setLimitMsg(
        `Limite du plan ${quota.planLabel} atteinte (${quota.used}/${quota.maxFlows} flux). Passez en Pro pour continuer.`,
      );
      return null;
    }
    setLimitMsg(null);
    const id = createFrom(builder(), meta);
    refreshQuota();
    return id;
  };

  const confirmCreate = () => {
    if (!creating) return;
    const id = tryCreate(creating.build, {
      nom: nom.trim() || creating.build().nom,
      usine: usine.trim() || creating.build().usine,
      atelier: atelier.trim() || creating.build().atelier,
    });
    setCreating(null);
    if (id) open(id);
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
        <BrandMark to="/" />
        <div className="flex items-center gap-2">
          {quota ? (
            <span
              className={
                quota.isPaid
                  ? "hidden rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] font-medium text-ok sm:inline"
                  : "hidden rounded-full border border-border px-2 py-0.5 text-[10px] text-muted sm:inline"
              }
              title="Quota de flux"
            >
              {quota.planLabel} · {quota.used}/{quota.maxFlows} flux
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0"
            title="Rappels Lean"
          >
            <Link to="/glossaire" aria-label="Rappels Lean">
              <BookOpen className="size-4" />
            </Link>
          </Button>
          <AccountChip />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Bêta privée</p>
            <h1 className="font-display text-3xl font-extrabold">Atelier</h1>
            <p className="mt-1 text-sm text-muted">
              Vos flux sont synchronisés avec votre compte
              {quota ? ` · plan ${quota.planLabel}` : ""}.
            </p>
            <Link
              to="/glossaire"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <BookOpen className="size-3.5" />
              Rappels Lean — VSM, takt, Yamazumi…
            </Link>
          </div>
        </div>

        {limitMsg ? (
          <div className="mt-4 flex flex-col gap-2 rounded-md border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              <Lock className="mt-0.5 size-4 shrink-0" />
              {limitMsg}
            </span>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/compte">Voir les plans</Link>
            </Button>
          </div>
        ) : null}

        {quota && !quota.canCreate ? (
          <div className="mt-4 flex flex-col gap-2 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              Plan <strong>{quota.planLabel}</strong> : {quota.used}/{quota.maxFlows} flux utilisés.
              Passez en Pro pour 50 flux et 5 sièges.
            </span>
            <Button size="sm" asChild>
              <Link to="/compte">Upgrade</Link>
            </Button>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {TEMPLATE_CARDS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={atLimit}
              onClick={() => {
                if (atLimit) {
                  setLimitMsg(
                    `Limite du plan ${quota?.planLabel ?? "Gratuit"} atteinte. Passez en Pro pour créer un nouveau flux.`,
                  );
                  return;
                }
                const base = t.build();
                setCreating(t);
                setNom(t.id === "blank" ? "" : base.nom);
                setUsine(base.usine);
                setAtelier(base.atelier);
              }}
              className="rounded-lg border border-border bg-card p-4 text-left hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex flex-row items-center gap-2 text-accent">
                {atLimit ? <Lock className="size-4 shrink-0" /> : <Plus className="size-4 shrink-0" />}
                <span className="font-display font-bold text-fg">{t.title}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
            </button>
          ))}
        </div>

        {flows.length === 0 ? (
          <section className="mt-12 rounded-xl border border-dashed border-accent/30 bg-accent/5 p-8 text-center">
            <Sparkles className="mx-auto size-8 text-accent" />
            <h2 className="mt-3 font-display text-xl font-bold">Bienvenue sur Kaiflow</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Modélisez une ligne en quelques minutes, repérez le goulot et exportez un rapport PDF.
              Choisissez un modèle ci-dessus ou partez d’un flux vierge.
            </p>
          </section>
        ) : (
          <div className="mt-12 space-y-10">
            {[...byUsine.entries()].map(([usineName, list]) => (
              <section key={usineName}>
                <h2 className="mb-3 font-display text-xl font-bold">{usineName}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((f) => (
                    <FlowCard
                      key={f.id}
                      flow={f}
                      onDuplicate={() => {
                        const id = duplicate(f.id);
                        if (id) open(id);
                      }}
                      onDelete={() => {
                        if (confirm(`Supprimer « ${f.nom} » ?`)) {
                          deleteFlow(f.id);
                          refreshQuota();
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {creating ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Nouveau flux</h2>
              <Button variant="ghost" size="icon" onClick={() => setCreating(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-muted">Nom</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ligne A — Assemblage"
                  autoFocus
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Usine / site</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
                  value={usine}
                  onChange={(e) => setUsine(e.target.value)}
                  placeholder="Usine Nord"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Atelier</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
                  value={atelier}
                  onChange={(e) => setAtelier(e.target.value)}
                  placeholder="Assemblage"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreating(null)}>
                Annuler
              </Button>
              <Button onClick={confirmCreate}>Créer</Button>
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
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            warn ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok"
          }`}
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
