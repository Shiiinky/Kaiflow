import { create } from "zustand";
import { createNode, normalizeMos, uid } from "./engine";
import { removeFlow, saveFlow } from "./api";
import type { Connection, FlowDoc, FlowNode, JohnsonJob, LineSettings, NodeType } from "./types";

type Snapshot = Pick<
  FlowDoc,
  "nodes" | "connections" | "settings" | "nom" | "usine" | "atelier" | "johnsonJobs"
>;

interface FlowState {
  flows: FlowDoc[];
  hydrated: boolean;
  past: Record<string, Snapshot[]>;
  future: Record<string, Snapshot[]>;
  setHydrated: () => void;
  loadAll: (docs: FlowDoc[]) => void;
  getFlow: (id: string) => FlowDoc | undefined;
  createFrom: (doc: FlowDoc, meta?: Partial<Pick<FlowDoc, "nom" | "usine" | "atelier">>) => string;
  deleteFlow: (id: string) => void;
  renameMeta: (id: string, patch: Partial<Pick<FlowDoc, "nom" | "usine" | "atelier">>) => void;
  updateSettings: (id: string, settings: LineSettings) => void;
  addNode: (id: string, type: NodeType, label: string, x: number, y: number) => string;
  patchNode: (flowId: string, nodeId: string, patch: Partial<FlowNode>) => void;
  moveNode: (flowId: string, nodeId: string, x: number, y: number) => void;
  removeNode: (flowId: string, nodeId: string) => void;
  toggleLink: (flowId: string, from: string, to: string) => void;
  setConnectionLabel: (flowId: string, connId: string, label: string) => void;
  setJohnsonJobs: (flowId: string, jobs: JohnsonJob[]) => void;
  commitHistory: (flowId: string) => void;
  undo: (flowId: string) => void;
  redo: (flowId: string) => void;
  replaceFlow: (doc: FlowDoc) => void;
  importJson: (raw: string) => string | null;
  duplicate: (id: string) => string | null;
}

function migrateDoc(doc: FlowDoc): FlowDoc {
  return {
    ...doc,
    mode: doc.mode === "admin" ? "admin" : "physical",
    johnsonJobs: doc.johnsonJobs ?? [],
    nodes: doc.nodes.map((n) => ({ ...n, mos: normalizeMos(n.mos) })),
  };
}

function snap(doc: FlowDoc): Snapshot {
  return {
    nom: doc.nom,
    usine: doc.usine,
    atelier: doc.atelier,
    settings: { ...doc.settings },
    johnsonJobs: (doc.johnsonJobs ?? []).map((j) => ({ ...j })),
    nodes: doc.nodes.map((n) => ({
      ...n,
      mos: {
        processName: n.mos.processName,
        author: n.mos.author,
        tasks: (n.mos.tasks ?? []).map((t) => ({ ...t })),
        nc: (n.mos.nc ?? []).map((c) => ({ ...c })),
      },
    })),
    connections: doc.connections.map((c) => ({ ...c })),
  };
}

function applySnap(doc: FlowDoc, s: Snapshot): FlowDoc {
  return { ...doc, ...s, updatedAt: Date.now() };
}

const MAX_HIST = 40;
const saveTimers: Record<string, number> = {};

function persistNow(doc: FlowDoc) {
  void saveFlow({ data: doc }).catch(() => {
    /* keep local copy if network fails */
  });
}

function persistSoon(getDoc: () => FlowDoc | undefined, id: string) {
  if (typeof window === "undefined") {
    const doc = getDoc();
    if (doc) persistNow(doc);
    return;
  }
  window.clearTimeout(saveTimers[id]);
  saveTimers[id] = window.setTimeout(() => {
    const doc = getDoc();
    if (doc) persistNow(doc);
  }, 450);
}

export const useFlowStore = create<FlowState>()((set, get) => ({
  flows: [],
  hydrated: false,
  past: {},
  future: {},
  setHydrated: () => set({ hydrated: true }),
  loadAll: (docs) => set({ flows: docs.map(migrateDoc), hydrated: true, past: {}, future: {} }),
  getFlow: (id) => get().flows.find((f) => f.id === id),
  createFrom: (doc, meta) => {
    const next = migrateDoc({
      ...doc,
      ...meta,
      id: uid("flow"),
      updatedAt: Date.now(),
    });
    set({ flows: [next, ...get().flows] });
    persistNow(next);
    return next.id;
  },
  deleteFlow: (id) => {
    set({ flows: get().flows.filter((f) => f.id !== id) });
    void removeFlow({ data: id }).catch(() => undefined);
  },
  renameMeta: (id, patch) => {
    set({
      flows: get().flows.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f)),
    });
    persistSoon(() => get().getFlow(id), id);
  },
  updateSettings: (id, settings) => {
    get().commitHistory(id);
    set({
      flows: get().flows.map((f) => (f.id === id ? { ...f, settings, updatedAt: Date.now() } : f)),
    });
    persistSoon(() => get().getFlow(id), id);
  },
  addNode: (id, type, label, x, y) => {
    get().commitHistory(id);
    const node = createNode(type, label, x, y);
    set({
      flows: get().flows.map((f) =>
        f.id === id ? { ...f, nodes: [...f.nodes, node], updatedAt: Date.now() } : f,
      ),
    });
    persistSoon(() => get().getFlow(id), id);
    return node.id;
  },
  patchNode: (flowId, nodeId, patch) => {
    get().commitHistory(flowId);
    set({
      flows: get().flows.map((f) =>
        f.id === flowId
          ? {
              ...f,
              updatedAt: Date.now(),
              nodes: f.nodes.map((n) =>
                n.id === nodeId
                  ? { ...n, ...patch, mos: patch.mos ? normalizeMos(patch.mos) : n.mos }
                  : n,
              ),
            }
          : f,
      ),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  moveNode: (flowId, nodeId, x, y) => {
    set({
      flows: get().flows.map((f) =>
        f.id === flowId
          ? { ...f, nodes: f.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)) }
          : f,
      ),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  removeNode: (flowId, nodeId) => {
    get().commitHistory(flowId);
    set({
      flows: get().flows.map((f) =>
        f.id === flowId
          ? {
              ...f,
              updatedAt: Date.now(),
              nodes: f.nodes.filter((n) => n.id !== nodeId),
              connections: f.connections.filter((c) => c.from !== nodeId && c.to !== nodeId),
            }
          : f,
      ),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  toggleLink: (flowId, from, to) => {
    if (from === to) return;
    get().commitHistory(flowId);
    set({
      flows: get().flows.map((f) => {
        if (f.id !== flowId) return f;
        const existing = f.connections.find((c) => c.from === from && c.to === to);
        if (existing) {
          return {
            ...f,
            connections: f.connections.filter((c) => c.id !== existing.id),
            updatedAt: Date.now(),
          };
        }
        const fromNode = f.nodes.find((n) => n.id === from);
        let label: string | undefined;
        if (fromNode?.type === "decision") {
          const outs = f.connections.filter((c) => c.from === from);
          if (outs.length === 0) label = "Oui";
          else if (outs.length === 1 && !outs.some((c) => (c.label || "").toLowerCase() === "non"))
            label = "Non";
        }
        const connections: Connection[] = [
          ...f.connections,
          { id: uid("c"), from, to, label },
        ];
        return { ...f, connections, updatedAt: Date.now() };
      }),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  setConnectionLabel: (flowId, connId, label) => {
    get().commitHistory(flowId);
    set({
      flows: get().flows.map((f) =>
        f.id === flowId
          ? {
              ...f,
              updatedAt: Date.now(),
              connections: f.connections.map((c) =>
                c.id === connId ? { ...c, label } : c,
              ),
            }
          : f,
      ),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  setJohnsonJobs: (flowId, jobs) => {
    set({
      flows: get().flows.map((f) =>
        f.id === flowId ? { ...f, johnsonJobs: jobs, updatedAt: Date.now() } : f,
      ),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  commitHistory: (flowId) => {
    const doc = get().flows.find((f) => f.id === flowId);
    if (!doc) return;
    const past = { ...get().past };
    const list = [...(past[flowId] ?? []), snap(doc)].slice(-MAX_HIST);
    past[flowId] = list;
    const future = { ...get().future, [flowId]: [] };
    set({ past, future });
  },
  undo: (flowId) => {
    const pastList = get().past[flowId] ?? [];
    if (!pastList.length) return;
    const doc = get().flows.find((f) => f.id === flowId);
    if (!doc) return;
    const prev = pastList[pastList.length - 1];
    const past = { ...get().past, [flowId]: pastList.slice(0, -1) };
    const future = { ...get().future, [flowId]: [snap(doc), ...(get().future[flowId] ?? [])] };
    set({
      past,
      future,
      flows: get().flows.map((f) => (f.id === flowId ? applySnap(f, prev) : f)),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  redo: (flowId) => {
    const futureList = get().future[flowId] ?? [];
    if (!futureList.length) return;
    const doc = get().flows.find((f) => f.id === flowId);
    if (!doc) return;
    const next = futureList[0];
    const future = { ...get().future, [flowId]: futureList.slice(1) };
    const past = { ...get().past, [flowId]: [...(get().past[flowId] ?? []), snap(doc)] };
    set({
      past,
      future,
      flows: get().flows.map((f) => (f.id === flowId ? applySnap(f, next) : f)),
    });
    persistSoon(() => get().getFlow(flowId), flowId);
  },
  replaceFlow: (doc) => {
    set({
      flows: get().flows.map((f) => (f.id === doc.id ? { ...doc, updatedAt: Date.now() } : f)),
    });
    persistSoon(() => get().getFlow(doc.id), doc.id);
  },
  importJson: (raw) => {
    try {
      const parsed = JSON.parse(raw) as FlowDoc;
      if (!parsed.nodes || !parsed.settings) return null;
      const id = uid("flow");
      const next = migrateDoc({
        ...parsed,
        id,
        nom: parsed.nom || "Import",
        updatedAt: Date.now(),
      });
      set({ flows: [next, ...get().flows] });
      persistNow(next);
      return id;
    } catch {
      return null;
    }
  },
  duplicate: (id) => {
    const doc = get().flows.find((f) => f.id === id);
    if (!doc) return null;
    return get().createFrom({ ...doc, nom: `${doc.nom} (copie)` });
  },
}));
