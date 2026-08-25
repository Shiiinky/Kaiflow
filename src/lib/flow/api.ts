import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { planOf, type PlanId } from "@/lib/billing/plans";
import { getSql } from "@/lib/db";
import type { FlowDoc } from "./types";

function asDoc(raw: unknown): FlowDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as FlowDoc;
  if (!doc.id) return null;
  if (!Array.isArray(doc.nodes)) doc.nodes = [];
  if (!Array.isArray(doc.connections)) doc.connections = [];
  if (!doc.settings) {
    doc.settings = { demand: 1, openingTime: 480, plannedBreaks: 0 };
  }
  return doc;
}

async function primaryOrgPlan(userId: string): Promise<{ orgId: string | null; plan: PlanId }> {
  const sql = await getSql();
  try {
    const rows = await sql<{ org_id: string; plan: string }>`
      select om.org_id, o.plan
      from organization_members om
      join organizations o on o.id = om.org_id
      where om.user_id = ${userId}
      order by om.created_at asc
      limit 1
    `;
    if (!rows[0]) return { orgId: null, plan: "free" };
    return { orgId: rows[0].org_id, plan: planOf(rows[0].plan).id };
  } catch {
    return { orgId: null, plan: "free" };
  }
}

async function countFlows(userId: string): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ c: string }>`
    select count(*)::text as c from flows where user_id = ${userId}
  `;
  return Number(rows[0]?.c ?? 0);
}

export type QuotaInfo = {
  plan: PlanId;
  planLabel: string;
  maxFlows: number;
  used: number;
  remaining: number;
  canCreate: boolean;
  isPaid: boolean;
  orgId: string | null;
};

export const getQuota = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<QuotaInfo> => {
    const { orgId, plan } = await primaryOrgPlan(context.userId);
    const p = planOf(plan);
    const used = await countFlows(context.userId);
    const remaining = Math.max(0, p.maxFlows - used);
    return {
      plan: p.id,
      planLabel: p.label,
      maxFlows: p.maxFlows,
      used,
      remaining,
      canCreate: used < p.maxFlows,
      isPaid: p.id === "pro" || p.id === "enterprise",
      orgId,
    };
  });

export const listFlows = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    let rows: { doc: unknown; user_id: string; updated_at: string }[] = [];
    try {
      rows = await sql<{ doc: unknown; user_id: string; updated_at: string }>`
        select f.doc, f.user_id, f.updated_at
        from flows f
        where f.user_id = ${context.userId}
           or f.org_id in (
             select org_id from organization_members where user_id = ${context.userId}
           )
        order by f.updated_at desc
      `;
    } catch {
      rows = await sql<{ doc: unknown; user_id: string; updated_at: string }>`
        select f.doc, f.user_id, f.updated_at
        from flows f
        where f.user_id = ${context.userId}
        order by f.updated_at desc
      `;
    }
    const seen = new Set<string>();
    const docs: FlowDoc[] = [];
    for (const r of rows) {
      const raw = typeof r.doc === "string" ? JSON.parse(r.doc as string) : r.doc;
      const doc = asDoc(raw);
      if (!doc || seen.has(doc.id)) continue;
      seen.add(doc.id);
      (doc as FlowDoc & { _isMine?: boolean })._isMine = r.user_id === context.userId;
      docs.push(doc);
    }
    return docs;
  });

export const saveFlow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((doc: FlowDoc) => {
    const parsed = asDoc(doc);
    if (!parsed) throw new Error("Flux invalide");
    return parsed;
  })
  .handler(async ({ context, data: doc }) => {
    const sql = await getSql();
    const existing = await sql<{ id: string; user_id: string; org_id: string | null }>`
      select id, user_id, org_id from flows where id = ${doc.id} limit 1
    `;
    const isNew = !existing[0];

    if (isNew) {
      const { plan, orgId } = await primaryOrgPlan(context.userId);
      const p = planOf(plan);
      const used = await countFlows(context.userId);
      if (used >= p.maxFlows) {
        throw new Error(
          `Limite du plan ${p.label} atteinte (${p.maxFlows} flux). Passez en Pro pour en créer davantage.`,
        );
      }
      await sql.query(
        `insert into flows (id, user_id, org_id, nom, usine, atelier, doc, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())`,
        [doc.id, context.userId, orgId, doc.nom, doc.usine, doc.atelier, JSON.stringify(doc)],
      );
      return { ok: true as const };
    }

    const row = existing[0];
    let allowed = row.user_id === context.userId;
    if (!allowed && row.org_id) {
      try {
        const mem = await sql<{ id: string }>`
          select id from organization_members
          where org_id = ${row.org_id} and user_id = ${context.userId}
          limit 1
        `;
        allowed = Boolean(mem[0]);
      } catch {
        allowed = false;
      }
    }
    if (!allowed) throw new Error("Vous n'avez pas le droit de modifier ce flux");

    await sql.query(
      `update flows set
         nom = $1, usine = $2, atelier = $3, doc = $4::jsonb, updated_at = now()
       where id = $5`,
      [doc.nom, doc.usine, doc.atelier, JSON.stringify(doc), doc.id],
    );
    return { ok: true as const };
  });

export const removeFlow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from flows where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });
