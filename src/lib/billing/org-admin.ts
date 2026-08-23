import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { PLANS, planOf, type PlanId } from "./plans";
import { isPlatformAdmin } from "./org-helpers";

export const adminListOrgs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!(await isPlatformAdmin(context.userId))) throw new Error("Accès admin requis");
    const sql = await getSql();
    const orgs = await sql<{
      id: string;
      name: string;
      slug: string;
      plan: string;
      status: string;
      max_seats: number;
      billing_email: string | null;
      notes: string | null;
      created_at: string;
      member_count: string;
      flow_count: string;
      owner_email: string | null;
      owner_name: string | null;
    }>`
      select o.*,
        (select count(*)::text from organization_members om where om.org_id = o.id) as member_count,
        (select count(*)::text from flows f where f.org_id = o.id) as flow_count,
        (select u.email from organization_members om
           join "user" u on u.id = om.user_id
           where om.org_id = o.id and om.role = 'owner' limit 1) as owner_email,
        (select u.name from organization_members om
           join "user" u on u.id = om.user_id
           where om.org_id = o.id and om.role = 'owner' limit 1) as owner_name
      from organizations o
      order by o.created_at desc
    `;

    const users = await sql<{
      id: string;
      name: string;
      email: string;
      platform_role: string;
      created_at: string;
      flow_count: string;
      primary_org_id: string | null;
      primary_org_name: string | null;
      primary_plan: string | null;
      primary_status: string | null;
      org_count: string;
    }>`
      select u.id, u.name, u.email, u.platform_role, u."createdAt" as created_at,
        (select count(*)::text from flows f where f.user_id = u.id) as flow_count,
        (select om.org_id from organization_members om where om.user_id = u.id order by om.created_at asc limit 1) as primary_org_id,
        (select o.name from organization_members om join organizations o on o.id = om.org_id where om.user_id = u.id order by om.created_at asc limit 1) as primary_org_name,
        (select o.plan from organization_members om join organizations o on o.id = om.org_id where om.user_id = u.id order by om.created_at asc limit 1) as primary_plan,
        (select o.status from organization_members om join organizations o on o.id = om.org_id where om.user_id = u.id order by om.created_at asc limit 1) as primary_status,
        (select count(*)::text from organization_members om where om.user_id = u.id) as org_count
      from "user" u
      order by u."createdAt" desc
      limit 500
    `;

    return {
      orgs: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        plan: planOf(o.plan).id,
        planLabel: planOf(o.plan).label,
        status: o.status,
        maxSeats: o.max_seats,
        billingEmail: o.billing_email,
        notes: o.notes,
        createdAt: o.created_at,
        memberCount: Number(o.member_count),
        flowCount: Number(o.flow_count),
        ownerEmail: o.owner_email,
        ownerName: o.owner_name,
        isPaid: o.plan === "pro" || o.plan === "enterprise",
      })),
      users: users.map((u) => {
        const plan = planOf(u.primary_plan);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          platformRole: u.platform_role,
          createdAt: u.created_at,
          flowCount: Number(u.flow_count),
          orgCount: Number(u.org_count),
          primaryOrgId: u.primary_org_id,
          primaryOrgName: u.primary_org_name,
          plan: plan.id,
          planLabel: plan.label,
          status: u.primary_status ?? "—",
          isPaid: plan.id === "pro" || plan.id === "enterprise",
        };
      }),
      stats: {
        totalOrgs: orgs.length,
        paid: orgs.filter((o) => o.plan === "pro" || o.plan === "enterprise").length,
        free: orgs.filter((o) => o.plan === "free").length,
        totalUsers: users.length,
      },
    };
  });

export const adminSetOrgPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orgId: string; plan: PlanId; status?: string; maxSeats?: number; notes?: string }) => {
    if (!data?.orgId) throw new Error("orgId requis");
    if (data.plan !== "free" && data.plan !== "pro" && data.plan !== "enterprise") {
      throw new Error("Plan invalide");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    if (!(await isPlatformAdmin(context.userId))) throw new Error("Accès admin requis");
    const sql = await getSql();
    const plan = PLANS[data.plan];
    const maxSeats = data.maxSeats ?? plan.maxSeats;
    const status = data.status ?? "active";
    await sql.query(
      `update organizations set plan = $1, status = $2, max_seats = $3, notes = coalesce($4, notes), updated_at = now()
       where id = $5`,
      [data.plan, status, maxSeats, data.notes ?? null, data.orgId],
    );
    return { ok: true as const };
  });

export const adminSetUserPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; plan: PlanId; status?: string }) => {
    if (!data?.userId) throw new Error("userId requis");
    if (data.plan !== "free" && data.plan !== "pro" && data.plan !== "enterprise") {
      throw new Error("Plan invalide");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    if (!(await isPlatformAdmin(context.userId))) throw new Error("Accès admin requis");
    const sql = await getSql();
    const memberships = await sql<{ org_id: string }>`
      select org_id from organization_members
      where user_id = ${data.userId}
      order by created_at asc
      limit 1
    `;
    if (!memberships[0]) throw new Error("Cet utilisateur n'a aucune organisation");
    const plan = PLANS[data.plan];
    const status = data.status ?? "active";
    await sql.query(
      `update organizations set plan = $1, status = $2, max_seats = $3, updated_at = now() where id = $4`,
      [data.plan, status, plan.maxSeats, memberships[0].org_id],
    );
    return { ok: true as const, orgId: memberships[0].org_id };
  });

export const adminSetPlatformRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; role: "user" | "platform_admin" }) => {
    if (!data?.userId) throw new Error("userId requis");
    if (data.role !== "user" && data.role !== "platform_admin") throw new Error("Rôle invalide");
    return data;
  })
  .handler(async ({ context, data }) => {
    if (!(await isPlatformAdmin(context.userId))) throw new Error("Accès admin requis");
    if (data.userId === context.userId && data.role !== "platform_admin") {
      throw new Error("Vous ne pouvez pas retirer votre propre rôle admin");
    }
    const sql = await getSql();
    await sql.query(`update "user" set platform_role = $1 where id = $2`, [data.role, data.userId]);
    return { ok: true as const };
  });

export const adminSetOrgStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orgId: string; status: string }) => {
    if (!data?.orgId || !data?.status) throw new Error("Paramètres manquants");
    const allowed = ["active", "trial", "past_due", "canceled"];
    if (!allowed.includes(data.status)) throw new Error("Statut invalide");
    return data;
  })
  .handler(async ({ context, data }) => {
    if (!(await isPlatformAdmin(context.userId))) throw new Error("Accès admin requis");
    const sql = await getSql();
    await sql.query(`update organizations set status = $1, updated_at = now() where id = $2`, [
      data.status,
      data.orgId,
    ]);
    return { ok: true as const };
  });

export const countMyFlows = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ c: string }>`
      select count(*)::text as c from flows where user_id = ${context.userId}
    `;
    return { count: Number(rows[0]?.c ?? 0) };
  });
