import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChartColumn,
  Clock3,
  FileText,
  GitBranch,
  ScanSearch,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { analyzeFlow, formatSeconds } from "@/lib/flow/engine";
import { makeLigneA } from "@/lib/flow/templates";
import type { FlowDoc } from "@/lib/flow/types";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [{ title: "Kaiflow — Modélisez vos flux. Pilotez votre performance." }],
  }),
});

function Home() {
  return (
    <div className="landing-shell min-h-dvh text-fg">
      <div className="landing-mesh" />
      <nav className="sticky top-0 z-30 border-b border-border/80 bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <BrandMark />
          <div className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted md:flex">
            <a href="#produit" className="hover:text-accent">
              Produit
            </a>
            <a href="#methode" className="hover:text-accent">
              Méthode
            </a>
            <a href="#demo" className="hover:text-accent">
              Live
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ok sm:inline-flex">
              <span className="size-1.5 rounded-full bg-ok shadow-[0_0_8px_#22d3a0]" />
              sys.online
            </span>
            <Button asChild size="sm">
              <Link to="/app">Ouvrir l'atelier</Link>
            </Button>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden px-4 pb-20 pt-12 md:px-6 md:pb-28 md:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              <span className="size-1.5 animate-[kai-pulse_1.8s_ease-in-out_infinite] rounded-full bg-accent shadow-[0_0_10px_#00e5ff]" />
              moteur vsm · temps réel
            </p>
            <h1 className="mt-5 font-display text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-6xl lg:text-7xl">
              La ligne,
              <span className="block text-fg">comme un système.</span>
              <span className="mt-1 block bg-gradient-to-r from-accent to-ok bg-clip-text text-transparent">
                Le goulot, nommé.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-2 md:text-lg">
              Cartographiez un flux, calculez takt net et TRS, voyez où la capacité se brise.
              Pas de tableur. Pas de compte.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/app">
                  Lancer la cartographie
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#demo">Manipuler le goulot</a>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-border bg-border">
              <HeroStat k="latence" v="3 min" d="1re ligne" />
              <HeroStat k="moteur" v="100%" d="auto" />
              <HeroStat k="accès" v="0 login" d="local" />
            </div>
          </div>
          <LiveDemo />
        </div>
      </header>

      <section id="produit" className="relative px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">/ produit</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
                Un atelier.
                <span className="block">Tous les signaux.</span>
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-sm text-muted md:block">
              Les mêmes calculs que le terrain — takt, TRS, VA/NVA — dans un canvas unique.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-6 md:grid-rows-2">
            <Bento className="md:col-span-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-accent">
                    <ScanSearch className="size-4" />
                    <h3 className="font-display text-lg font-bold text-fg">Détection du goulot</h3>
                  </div>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-2">
                    Postes parallèles fusionnés. Dès que le cycle utile dépasse le takt, le poste
                    s'allume — plus d'intuition d'atelier.
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-warn">alert</span>
              </div>
              <div className="mt-6 space-y-3">
                <LoadBar label="Takt net" value={72} color="bg-accent" />
                <LoadBar label="Assemblage" value={100} color="bg-warn" over />
                <LoadBar label="Contrôle" value={48} color="bg-ok" />
              </div>
            </Bento>
            <Bento className="md:col-span-2">
              <ChartColumn className="size-4 text-accent" />
              <h3 className="mt-3 font-display text-lg font-bold">Yamazumi</h3>
              <p className="mt-2 text-sm text-muted-2">Barres VA / NVA, ligne de takt, ETP cible.</p>
              <div className="relative mt-5 flex h-24 items-end gap-1.5">
                {[42, 78, 35, 28].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-xs ${i === 1 ? "bg-warn" : "bg-accent/70"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
                <div className="pointer-events-none absolute inset-x-0 top-[28%] border-t border-dashed border-accent/50" />
              </div>
            </Bento>
            <Bento className="md:col-span-2">
              <Clock3 className="size-4 text-accent" />
              <h3 className="mt-3 font-display text-lg font-bold">MOS terrain</h3>
              <p className="mt-2 text-sm text-muted-2">
                Chrono, Gantt, activités non cyclées amorties à la pièce.
              </p>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full">
                <div className="w-[38%] bg-manual" />
                <div className="w-[34%] bg-machine" />
                <div className="w-[16%] bg-move" />
                <div className="w-[12%] bg-wait" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-muted">
                <span>manuel</span>
                <span>machine</span>
                <span>attente</span>
              </div>
            </Bento>
            <Bento className="md:col-span-2">
              <Workflow className="size-4 text-accent" />
              <h3 className="mt-3 font-display text-lg font-bold">Johnson</h3>
              <p className="mt-2 text-sm text-muted-2">n jobs, 2 machines. Makespan vs FIFO.</p>
              <div className="mt-4 space-y-1.5">
                <div className="h-1.5 w-4/5 rounded-full bg-accent/80" />
                <div className="ml-[18%] h-1.5 w-3/5 rounded-full bg-warn/80" />
              </div>
            </Bento>
            <Bento className="md:col-span-2">
              <FileText className="size-4 text-accent" />
              <h3 className="mt-3 font-display text-lg font-bold">Rapport</h3>
              <p className="mt-2 text-sm text-muted-2">KPIs, postes, plan d'action. Imprimable.</p>
              <div className="mt-4 space-y-1.5">
                <div className="h-1 w-full rounded-full bg-border-2" />
                <div className="h-1 w-4/5 rounded-full bg-border-2" />
                <div className="h-1 w-2/3 rounded-full bg-accent/40" />
              </div>
            </Bento>
          </div>
        </div>
      </section>

      <section id="methode" className="relative border-y border-border bg-surface/50 px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">/ méthode</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
            Trois gestes. L'analyse suit.
          </h2>
          <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-5 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent md:block" />
            <Step n="01" t="Posez les blocs" d="Poste, stock, contrôle, transport. Le canvas infini parle VSM." />
            <Step n="02" t="Branchez le réel" d="Cycle, ops, machines, dispo, rebuts — ou un MOS chronométré." />
            <Step n="03" t="Lisez le système" d="Takt net, goulot, simulation +1 machine, séquençage Johnson." />
          </ol>
        </div>
      </section>

      <section className="relative px-4 py-20 md:px-6">
        <div className="hud-corners mx-auto max-w-6xl overflow-hidden rounded-lg border border-accent/20 bg-card/80 px-6 py-14 text-center md:px-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">ready · local</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">
            La démo Ligne A est déjà chargée.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-2">
            Changez un cycle. Le goulot bouge. Rien n'est envoyé sur un serveur.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/app">
              Ouvrir l'atelier
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <BrandMark />
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            flux · takt · goulots · stockage navigateur
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroStat({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">{k}</div>
      <div className="font-display text-xl font-extrabold tabular-nums">{v}</div>
      <div className="text-[11px] text-muted">{d}</div>
    </div>
  );
}

function Bento({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={`relative overflow-hidden rounded-md border border-border bg-card/90 p-5 ${className}`}
    >
      {children}
    </article>
  );
}

function LoadBar({
  label,
  value,
  color,
  over,
}: {
  label: string;
  value: number;
  color: string;
  over?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
        <span className={over ? "text-warn" : ""}>{label}</span>
        <span className={over ? "text-warn" : "text-fg"}>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <li className="relative">
      <div className="relative z-10 mb-4 grid size-10 place-items-center rounded-full border border-accent/40 bg-bg font-mono text-xs text-accent">
        {n}
      </div>
      <h3 className="font-display text-xl font-bold">{t}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-2">{d}</p>
    </li>
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
    return <div className="h-[420px] rounded-md border border-border bg-card" />;
  }
  const a = analyzeFlow(doc);
  const stations = doc.nodes.filter((n) => n.type !== "stock");
  const over = (a.rendement ?? 100) < 100;
  const taktPct = a.takt && a.maxCycle ? Math.min(100, Math.round((a.takt / a.maxCycle) * 100)) : 0;

  return (
    <div id="demo" className="relative">
      <div className="absolute -inset-3 rounded-lg bg-accent/5 blur-2xl" />
      <div className="hud-corners relative overflow-hidden rounded-md border border-border-2 bg-[#0b1018] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="landing-scan" />
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="size-2 rounded-full bg-danger/80" />
          <span className="size-2 rounded-full bg-warn/80" />
          <span className="size-2 rounded-full bg-ok/80" />
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            cam 01 · ligne a · usine nord
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ok">
            <span className="size-1.5 rounded-full bg-ok" />
            live
          </span>
        </div>
        <div className="relative bg-[linear-gradient(rgba(0,229,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] p-4">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            {stations.map((n, i) => {
              const hot = a.bottleneck?.ids.includes(n.id) && over;
              return (
                <div key={n.id} className="flex items-center gap-1 sm:gap-2">
                  {i > 0 ? (
                    <svg width="22" height="8" className="text-muted" aria-hidden>
                      <path d="M0 4h16" stroke="currentColor" strokeWidth="1" />
                      <path d="M14 1l6 3-6 3" fill="currentColor" />
                    </svg>
                  ) : null}
                  <div
                    className={`min-w-[78px] rounded-xs border px-2 py-2 text-center ${
                      hot
                        ? "border-warn bg-warn/10 shadow-[0_0_22px_rgba(255,107,53,0.25)]"
                        : "border-border bg-card/80"
                    }`}
                  >
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted">{n.label}</div>
                    <div
                      className={`font-display text-sm font-bold tabular-nums ${hot ? "text-warn" : "text-fg"}`}
                    >
                      {n.cycle}s
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <label className="mt-5 block">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
              <span>cycle assemblage</span>
              <span className="text-fg">{asm}s</span>
            </div>
            <input
              type="range"
              min={40}
              max={120}
              value={asm}
              onChange={(e) => setAsm(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
          </label>

          <div className="mt-3">
            <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
              <span>charge vs takt</span>
              <span className={over ? "text-warn" : "text-ok"}>{over ? "surcharge" : "ok"}</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-surface-2">
              <div className={`h-full ${over ? "bg-warn" : "bg-ok"}`} style={{ width: "100%" }} />
              <div
                className="absolute inset-y-0 w-0.5 bg-accent shadow-[0_0_8px_#00e5ff]"
                style={{ left: `${taktPct}%` }}
                title="takt"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
          <Kpi label="Takt" value={formatSeconds(a.takt)} />
          <Kpi label="Cycle" value={formatSeconds(a.maxCycle)} warn={over} />
          <Kpi label="Rendement" value={a.rendement !== null ? `${a.rendement}%` : "—"} warn={(a.rendement ?? 100) < 85} />
          <Kpi label="Goulot" value={a.bottleneck?.label ?? "—"} warn={over} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="border-r border-border px-3 py-3 last:border-r-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{label}</div>
      <div
        className={`truncate font-display text-lg font-extrabold tabular-nums ${warn ? "text-warn" : "text-accent"}`}
      >
        {value}
      </div>
    </div>
  );
}
