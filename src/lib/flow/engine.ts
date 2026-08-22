import type {
  Connection,
  FlowAnalysis,
  FlowDoc,
  FlowNode,
  LineSettings,
  Mos,
  Recommendation,
  StationGroup,
} from "./types";

export function getTakt(settings: LineSettings): number {
  const availableMin = Math.max(0, settings.openingTime - settings.plannedBreaks);
  if (settings.demand <= 0) return 0;
  return Math.round((availableMin * 60) / settings.demand);
}

function amortizedNc(node: FlowNode): number {
  const nc = node.mos?.nc ?? [];
  let extra = 0;
  for (const item of nc) {
    const temps = item.temps || 0;
    const pieces = item.pieces || 0;
    if (pieces > 0) extra += temps / pieces;
    else extra += temps;
  }
  return extra;
}

export function getEffectiveCycle(node: FlowNode): number {
  if (!node) return 0;
  let raw = node.cycle || 0;
  const tasks = node.mos?.tasks ?? [];
  if (tasks.length > 0) {
    let op = 0;
    let machine = 0;
    for (const t of tasks) {
      op += (t.manual || 0) + (t.move || 0) + (t.wait || 0);
      machine += t.machine || 0;
    }
    const mosCycle = Math.max(op, machine);
    if (mosCycle > 0) raw = mosCycle;
  }
  raw += amortizedNc(node);
  if (node.type === "stock") return 0;
  const mach = node.type === "work" || node.type === "control" ? Math.max(1, node.machines || 1) : 1;
  const dispo = node.dispo !== undefined ? node.dispo / 100 : 1;
  const scrap = node.rebut !== undefined ? node.rebut / 100 : 0;
  const denom = mach * dispo * (1 - scrap);
  if (denom <= 0) return Number.POSITIVE_INFINITY;
  return Math.round(raw / denom);
}

export function getNodeVaPercent(node: FlowNode): number | null {
  const tasks = node.mos?.tasks ?? [];
  if (!tasks.length) return null;
  let va = 0;
  let total = 0;
  for (const t of tasks) {
    const row = (t.manual || 0) + (t.machine || 0) + (t.move || 0) + (t.wait || 0);
    total += row;
    if (t.vsm === "va") va += row;
  }
  return total > 0 ? Math.round((va / total) * 100) : null;
}

function parallelGroups(nodes: FlowNode[], connections: Connection[]): StationGroup[] {
  const work = nodes.filter((n) => n.type === "work" || n.type === "control");
  const buckets = new Map<string, { ids: string[]; nodes: FlowNode[]; sumInverse: number; label: string }>();

  for (const n of work) {
    const c = getEffectiveCycle(n);
    if (c === 0 || !Number.isFinite(c)) continue;
    const preds = connections
      .filter((conn) => conn.to === n.id)
      .map((conn) => conn.from)
      .sort()
      .join(",");
    const succs = connections
      .filter((conn) => conn.from === n.id)
      .map((conn) => conn.to)
      .sort()
      .join(",");
    const sig = `in:${preds}|out:${succs}`;
    const bucket = buckets.get(sig) ?? {
      ids: [],
      nodes: [],
      sumInverse: 0,
      label: n.label,
    };
    bucket.ids.push(n.id);
    bucket.nodes.push(n);
    bucket.sumInverse += 1 / c;
    buckets.set(sig, bucket);
  }

  const groups: StationGroup[] = [];
  for (const [sig, b] of buckets) {
    const eqCycle = Math.round(1 / b.sumInverse);
    const first = b.nodes[0];
    let va = 0;
    let nva = 0;
    const orig = getEffectiveCycle(first);
    if (orig > 0) {
      if ((first.mos?.tasks ?? []).length > 0) {
        let rVa = 0;
        let rNva = 0;
        let rawC = 0;
        for (const t of first.mos?.tasks ?? []) {
          const tt = (t.manual || 0) + (t.move || 0) + (t.wait || 0) + (t.machine || 0);
          rawC += tt;
          if (t.vsm === "va") rVa += tt;
          else rNva += tt;
        }
        if (rawC > 0) {
          va = (rVa / rawC) * eqCycle;
          nva = (rNva / rawC) * eqCycle;
        }
      } else if (first.vsm === "va") {
        va = eqCycle;
      } else {
        nva = eqCycle;
      }
    }
    groups.push({
      id: sig,
      ids: b.ids,
      label: b.ids.length > 1 ? `${b.nodes[0].label} (+${b.ids.length - 1} //)` : b.label,
      eqCycle,
      va,
      nva,
    });
  }
  return groups;
}

function criticalPathLeadTime(
  nodes: FlowNode[],
  connections: Connection[],
  cadence: number,
): number {
  if (nodes.length === 0) return 0;
  const memo = new Map<string, number>();
  const weight = (node: FlowNode) =>
    node.type === "stock" ? (node.qty || 0) * cadence : getEffectiveCycle(node) || 0;

  const longest = (id: string, visited: Set<string>): number => {
    if (visited.has(id)) return 0;
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    visited.add(id);
    const children = connections.filter((c) => c.from === id).map((c) => c.to);
    let maxChild = 0;
    for (const child of children) {
      maxChild = Math.max(maxChild, longest(child, visited));
    }
    visited.delete(id);
    const node = nodes.find((n) => n.id === id);
    const time = (node ? weight(node) : 0) + maxChild;
    memo.set(id, time);
    return time;
  };

  let max = 0;
  for (const n of nodes) {
    max = Math.max(max, longest(n.id, new Set()));
  }
  return max;
}

function buildRecommendations(doc: FlowDoc, analysis: Omit<FlowAnalysis, "recommendations">): Recommendation[] {
  const out: Recommendation[] = [];
  const { takt, bottleneck, maxCycle, groups, vaPercent, wip, cadence } = analysis;

  if (bottleneck && takt > 0 && maxCycle > takt) {
    const deficit = maxCycle - takt;
    const node = doc.nodes.find((n) => bottleneck.ids.includes(n.id));
    const machines = node?.machines ?? 1;
    const nextCycle = Math.round(maxCycle * (machines / (machines + 1)));
    const underTakt = nextCycle <= takt;
    out.push({
      id: "bn-machine",
      severity: "critical",
      title: `Goulot : ${bottleneck.label} à ${maxCycle}s`,
      detail: underTakt
        ? `Ajouter 1 machine (×${machines + 1}) ferait passer le cycle à ~${nextCycle}s, sous le takt de ${takt}s.`
        : `Le poste dépasse le takt de ${deficit}s. Réduire le cycle de ${deficit}s ou ajouter une ressource parallèle.`,
    });
  }

  if (bottleneck && bottleneck.nva > 0 && bottleneck.eqCycle > 0) {
    const nvaShare = bottleneck.nva / bottleneck.eqCycle;
    if (nvaShare >= 0.25) {
      out.push({
        id: "bn-nva",
        severity: "warn",
        title: `NVA élevée sur ${bottleneck.label}`,
        detail: `${Math.round(nvaShare * 100)}% du temps n'est pas à valeur ajoutée. Chronométrer le MOS et supprimer attentes / déplacements.`,
      });
    }
  }

  if (takt > 0 && wip > 0) {
    const stockLead = wip * cadence;
    if (analysis.leadTime > 0 && stockLead / analysis.leadTime >= 0.4) {
      out.push({
        id: "wip",
        severity: "warn",
        title: "Encours trop longs",
        detail: `${wip} pièces en stock représentent ~${formatDuration(stockLead)} de lead time. Baisser les consignes de stock pour raccourcir le flux.`,
      });
    }
  }

  if (vaPercent !== null && vaPercent < 60) {
    out.push({
      id: "va",
      severity: "info",
      title: `Valeur ajoutée à ${vaPercent}%`,
      detail: "Moins de 60% du temps de flux est à valeur ajoutée. Cartographier les transports et attentes.",
    });
  }

  if (takt > 0 && groups.length >= 2) {
    const under = groups.filter((g) => g.eqCycle / takt < 0.55);
    if (under.length > 0 && bottleneck && maxCycle > takt) {
      out.push({
        id: "rebalance",
        severity: "info",
        title: "Déséquilibre de ligne",
        detail: `${under.map((g) => g.label).join(", ")} tournent sous 55% du takt. Transférer des tâches vers le goulot (Yamazumi).`,
      });
    }
  }

  const sequential = groups.length === 2;
  if (sequential) {
    out.push({
      id: "johnson",
      severity: "info",
      title: "Deux postes en série",
      detail: "Le séquençage de Johnson peut minimiser le makespan si plusieurs références passent sur ces deux machines.",
    });
  }

  if (out.length === 0 && groups.length > 0) {
    out.push({
      id: "ok",
      severity: "info",
      title: "Ligne dans les clous",
      detail: "Aucun goulot au-dessus du takt. Surveillez le TRS et les encours pour tenir le rythme.",
    });
  }
  return out;
}

export function analyzeFlow(doc: FlowDoc): FlowAnalysis {
  const takt = getTakt(doc.settings);
  const groups = parallelGroups(doc.nodes, doc.connections);
  let maxCycle = 0;
  let bottleneck: StationGroup | null = null;
  for (const g of groups) {
    if (g.eqCycle > maxCycle) {
      maxCycle = g.eqCycle;
      bottleneck = g;
    }
  }
  const cadence = Math.max(takt, maxCycle);
  const leadTime = criticalPathLeadTime(doc.nodes, doc.connections, cadence);

  let totalVA = 0;
  let totalNVA = 0;
  for (const n of doc.nodes) {
    const c = getEffectiveCycle(n);
    if (c === 0 && n.type !== "stock") continue;
    if ((n.mos?.tasks ?? []).length > 0) {
      for (const t of n.mos?.tasks ?? []) {
        const tt = (t.manual || 0) + (t.move || 0) + (t.wait || 0) + (t.machine || 0);
        if (t.vsm === "va") totalVA += tt;
        else totalNVA += tt;
      }
    } else {
      let weight = c;
      if (n.type === "stock") weight = (n.qty || 0) * cadence;
      if (weight > 0 && Number.isFinite(weight)) {
        if (n.vsm === "va") totalVA += weight;
        else totalNVA += weight;
      }
    }
  }
  const totalTime = totalVA + totalNVA;
  const vaPercent = totalTime > 0 ? Math.round((totalVA / totalTime) * 100) : null;
  const rendement = maxCycle > 0 && takt > 0 ? Math.round((takt / maxCycle) * 100) : null;
  let charge: number | null = null;
  if (groups.length && takt > 0) {
    const avg = groups.reduce((s, g) => s + (g.eqCycle / takt) * 100, 0) / groups.length;
    charge = Math.round(avg);
  }
  const sumCycle = groups.reduce((s, g) => s + g.eqCycle, 0);
  const etp = takt > 0 && sumCycle > 0 ? Math.round((sumCycle / takt) * 10) / 10 : null;
  const throughputPerHour =
    maxCycle > 0 && Number.isFinite(maxCycle) ? Math.round((3600 / maxCycle) * 10) / 10 : null;
  const balance =
    groups.length > 1 && maxCycle > 0
      ? Math.round((sumCycle / (groups.length * maxCycle)) * 100)
      : null;
  const wip = doc.nodes.reduce((s, n) => s + (n.type === "stock" ? n.qty || 0 : 0), 0);

  const partial = {
    takt,
    bottleneck,
    maxCycle,
    cadence,
    leadTime,
    vaPercent,
    rendement,
    charge,
    etp,
    throughputPerHour,
    balance,
    wip,
    groups,
    stationCount: doc.nodes.length,
  };

  return {
    ...partial,
    recommendations: buildRecommendations(doc, partial),
  };
}

export function simulateExtraMachine(doc: FlowDoc, nodeId: string): FlowDoc {
  return {
    ...doc,
    nodes: doc.nodes.map((n) =>
      n.id === nodeId ? { ...n, machines: Math.max(1, (n.machines || 1) + 1) } : n,
    ),
  };
}

export function formatDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  if (seconds > 86400) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    return `${d}j ${h}h`;
  }
  if (seconds > 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  }
  if (seconds > 60) {
    const m = Math.floor(seconds / 60);
    return `${m}min ${seconds % 60}s`;
  }
  return `${Math.round(seconds)}s`;
}

export function formatSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value}s`;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export const DEFAULT_SETTINGS: LineSettings = {
  demand: 466,
  openingTime: 480,
  plannedBreaks: 30,
};

export function emptyMos(): Mos {
  return { processName: "", author: "", tasks: [], nc: [] };
}

export function normalizeMos(raw: Partial<Mos> | undefined): Mos {
  return {
    processName: raw?.processName ?? "",
    author: raw?.author ?? "",
    tasks: raw?.tasks ?? [],
    nc: raw?.nc ?? [],
  };
}

export function createNode(
  type: FlowNode["type"],
  label: string,
  x: number,
  y: number,
  extra: Partial<FlowNode> = {},
): FlowNode {
  return {
    id: uid("n"),
    type,
    label,
    x,
    y,
    cycle: extra.cycle ?? (type === "stock" ? 0 : 30),
    ops: extra.ops ?? 1,
    machines: extra.machines ?? 1,
    dispo: extra.dispo ?? 100,
    rebut: extra.rebut ?? 0,
    qty: extra.qty ?? 0,
    stockMax: extra.stockMax ?? 0,
    dist: extra.dist ?? 0,
    vsm: extra.vsm ?? (type === "stock" || type === "transport" ? "nva" : "va"),
    mos: extra.mos ? normalizeMos(extra.mos) : emptyMos(),
  };
}
