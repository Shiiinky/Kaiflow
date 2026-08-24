export type PhysicalNodeType = "work" | "stock" | "transport" | "control";
/** Processus admin / logigramme */
export type AdminNodeType = "step" | "decision" | "queue" | "startend" | "document";
export type NodeType = PhysicalNodeType | AdminNodeType;

export type FlowMode = "physical" | "admin";

export type VsmKind = "va" | "nva";

export interface MosTask {
  id: string;
  desc: string;
  manual: number;
  machine: number;
  move: number;
  wait: number;
  vsm: VsmKind;
}

export interface NonCycle {
  id: string;
  desc: string;
  temps: number;
  pieces: number;
  freq: number;
}

export interface Mos {
  processName: string;
  author: string;
  tasks: MosTask[];
  nc: NonCycle[];
}

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  /** Temps de cycle (s) — ou temps de traitement pour une étape admin */
  cycle: number;
  ops: number;
  machines: number;
  dispo: number;
  /** % rebut (physique) ou % rework (admin) */
  rebut: number;
  qty: number;
  stockMax: number;
  dist: number;
  vsm: VsmKind;
  mos: Mos;
  /** Responsable de l'action (flux admin) */
  role?: string;
  /** Ce qui entre dans l'étape (dossier, info, demande…) */
  inputs?: string;
  /** Ce qui ressort de l'étape (décision, document, statut…) */
  outputs?: string;
  /** Couleur de branche / catégorie (hex ou token) */
  color?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  /** Libellé de branche : Oui, Non, Si budget OK… */
  label?: string;
}

export interface LineSettings {
  demand: number;
  openingTime: number;
  plannedBreaks: number;
}

export interface JohnsonJob {
  id: string;
  name: string;
  t1: number;
  t2: number;
}

export interface FlowDoc {
  id: string;
  nom: string;
  usine: string;
  atelier: string;
  updatedAt: number;
  /** physical = VSM atelier · admin = processus / logigramme */
  mode?: FlowMode;
  settings: LineSettings;
  nodes: FlowNode[];
  connections: Connection[];
  johnsonJobs: JohnsonJob[];
}

export interface StationGroup {
  id: string;
  ids: string[];
  label: string;
  eqCycle: number;
  va: number;
  nva: number;
}

export interface Recommendation {
  id: string;
  severity: "critical" | "warn" | "info";
  title: string;
  detail: string;
}

export interface FlowAnalysis {
  takt: number;
  bottleneck: StationGroup | null;
  maxCycle: number;
  cadence: number;
  leadTime: number;
  vaPercent: number | null;
  rendement: number | null;
  charge: number | null;
  etp: number | null;
  throughputPerHour: number | null;
  balance: number | null;
  wip: number;
  groups: StationGroup[];
  recommendations: Recommendation[];
  stationCount: number;
  /** KPI spécifiques mode admin */
  decisionCount?: number;
  stepCount?: number;
  queueItems?: number;
  avgRework?: number | null;
}

export function isAdminMode(doc: Pick<FlowDoc, "mode"> | null | undefined): boolean {
  return doc?.mode === "admin";
}

export function isAdminNodeType(t: NodeType): boolean {
  return (
    t === "step" ||
    t === "decision" ||
    t === "queue" ||
    t === "startend" ||
    t === "document"
  );
}

export function isPhysicalNodeType(t: NodeType): boolean {
  return t === "work" || t === "stock" || t === "transport" || t === "control";
}
