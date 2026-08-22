import type { JohnsonJob } from "./types";

export interface JohnsonGanttBar {
  jobId: string;
  name: string;
  m1: [number, number];
  m2: [number, number];
}

export interface JohnsonResult {
  order: JohnsonJob[];
  makespan: number;
  idleM2: number;
  gantt: JohnsonGanttBar[];
}

function schedule(order: JohnsonJob[]): JohnsonResult {
  let tM1 = 0;
  let tM2 = 0;
  let idleM2 = 0;
  const gantt: JohnsonGanttBar[] = [];
  for (const job of order) {
    const m1s = tM1;
    const m1e = tM1 + Math.max(0, job.t1);
    tM1 = m1e;
    const m2s = Math.max(tM2, m1e);
    idleM2 += Math.max(0, m2s - tM2);
    const m2e = m2s + Math.max(0, job.t2);
    tM2 = m2e;
    gantt.push({ jobId: job.id, name: job.name, m1: [m1s, m1e], m2: [m2s, m2e] });
  }
  return { order, makespan: tM2, idleM2, gantt };
}

/** Johnson's rule: n jobs on 2 machines in series, min makespan. */
export function johnsonSequence(jobs: JohnsonJob[]): JohnsonResult {
  const valid = jobs.filter((j) => (j.t1 || 0) > 0 || (j.t2 || 0) > 0);
  const group1 = valid.filter((j) => j.t1 <= j.t2).sort((a, b) => a.t1 - b.t1);
  const group2 = valid.filter((j) => j.t1 > j.t2).sort((a, b) => b.t2 - a.t2);
  return schedule([...group1, ...group2]);
}

export function fifoSequence(jobs: JohnsonJob[]): JohnsonResult {
  return schedule(jobs.filter((j) => (j.t1 || 0) > 0 || (j.t2 || 0) > 0));
}

export const SAMPLE_JOHNSON_JOBS: JohnsonJob[] = [
  { id: "j1", name: "Réf. A", t1: 45, t2: 80 },
  { id: "j2", name: "Réf. B", t1: 90, t2: 30 },
  { id: "j3", name: "Réf. C", t1: 25, t2: 60 },
  { id: "j4", name: "Réf. D", t1: 70, t2: 50 },
  { id: "j5", name: "Réf. E", t1: 35, t2: 40 },
];
