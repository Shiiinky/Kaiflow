import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { PLANS, planOf, type MemberRole } from "./plans";
import {
  isPlatformAdmin,
  newId as id,
  slugify,
  uniqueSlug,
  type AccountSnapshot,
  type OrgRow,
} from "./org-helpers";

export type { AccountSnapshot } from "./org-helpers";

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AccountSnapshot> => {
    const sql = await getSql();
    const users = await sql<{ id: string; email: string; name: string; platform_role: string }>`
      select id, email, name, platform_role from "user" where id = ${context.userId} limit 1
    `;
    const user = users[0];
    if (!user) throw new Error("Utilisateur introuvable");

    let memberships = await sql<OrgRow & { role: string; member_count: string }>`
      select o.*, m.role,
        (select count(*)::text from organization_members om where om.org_id = o.id) as member_count
      from organization_members m
      join organizations o on o.id = m.org_id
      where m.user_id = ${context.userId}
      order by o.created_at asc
    `;

    if (memberships.length === 0) {
      const orgId = id();
      const base = slugify(user.name || user.email.split("@")[0] || "compte");
      const slug = await uniqueSlug(base);
      const name = user.name?.trim() || "Mon espace";
      await sql.query(
        `insert into organizations (id, name, slug, plan, status, max_seats, billing_email)
         values ($1, $2, $3, 'free', 'active', $4, $5)`,
        [orgId, name, slug, PLANS.free.maxSeats, user.email],
      );
      await sql.query(
        `insert into organization_members (id, org_id, user_id, role) values ($1, $2, $3, 'owner')`,
        [id(), orgId, context.userId],
      );
      memberships = await sql<OrgRow & { role: string; member_count: string }>`
        select o.*, m.role,
          (select count(*)::text from organization_members om where om.org_id = o.id) as member_count
        from organization_members m
        join organizations o on o.id = m.org_id
        where m.user_id = ${context.userId}
        order by o.created_at asc
      `;
    }

    const admin = await isPlatformAdmin(context.userId, user.email);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      isPlatformAdmin: admin,
      primaryOrgId: memberships[0]?.id ?? null,
      orgs: memberships.map((o) => {
        const plan = planOf(o.plan);
        return {
          id: o.id,
          name: o.name,
          slug: o.slug,
          plan: plan.id,
          planLabel: plan.label,
          status: o.status,
          maxSeats: o.max_seats,
          memberCount: Number(o.member_count ?? 1),
          role: (o.role as MemberRole) || "member",
          isPaid: plan.id === "pro" || plan.id === "enterprise",
        };
      }),
    };
  });

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { name: string }) => {
    const name = data?.name?.trim();
    if (!name || name.length < 2) throw new Error("Nom d'entreprise requis");
    return { name };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const orgId = id();
    const slug = await uniqueSlug(slugify(data.name));
    await sql.query(
      `insert into organizations (id, name, slug, plan, status, max_seats)
       values ($1, $2, $3, 'free', 'trial', $4)`,
      [orgId, data.name, slug, PLANS.free.maxSeats],
    );
    await sql.query(
      `insert into organization_members (id, org_id, user_id, role) values ($1, $2, $3, 'owner')`,
      [id(), orgId, context.userId],
    );
    return { id: orgId, slug };
  });

export const getOrgDetail = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((orgId: string) => {
    if (!orgId) throw new Error("orgId requis");
    return orgId;
  })
  .handler(async ({ context, data: orgId }) => {
    const sql = await getSql();
    const mine = await sql<{ role: string }>`
      select role from organization_members where org_id = ${orgId} and user_id = ${context.userId} limit 1
    `;
    const admin = await isPlatformAdmin(context.userId);
    if (!mine[0] && !admin) throw new Error("Accès refusé");

    const orgs = await sql<OrgRow>`select * from organizations where id = ${orgId} limit 1`;
    const org = orgs[0];
    if (!org) throw new Error("Organisation introuvable");

    const members = await sql<{
      id: string;
      user_id: string;
      role: string;
      created_at: string;
      name: string;
      email: string;
      image: string | null;
    }>`
      select m.id, m.user_id, m.role, m.created_at, u.name, u.email, u.image
      from organization_members m
      join "user" u on u.id = m.user_id
      where m.org_id = ${orgId}
      order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end, m.created_at
    `;

    const invites = await sql<{
      id: string;
      email: string;
      role: string;
      expires_at: string;
      created_at: string;
    }>`
      select id, email, role, expires_at, created_at
      from organization_invites
      where org_id = ${orgId} and expires_at > now()
      order by created_at desc
    `;

    const plan = planOf(org.plan);
    return {
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: plan.id,
        planLabel: plan.label,
        status: org.status,
        maxSeats: org.max_seats,
        billingEmail: org.billing_email,
        notes: admin ? org.notes : null,
        createdAt: org.created_at,
      },
      myRole: (mine[0]?.role as MemberRole) || (admin ? ("owner" as MemberRole) : ("member" as MemberRole)),
      isPlatformAdmin: admin,
      members: members.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role as MemberRole,
        name: m.name,
        email: m.email,
        image: m.image,
        createdAt: m.created_at,
      })),
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role as MemberRole,
        expiresAt: i.expires_at,
        createdAt: i.created_at,
      })),
      limits: { maxSeats: plan.maxSeats, maxFlows: plan.maxFlows },
    };
  });
