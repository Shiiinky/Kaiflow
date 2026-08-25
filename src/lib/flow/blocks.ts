import type { FlowMode, FlowNode, NodeType, PortSide } from "./types";

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

export function nodeBox(node: Pick<FlowNode, "type">) {
  if (node.type === "decision") return { w: DECISION_SIZE, h: DECISION_SIZE };
  return { w: NODE_W, h: NODE_H };
}

export function portWorld(node: Pick<FlowNode, "type" | "x" | "y">, side: PortSide) {
  const { w, h } = nodeBox(node);
  if (side === "left") return { x: node.x, y: node.y + h / 2 };
  if (side === "right") return { x: node.x + w, y: node.y + h / 2 };
  if (side === "top") return { x: node.x + w / 2, y: node.y };
  return { x: node.x + w / 2, y: node.y + h };
}

export function inferSides(
  from: Pick<FlowNode, "type" | "x" | "y">,
  to: Pick<FlowNode, "type" | "x" | "y">,
  label?: string,
): { fromSide: PortSide; toSide: PortSide } {
  const l = (label ?? "").trim().toLowerCase();
  if (from.type === "decision" && (l === "oui" || l === "yes" || l === "ok")) {
    return { fromSide: "bottom", toSide: facingIncoming(from, to, "bottom") };
  }
  if (from.type === "decision" && (l === "non" || l === "no")) {
    return { fromSide: "right", toSide: facingIncoming(from, to, "right") };
  }
  const fb = nodeBox(from);
  const tb = nodeBox(to);
  const dx = to.x + tb.w / 2 - (from.x + fb.w / 2);
  const dy = to.y + tb.h / 2 - (from.y + fb.h / 2);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { fromSide: "right", toSide: "left" }
      : { fromSide: "left", toSide: "right" };
  }
  return dy >= 0 ? { fromSide: "bottom", toSide: "top" } : { fromSide: "top", toSide: "bottom" };
}

function facingIncoming(
  from: Pick<FlowNode, "type" | "x" | "y">,
  to: Pick<FlowNode, "type" | "x" | "y">,
  fromSide: PortSide,
): PortSide {
  const fb = nodeBox(from);
  const tb = nodeBox(to);
  const dx = to.x + tb.w / 2 - (from.x + fb.w / 2);
  const dy = to.y + tb.h / 2 - (from.y + fb.h / 2);
  if (fromSide === "right" || fromSide === "left") {
    if (Math.abs(dy) > Math.abs(dx) * 0.4) return dy >= 0 ? "top" : "bottom";
    return fromSide === "right" ? "left" : "right";
  }
  if (Math.abs(dx) > Math.abs(dy) * 0.4) return dx >= 0 ? "left" : "right";
  return fromSide === "bottom" ? "top" : "bottom";
}
