import type { NodeType } from "./types";

export const BLOCKS: {
  type: NodeType;
  label: string;
  hint: string;
}[] = [
  { type: "work", label: "Poste", hint: "Cycle, opérateurs, machines" },
  { type: "stock", label: "Stock", hint: "Encours et consigne max" },
  { type: "control", label: "Contrôle", hint: "Qualité, TRS, rebuts" },
  { type: "transport", label: "Transport", hint: "Temps et distance" },
];

export const NODE_W = 188;
export const NODE_H = 122;
