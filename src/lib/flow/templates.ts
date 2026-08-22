import { createNode, DEFAULT_SETTINGS, uid } from "./engine";
import type { FlowDoc } from "./types";

function connect(from: string, to: string) {
  return { id: uid("c"), from, to };
}

function doc(
  nom: string,
  usine: string,
  atelier: string,
  extra: Pick<FlowDoc, "settings" | "nodes" | "connections">,
): FlowDoc {
  return {
    id: uid("flow"),
    nom,
    usine,
    atelier,
    updatedAt: Date.now(),
    johnsonJobs: [],
    ...extra,
  };
}

export function makeBlankFlow(nom = "Nouvelle ligne"): FlowDoc {
  return doc(nom, "Site principal", "Atelier", {
    settings: { ...DEFAULT_SETTINGS },
    nodes: [],
    connections: [],
  });
}

export function makeLigneA(): FlowDoc {
  const stock = createNode("stock", "Composants", 28, 170, { qty: 36, stockMax: 40, vsm: "nva" });
  const appro = createNode("work", "Approvisionnement", 200, 160, { cycle: 42, ops: 1, machines: 1 });
  const asm = createNode("work", "Assemblage", 380, 160, { cycle: 78, ops: 2, machines: 1 });
  const qc = createNode("control", "Contrôle qualité", 560, 160, { cycle: 35, ops: 1, machines: 1 });
  const ship = createNode("transport", "Expédition", 740, 160, { cycle: 28, dist: 40, vsm: "nva" });
  return doc("Ligne A — Assemblage", "Usine Nord", "Assemblage", {
    settings: { demand: 466, openingTime: 480, plannedBreaks: 30 },
    nodes: [stock, appro, asm, qc, ship],
    connections: [
      connect(stock.id, appro.id),
      connect(appro.id, asm.id),
      connect(asm.id, qc.id),
      connect(qc.id, ship.id),
    ],
  });
}

export function makeUsinage(): FlowDoc {
  const raw = createNode("stock", "Encours brut", 28, 170, { qty: 80, stockMax: 100 });
  const turn = createNode("work", "Tournage CNC", 210, 160, { cycle: 180, ops: 1, machines: 1, dispo: 88 });
  const mill = createNode("work", "Fraisage", 400, 160, { cycle: 140, ops: 1, machines: 1, dispo: 90 });
  const qc = createNode("control", "Contrôle final", 590, 160, { cycle: 45, ops: 1 });
  return doc("Îlot usinage CNC", "Usine Sud", "Usinage", {
    settings: { demand: 120, openingTime: 480, plannedBreaks: 30 },
    nodes: [raw, turn, mill, qc],
    connections: [connect(raw.id, turn.id), connect(turn.id, mill.id), connect(mill.id, qc.id)],
  });
}

export const TEMPLATE_CARDS = [
  {
    id: "blank",
    title: "Flux vierge",
    subtitle: "Canvas libre",
    build: () => makeBlankFlow(),
  },
  {
    id: "ligne-a",
    title: "Assemblage",
    subtitle: "Goulot à 78s — démo",
    build: makeLigneA,
  },
  {
    id: "usinage",
    title: "Usinage série",
    subtitle: "Tournage + fraisage",
    build: makeUsinage,
  },
] as const;
