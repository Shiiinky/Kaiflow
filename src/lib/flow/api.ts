import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { planOf, type PlanId } from "@/lib/billing/plans";
import { getSql } from "@/lib/db";
import type { FlowDoc } from "./types";

function asDoc(raw: unknown): FlowDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as FlowDoc;
  if (!doc.id || !Array.isArray(doc.nodes) || !doc.settings) return null;
  return doc;
}

async function primaryOrgPlan(userId: string): Promise<{ orgId: string | null; plan: PlanId }> {
  const sql = await getSql();
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
    const rows = await sql<{ doc: FlowDoc }>`
      select doc from flows
      where user_id = ${context.userId}
      order by updated_at desc
    `;
    return rows
      .map((r) => asDoc(typeof r.doc === "string" ? JSON.parse(r.doc) : r.doc))
      .filter((d): d is FlowDoc => d !== null);
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
    const existing = await sql<{ id: string }>`
      select id from flows where id = ${doc.id} and user_id = ${context.userId} limit 1
    `;
    const isNew = !existing[0];
    if (isNew) {
      const { plan } = await primaryOrgPlan(context.userId);
      const p = planOf(plan);
      const used = await countFlows(context.userId);
      if (used >= p.maxFlows) {
        throw new Error(
          `Limite du plan ${p.label} atteinte (${p.maxFlows} flux). Passez en Pro pour en créer davantage.`,
        );
      }
    }
    const { orgId } = await primaryOrgPlan(context.userId);
    await sql.query(
      `insert into flows (id, user_id, org_id, nom, usine, atelier, doc, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
       on conflict (id) do update set
         nom = excluded.nom,
         usine = excluded.usine,
         atelier = excluded.atelier,
         doc = excluded.doc,
         org_id = coalesce(flows.org_id, excluded.org_id),
         updated_at = now()
       where flows.user_id = $2`,
      [doc.id, context.userId, orgId, doc.nom, doc.usine, doc.atelier, JSON.stringify(doc)],
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
