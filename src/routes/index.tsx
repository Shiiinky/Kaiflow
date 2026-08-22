import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChartColumn,
  Clock3,
  Factory,
  GitBranch,
  ScanSearch,
  Shield,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { analyzeFlow, formatSeconds } from "@/lib/flow/engine";
import { makeLigneA } from "@/lib/flow/templates";
import type { FlowDoc } from "@/lib/flow/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/85 px-4 py-3 backdrop-blur-md md:px-8">
        <BrandMark />
        <div className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#produit" className="hover:text-fg">
            Produit
          </a>
          <a href="#methode" className="hover:text-fg">
            Méthode
          </a>
          <a href="#fonctionnalites" className="hover:text-fg">
            Fonctionnalités
          </a>
        </div>
        <Button asChild size="sm">
          <Link to="/app">Ouvrir l'atelier</Link>
        </Button>
      </nav>

      <header className="relative overflow-hidden px-4 pb-16 pt-14 md:px-8 md:pt-24">
        <div className="pointer-events-none absolute inset-0 canvas-grid opacity-70" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              Bêta ouverte · no-code
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Modélisez vos flux.
              <span className="block text-accent">Pilotez votre performance.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-2 md:text-lg">
              Cartographiez une ligne en quelques minutes, calculez takt, TRS et lead time, et voyez
              immédiatement où la capacité se brise.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/app">
                  Commencer la cartographie
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#demo">Voir le goulot en live</a>
              </Button>
            </div>
            <dl className="mt-10 flex flex-wrap gap-8 border-t border-border pt-6">
              <Stat n="3 min" l="pour la première ligne" />
              <Stat n="100%" l="des calculs automatisés" />
              <Stat n="0" l="compte requis pour tester" />
            </dl>
          </div>
          <LiveDemo />
        </div>
      </header>

      <section id="produit" className="border-y border-border bg-surface px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <Ikigai
            icon={<ScanSearch className="size-5" />}
            title="Rendre l'invisible visible"
            text="Le goulot n'est plus une intuition d'atelier. Il est nommé, chiffré, comparé au takt."
          />
          <Ikigai
            icon={<Clock3 className="size-5" />}
            title="L'efficacité sans l'effort"
            text="MOS, rebuts et disponibilité alimentent le temps utile. Plus de tableur parallèle."
          />
          <Ikigai
            icon={<GitBranch className="size-5" />}
            title="Aligner les visions"
            text="La même carte pour le terrain et la direction : Yamazumi, ETP, lead time."
          />
        </div>
      </section>

      <section id="methode" className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Conception</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Trois gestes, l'analyse en temps réel</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            <Step n="01" t="Glissez les blocs" d="Poste, stock, contrôle, transport — le canvas infini reprend le langage VSM." />
            <Step n="02" t="Renseignez le terrain" d="Cycle, opérateurs, machines, dispo, rebuts, ou un MOS chronométré." />
            <Step n="03" t="Lisez le goulot" d="Parallèles fusionnés, takt net, recommandations et simulation +1 machine." />
          </ol>
        </div>
      </section>

      <section id="fonctionnalites" className="border-t border-border bg-surface px-4 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Fonctionnalités</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Ce que l'atelier attendait du tableur</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feat icon={<GitBranch className="size-4" />} t="Éditeur visuel" d="Liaisons, zoom, undo, templates usinage et assemblage." />
            <Feat icon={<Shield className="size-4" />} t="Moteur TRS" d="Disponibilité × rebuts × nombre de machines dans le temps utile." />
            <Feat icon={<ScanSearch className="size-4" />} t="Détection du goulot" d="Postes en parallèle regroupés, alerte dès que le cycle dépasse le takt." />
            <Feat icon={<ChartColumn className="size-4" />} t="Yamazumi + ETP" d="Barres VA/NVA, ligne de takt, équivalent temps plein cible." />
            <Feat icon={<Workflow className="size-4" />} t="Séquençage Johnson" d="n jobs, 2 machines en série : ordre optimal et makespan vs FIFO." />
            <Feat icon={<Factory className="size-4" />} t="Rapport imprimable" d="KPIs, postes et plan d'action — plus « à venir »." />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card px-6 py-12 text-center">
          <h2 className="font-display text-3xl font-extrabold">Prêt à optimiser vos lignes ?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-2">
            La démo Ligne A est déjà chargée. Changez un cycle, voyez le goulot bouger.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/app">Ouvrir l'atelier</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted">
        Kaiflow — flux, takt, goulots. Données stockées localement dans ce navigateur.
      </footer>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold">{n}</div>
      <div className="text-sm text-muted">{l}</div>
    </div>
  );
}

function Ikigai({ icon, title, text }: { icon: ReactNode; title: string; text: ReactNode }) {
  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-sm bg-accent/10 text-accent">{icon}</div>
      <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-2">{text}</p>
    </article>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <li className="rounded-lg border border-border bg-card p-5">
      <div className="font-display text-sm text-accent">{n}</div>
      <h3 className="mt-2 font-display text-lg font-bold">{t}</h3>
      <p className="mt-2 text-sm text-muted-2">{d}</p>
    </li>
  );
}

function Feat({ icon, t, d }: { icon: ReactNode; t: string; d: string }) {
  return (
    <article className="rounded-lg border border-border bg-bg p-5">
      <div className="flex items-center gap-2 text-accent">
        {icon}
        <h3 className="font-display text-base font-bold text-fg">{t}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-2">{d}</p>
    </article>
  );
}

function LiveDemo() {
  const [base, setBase] = useState<FlowDoc | null>(null);
  const [asm, setAsm] = useState(78);
  useEffect(() => {
    setBase(makeLigneA());
  }, []);
  const doc = useMemo(() => {
    if (!base) return null;
    return {
      ...base,
      nodes: base.nodes.map((n) => (n.label === "Assemblage" ? { ...n, cycle: asm } : n)),
    };
  }, [asm, base]);
  if (!doc) {
    return <div className="h-[380px] rounded-lg border border-border bg-card" />;
  }
  const a = analyzeFlow(doc);
  const stations = doc.nodes.filter((n) => n.type !== "stock");

  return (
    <div id="demo" className="rounded-lg border border-border bg-card shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <span className="size-2.5 rounded-full bg-danger" />
        <span className="size-2.5 rounded-full bg-warn" />
        <span className="size-2.5 rounded-full bg-ok" />
        <span className="ml-auto text-xs text-muted">Ligne A — Assemblage</span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {stations.map((n, i) => {
            const hot = a.bottleneck?.ids.includes(n.id) && (a.rendement ?? 100) < 100;
            return (
              <div key={n.id} className="flex items-center gap-2">
                {i > 0 ? <span className="text-muted">→</span> : null}
                <div
                  className={`min-w-[92px] rounded-sm border px-2 py-2 text-center ${hot ? "border-warn" : "border-border"}`}
                >
                  <div className="text-[11px] text-muted">{n.label}</div>
                  <div className={`font-display text-sm tabular-nums ${hot ? "text-warn" : "text-fg"}`}>{n.cycle}s</div>
                </div>
              </div>
            );
          })}
        </div>
        <label className="mt-4 block text-xs text-muted">
          Cycle assemblage : <span className="tabular-nums text-fg">{asm}s</span>
          <input
            type="range"
            min={40}
            max={120}
            value={asm}
            onChange={(e) => setAsm(Number(e.target.value))}
            className="mt-2 w-full accent-accent"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Kpi label="Takt" value={formatSeconds(a.takt)} />
          <Kpi label="Temps de cycle" value={formatSeconds(a.maxCycle)} warn={(a.rendement ?? 100) < 100} />
          <Kpi label="Rendement" value={a.rendement !== null ? `${a.rendement}%` : "—"} warn={(a.rendement ?? 100) < 85} />
          <Kpi label="Goulot" value={a.bottleneck?.label ?? "—"} warn={(a.rendement ?? 100) < 100} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`font-display text-lg font-semibold tabular-nums ${warn ? "text-warn" : "text-accent"}`}>
        {value}
      </div>
    </div>
  );
}
