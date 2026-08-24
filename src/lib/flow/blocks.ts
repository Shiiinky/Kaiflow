import type { FlowMode, NodeType } from "./types";

export const PHYSICAL_BLOCKS: {
  type: NodeType;
  label: string;
  hint: string;
}[] = [
  { type: "work", label: "Poste", hint: "Cycle, opérateurs, machines" },
  { type: "stock", label: "Stock", hint: "Encours et consigne max" },
  { type: "control", label: "Contrôle", hint: "Qualité, TRS, rebuts" },
  { type: "transport", label: "Transport", hint: "Temps et distance" },
];

export const ADMIN_BLOCKS: {
  type: NodeType;
  label: string;
  hint: string;
}[] = [
  { type: "startend", label: "Début / Fin", hint: "Bornes du processus" },
  { type: "step", label: "Étape", hint: "Traitement, rôle, durée" },
  { type: "decision", label: "Décision", hint: "Oui / non, validation" },
  { type: "queue", label: "File d'attente", hint: "Dossiers en attente" },
];

export function blocksFor(mode: FlowMode | undefined) {
  return mode === "admin" ? ADMIN_BLOCKS : PHYSICAL_BLOCKS;
}

/** @deprecated use blocksFor */
export const BLOCKS = PHYSICAL_BLOCKS;

export const NODE_W = 188;
export const NODE_H = 122;
