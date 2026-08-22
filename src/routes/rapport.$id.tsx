import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Yamazumi } from "@/components/editor/yamazumi";
import { analyzeFlow, formatDuration, formatSeconds, getEffectiveCycle } from "@/lib/flow/engine";
import { useFlowStore } from "@/lib/flow/store";

export const Route = createFileRoute("/rapport/$id")({
  component: () => (
    <RequireAuth>
      <Report />
    </RequireAuth>
  ),
});

function Report() {
  const { id } = Route.useParams();
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === id));
  if (!flow) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        Flux introuvable.{" "}
        <Link className="ml-2 text-accent" to="/app">
          Retour
        </Link>
      </div>
    );
  }
  const a = analyzeFlow(flow);
  const stations = flow.nodes.filter((n) => n.type === "work" || n.type === "control");

  return (
    <div className="min-h-dvh bg-bg print:bg-white print:text-black">
      <header className="no-print flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <BrandMark to="/app" />
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link to="/editor/$id" params={{ id }}>
              Éditeur
            </Link>
          </Button>
          <Button onClick={() => window.print()}>Imprimer / PDF</Button>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-accent print:text-neutral-600">Rapport de flux</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold">{flow.nom}</h1>
        <p className="text-sm text-muted">
          {flow.usine} · {flow.atelier} · {new Date(flow.updatedAt).toLocaleString("fr-FR")}
        </p>
        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Takt", formatSeconds(a.takt)],
            ["Cycle goulot", formatSeconds(a.maxCycle)],
            ["Rendement", a.rendement !== null ? `${a.rendement}%` : "—"],
            ["Lead time", formatDuration(a.leadTime)],
            ["VA", a.vaPercent !== null ? `${a.vaPercent}%` : "—"],
            ["Débit", a.throughputPerHour !== null ? `${a.throughputPerHour} p/h` : "—"],
            ["ETP", a.etp !== null ? String(a.etp) : "—"],
            ["WIP", `${a.wip} pcs`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border p-3 print:border-neutral-300">
              <div className="text-[10px] uppercase text-muted">{k}</div>
              <div className="font-display text-xl font-semibold tabular-nums">{v}</div>
            </div>
          ))}
        </section>
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Yamazumi</h2>
          <div className="mt-2 h-48 rounded-md border border-border print:border-neutral-300">
            <Yamazumi analysis={a} />
          </div>
        </section>
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Postes</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Poste</th>
                <th>Cycle utile</th>
                <th>Machines</th>
                <th>Dispo</th>
                <th>Rebut</th>
                <th>VSM</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((n) => (
                <tr key={n.id} className="border-t border-border">
                  <td className="py-2">{n.label}</td>
                  <td className="tabular-nums">{getEffectiveCycle(n)}s</td>
                  <td className="tabular-nums">{n.machines}</td>
                  <td className="tabular-nums">{n.dispo}%</td>
                  <td className="tabular-nums">{n.rebut}%</td>
                  <td>{n.vsm.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Plan d'action</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            {a.recommendations.map((r) => (
              <li key={r.id}>
                <span className="font-medium">{r.title}.</span> {r.detail}
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
