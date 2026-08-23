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
    }>`
      select u.id, u.name, u.email, u.platform_role, u."createdAt" as created_at,
        (select count(*)::text from flows f where f.user_id = u.id) as flow_count
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
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        platformRole: u.platform_role,
        createdAt: u.created_at,
        flowCount: Number(u.flow_count),
      })),
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

export const countMyFlows = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ c: string }>`
      select count(*)::text as c from flows where user_id = ${context.userId}
    `;
    return { count: Number(rows[0]?.c ?? 0) };
  });
