import { createNode, DEFAULT_SETTINGS, uid } from "./engine";
import type { FlowDoc, FlowMode } from "./types";

function connect(from: string, to: string) {
  return { id: uid("c"), from, to };
}

function doc(
  nom: string,
  usine: string,
  atelier: string,
  extra: Pick<FlowDoc, "settings" | "nodes" | "connections"> & { mode?: FlowMode },
): FlowDoc {
  return {
    id: uid("flow"),
    nom,
    usine,
    atelier,
    updatedAt: Date.now(),
    mode: extra.mode ?? "physical",
    johnsonJobs: [],
    settings: extra.settings,
    nodes: extra.nodes,
    connections: extra.connections,
  };
}

export function makeBlankFlow(nom = "Nouvelle ligne"): FlowDoc {
  return doc(nom, "Site principal", "Atelier", {
    mode: "physical",
    settings: { ...DEFAULT_SETTINGS },
    nodes: [],
    connections: [],
  });
}

export function makeBlankAdminFlow(nom = "Nouveau processus"): FlowDoc {
  return doc(nom, "Direction", "Processus", {
    mode: "admin",
    settings: { demand: 40, openingTime: 480, plannedBreaks: 60 },
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
    mode: "physical",
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
  const turn = createNode("work", "Tournage CNC", 210, 160, {
    cycle: 180,
    ops: 1,
    machines: 1,
    dispo: 88,
  });
  const mill = createNode("work", "Fraisage", 400, 160, {
    cycle: 140,
    ops: 1,
    machines: 1,
    dispo: 90,
  });
  const qc = createNode("control", "Contrôle final", 590, 160, { cycle: 45, ops: 1 });
  return doc("Îlot usinage CNC", "Usine Sud", "Usinage", {
    mode: "physical",
    settings: { demand: 120, openingTime: 480, plannedBreaks: 30 },
    nodes: [raw, turn, mill, qc],
    connections: [connect(raw.id, turn.id), connect(turn.id, mill.id), connect(mill.id, qc.id)],
  });
}

/** Exemple logigramme : demande d'achat */
export function makeAchatAdmin(): FlowDoc {
  const start = createNode("startend", "Début", 40, 160);
  const demande = createNode("step", "Saisie demande", 200, 150, {
    cycle: 180,
    ops: 1,
    role: "Demandeur",
    vsm: "va",
  });
  const queue1 = createNode("queue", "File validation", 380, 150, {
    cycle: 86400,
    qty: 12,
    vsm: "nva",
  });
  const decide = createNode("decision", "Budget OK ?", 560, 150, {
    cycle: 120,
    role: "Manager",
    vsm: "nva",
  });
  const commande = createNode("step", "Passer commande", 740, 80, {
    cycle: 300,
    ops: 1,
    role: "Achats",
    vsm: "va",
  });
  const refuse = createNode("step", "Refus / reformulation", 740, 220, {
    cycle: 240,
    ops: 1,
    role: "Demandeur",
    rebut: 100,
    vsm: "nva",
  });
  const end = createNode("startend", "Fin", 920, 150);
  return doc("Processus demande d'achat", "Siège", "Achats", {
    mode: "admin",
    settings: { demand: 25, openingTime: 480, plannedBreaks: 60 },
    nodes: [start, demande, queue1, decide, commande, refuse, end],
    connections: [
      connect(start.id, demande.id),
      connect(demande.id, queue1.id),
      connect(queue1.id, decide.id),
      connect(decide.id, commande.id),
      connect(decide.id, refuse.id),
      connect(commande.id, end.id),
      connect(refuse.id, demande.id),
    ],
  });
}

export const TEMPLATE_CARDS = [
  {
    id: "blank",
    title: "Flux physique",
    subtitle: "VSM atelier — canvas libre",
    mode: "physical" as const,
    build: () => makeBlankFlow(),
  },
  {
    id: "blank-admin",
    title: "Processus admin",
    subtitle: "Logigramme — étapes & décisions",
    mode: "admin" as const,
    build: () => makeBlankAdminFlow(),
  },
  {
    id: "ligne-a",
    title: "Assemblage",
    subtitle: "Goulot à 78s — démo VSM",
    mode: "physical" as const,
    build: makeLigneA,
  },
  {
    id: "usinage",
    title: "Usinage série",
    subtitle: "Tournage + fraisage",
    mode: "physical" as const,
    build: makeUsinage,
  },
  {
    id: "achat-admin",
    title: "Demande d'achat",
    subtitle: "Logigramme avec file & décision",
    mode: "admin" as const,
    build: makeAchatAdmin,
  },
] as const;
