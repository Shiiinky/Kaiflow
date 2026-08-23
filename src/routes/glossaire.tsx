import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BrandMark } from "@/components/brand";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/glossaire")({
  component: GlossairePage,
  head: () => ({
    meta: [{ title: "Glossaire Lean — Kaiflow" }],
  }),
});

type Term = {
  id: string;
  title: string;
  aliases: string[];
  category: "flux" | "temps" | "capacite" | "outil";
  definition: string;
  inKaiflow: string;
  tip?: string;
};

const TERMS: Term[] = [
  {
    id: "vsm",
    title: "VSM — Value Stream Mapping",
    aliases: ["cartographie de flux", "carte de flux de valeur"],
    category: "flux",
    definition:
      "Représentation visuelle de toutes les étapes (postes, stocks, contrôles, transports) qui font passer un produit de la matière au client. Objectif : rendre le flux visible, mesurer les temps, identifier les gaspillages et le goulot.",
    inKaiflow:
      "Le canvas Kaiflow est une VSM interactive : vous posez les blocs, reliez les postes, et les KPIs (takt, cycle, lead time) se recalculent en direct.",
    tip: "Commencez par le flux physique réel, pas le flux idéal. Une bonne VSM décrit ce qui se passe aujourd’hui.",
  },
  {
    id: "takt",
    title: "Takt time",
    aliases: ["temps takt", "rythme client"],
    category: "temps",
    definition:
      "Rythme de production imposé par la demande client. Formule classique : temps disponible net ÷ demande de la période. Si le takt est de 60 s, il faut sortir une pièce toutes les 60 secondes pour coller à la demande.",
    inKaiflow:
      "Takt = (temps d’ouverture − pauses planifiées) × 60 ÷ demande. Affiché dans la barre KPI et sur le Yamazumi comme ligne de référence.",
    tip: "Un poste dont le cycle utile dépasse le takt est en retard sur le client — c’est le signal du goulot.",
  },
  {
    id: "cycle",
    title: "Temps de cycle",
    aliases: ["cycle time", "temps de passage"],
    category: "temps",
    definition:
      "Temps nécessaire à un poste pour traiter une pièce (ou un lot). Inclut le travail manuel, machine, déplacements et attentes mesurés au poste.",
    inKaiflow:
      "Cycle saisi sur chaque nœud, ou calculé depuis un MOS (max opérateur / machine + non-cyclés amortis). Le cycle utile tient compte des machines, de la dispo et des rebuts.",
  },
  {
    id: "trs",
    title: "TRS — Taux de Rendement Synthétique",
    aliases: ["OEE", "efficacité globale"],
    category: "capacite",
    definition:
      "Indicateur de performance d’un équipement ou d’un poste. Approche simplifiée terrain : disponibilité × performance × qualité. Un TRS bas révèle des arrêts, des micro-pertes ou des rebuts.",
    inKaiflow:
      "Kaiflow intègre dispo (%) et rebuts (%) dans le temps utile du poste : cycle utile = cycle brut ÷ (machines × dispo × (1 − rebuts)). C’est le levier TRS côté capacité.",
    tip: "Améliorer la dispo ou réduire les rebuts peut faire redescendre un poste sous le takt sans changer le cycle nominal.",
  },
  {
    id: "goulot",
    title: "Goulot d’étranglement",
    aliases: ["bottleneck", "contrainte"],
    category: "capacite",
    definition:
      "Poste (ou groupe de postes) qui limite le débit de toute la ligne. C’est celui dont le cycle utile est le plus long. Améliorer ailleurs ne libère pas de capacité globale tant que le goulot n’est pas traité.",
    inKaiflow:
      "Détecté automatiquement : max des cycles utiles (postes parallèles fusionnés). Alertes et simulation « +1 machine » ciblent ce poste.",
    tip: "Protégez le goulot : priorité matière, moins d’arrêts, moins de changements. Tout temps perdu au goulot est perdu pour la ligne.",
  },
  {
    id: "yamazumi",
    title: "Yamazumi",
    aliases: ["diagramme en piles", "équilibrage"],
    category: "outil",
    definition:
      "Diagramme en barres empilées montrant la charge de chaque poste (souvent VA / NVA) face à la ligne de takt. Sert à équilibrer la ligne : retirer du travail au goulot, en ajouter aux postes sous-chargés.",
    inKaiflow:
      "Panneau Yamazumi dans l’éditeur : barres par poste, part VA/NVA, ligne de takt, ETP estimé. Les recommandations proposent de transférer des tâches vers le goulot.",
  },
  {
    id: "va-nva",
    title: "VA / NVA — Valeur ajoutée",
    aliases: ["value added", "non value added", "gaspillage"],
    category: "flux",
    definition:
      "VA : opérations qui transforment le produit de façon que le client paie (usinage, assemblage utile). NVA : tout le reste (attente, transport, contrôle excessif, reprise). Le Lean vise à maximiser le ratio VA / temps total.",
    inKaiflow:
      "Chaque poste peut porter un % VA. L’analyse globale affiche le pourcentage de valeur ajoutée de la ligne et alerte si trop bas.",
  },
  {
    id: "mos",
    title: "MOS — Method Observation Sheet",
    aliases: ["chronométrage", "observation de méthode", "fiche MOS"],
    category: "outil",
    definition:
      "Relevé terrain des tâches d’un poste, chronométrées (manuel, machine, déplacement, attente) plus les activités non cyclées (réglages, changements d’outil amortis par pièce).",
    inKaiflow:
      "Dialogue MOS dans l’éditeur : liste de tâches, Gantt simple, non-cyclés. Le cycle effectif du poste est recalculé à partir du MOS.",
    tip: "Chronométrez plusieurs cycles, notez les irrégularités. Un MOS honnête vaut mieux qu’un cycle « théorique » trop optimiste.",
  },
  {
    id: "lead-time",
    title: "Lead time / chemin critique",
    aliases: ["délai de traversée", "temps de traversée"],
    category: "temps",
    definition:
      "Temps total pour qu’une pièce traverse tout le flux, stocks inclus. Le chemin critique est la séquence de postes/stocks qui détermine ce délai maximum.",
    inKaiflow:
      "Calculé sur le graphe de connexions (chemin le plus long en temps). Utile pour comparer scénarios et impact des stocks intermédiaires.",
  },
  {
    id: "etp",
    title: "ETP — Équivalent Temps Plein",
    aliases: ["effectif", "main d’œuvre"],
    category: "capacite",
    definition:
      "Nombre d’opérateurs « complets » nécessaires pour tenir le rythme. Souvent dérivé de la charge totale de travail divisée par le temps disponible par personne.",
    inKaiflow:
      "Estimé dans le Yamazumi à partir des charges postes et du takt. Sert de base de discussion dimensionnement équipe.",
  },
  {
    id: "johnson",
    title: "Séquençage de Johnson",
    aliases: ["algorithme de Johnson", "ordonnancement 2 machines"],
    category: "outil",
    definition:
      "Méthode classique pour ordonner n jobs sur 2 machines (ou 2 étapes) afin de minimiser le makespan (temps total de fin). On priorise les jobs courts en amont, longs en aval selon une règle simple.",
    inKaiflow:
      "Panneau Johnson : saisie des jobs (temps machine A / B), calcul de la séquence optimale et du makespan. Utile pour lignes d’usinage ou cellules à deux étapes critiques.",
  },
  {
    id: "paralleles",
    title: "Postes parallèles",
    aliases: ["ressources parallèles", "fusion de postes"],
    category: "capacite",
    definition:
      "Plusieurs postes qui réalisent le même type d’opération en parallèle. Le débit du groupe dépend du cycle le plus lent et du nombre de ressources.",
    inKaiflow:
      "Les postes reliés en parallèle sont regroupés pour le calcul du goulot : on compare le cycle équivalent du groupe au takt, pas chaque machine isolée.",
  },
  {
    id: "dispo-rebuts",
    title: "Disponibilité & rebuts",
    aliases: ["arrêts", "scrap", "taux de rebut"],
    category: "capacite",
    definition:
      "Disponibilité : part du temps où le poste peut réellement produire (hors pannes, changements, manque matière). Rebuts : part des pièces non conformes. Les deux réduisent le débit utile.",
    inKaiflow:
      "Champs « dispo % » et « rebut % » sur chaque poste de travail / contrôle. Ils dilatent le cycle utile et peuvent faire basculer un poste au-dessus du takt.",
  },
  {
    id: "wip",
    title: "WIP — Work In Progress",
    aliases: ["encours", "stocks intermédiaires"],
    category: "flux",
    definition:
      "Quantité de pièces en cours entre le début et la fin du flux. Un WIP élevé allonge le lead time (loi de Little) et masque souvent les problèmes de flux.",
    inKaiflow:
      "Les nœuds « stock » portent un niveau d’encours. L’analyse relie WIP, takt et recommandations de réduction d’encours.",
  },
];

const CATEGORIES: Record<Term["category"], string> = {
  flux: "Flux & valeur",
  temps: "Temps",
  capacite: "Capacité",
  outil: "Outils Kaiflow",
};

function GlossairePage() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("vsm");
  const [cat, setCat] = useState<Term["category"] | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (!q) return true;
      const hay = [t.title, ...t.aliases, t.definition, t.inKaiflow, t.tip ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, cat]);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <BrandMark to="/" />
          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="hidden text-xs text-muted hover:text-accent sm:inline"
            >
              Atelier
            </Link>
            <Link
              to="/"
              className="rounded-sm border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
            >
              Accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="flex items-start gap-3">
          <span className="mt-1 grid size-10 place-items-center rounded-sm border border-accent/30 bg-accent/10 text-accent">
            <BookOpen className="size-5" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              Rappels Lean
            </p>
            <h1 className="font-display text-3xl font-extrabold">Glossaire</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-2">
              Les mots du terrain, tels qu’ils sont utilisés dans Kaiflow. Pas de théorie longue :
              définition, calcul dans l’outil, et un conseil opérationnel.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher : takt, yamazumi, goulot…"
              className="h-11 w-full rounded-sm border border-border bg-surface pl-10 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
              Tous
            </FilterChip>
            {(Object.keys(CATEGORIES) as Term["category"][]).map((c) => (
              <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
                {CATEGORIES[c]}
              </FilterChip>
            ))}
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {filtered.length === 0 ? (
            <li className="rounded-md border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
              Aucun terme ne correspond à « {query} ».
            </li>
          ) : (
            filtered.map((t) => {
              const open = openId === t.id;
              return (
                <li
                  key={t.id}
                  id={t.id}
                  className="overflow-hidden rounded-md border border-border bg-surface"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-surface-2/60"
                    onClick={() => setOpenId(open ? null : t.id)}
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <div className="font-display text-base font-bold text-fg">{t.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span className="rounded-full border border-border px-2 py-0.5">
                          {CATEGORIES[t.category]}
                        </span>
                        {t.aliases.slice(0, 2).map((a) => (
                          <span key={a}>{a}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted transition-transform",
                        open && "rotate-180 text-accent",
                      )}
                    />
                  </button>
                  {open ? (
                    <div className="space-y-3 border-t border-border px-4 py-4 text-sm text-muted-2">
                      <p>{t.definition}</p>
                      <div className="rounded-sm border border-accent/20 bg-accent/5 px-3 py-2.5">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
                          Dans Kaiflow
                        </div>
                        <p className="mt-1 text-fg/90">{t.inKaiflow}</p>
                      </div>
                      {t.tip ? (
                        <p className="text-xs text-muted">
                          <span className="font-medium text-warn">Conseil · </span>
                          {t.tip}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>

        <p className="mt-10 text-center text-xs text-muted">
          {TERMS.length} termes ·{" "}
          <Link to="/app" className="text-accent hover:underline">
            Retour à l’atelier
          </Link>
        </p>
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border text-muted hover:border-border-2 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
