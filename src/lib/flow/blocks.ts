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
  { type: "startend", label: "Début / Fin", hint: "Point d'entrée ou de sortie" },
  { type: "step", label: "Action", hint: "Responsable, entrées, sorties" },
  { type: "decision", label: "Décision", hint: "Losange Oui / Non" },
  { type: "document", label: "Document", hint: "Pièce, dossier, livrable" },
  { type: "queue", label: "File d'attente", hint: "Encours de dossiers" },
];

export function blocksFor(mode: FlowMode | undefined) {
  return mode === "admin" ? ADMIN_BLOCKS : PHYSICAL_BLOCKS;
}

/** @deprecated use blocksFor */
export const BLOCKS = PHYSICAL_BLOCKS;

export const NODE_W = 188;
export const NODE_H = 122;
/** Losange un peu plus compact */
export const DECISION_SIZE = 140;
