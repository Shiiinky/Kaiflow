import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { sendOrgInviteEmail } from "@/lib/email/send";
import { planOf, type MemberRole } from "./plans";
import { isPlatformAdmin, newId as id } from "./org-helpers";

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orgId: string; email: string; role?: MemberRole }) => {
    const email = data?.email?.trim().toLowerCase();
    if (!data?.orgId || !email || !email.includes("@")) throw new Error("Email invalide");
    const role: MemberRole = data.role === "admin" ? "admin" : "member";
    return { orgId: data.orgId, email, role };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const mine = await sql<{ role: string }>`
      select role from organization_members where org_id = ${data.orgId} and user_id = ${context.userId} limit 1
    `;
    const admin = await isPlatformAdmin(context.userId);
    if ((!mine[0] || (mine[0].role !== "owner" && mine[0].role !== "admin")) && !admin) {
      throw new Error("Seuls les admins peuvent inviter");
    }

    const orgs = await sql<{ plan: string; max_seats: number }>`
      select plan, max_seats from organizations where id = ${data.orgId} limit 1
    `;
    const org = orgs[0];
    if (!org) throw new Error("Organisation introuvable");
    const plan = planOf(org.plan);
    const counts = await sql<{ c: string }>`
      select count(*)::text as c from organization_members where org_id = ${data.orgId}
    `;
    const inviteCounts = await sql<{ c: string }>`
      select count(*)::text as c from organization_invites where org_id = ${data.orgId} and expires_at > now()
    `;
    const used = Number(counts[0]?.c ?? 0) + Number(inviteCounts[0]?.c ?? 0);
    if (used >= plan.maxSeats) {
      throw new Error(`Limite de sièges atteinte (${plan.maxSeats}). Passez au plan supérieur.`);
    }

    const existing = await sql<{ id: string }>`
      select m.id from organization_members m
      join "user" u on u.id = m.user_id
      where m.org_id = ${data.orgId} and lower(u.email) = ${data.email}
      limit 1
    `;
    if (existing[0]) throw new Error("Cet utilisateur est déjà membre");

    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${data.email} limit 1
    `;
    if (users[0]) {
      await sql.query(
        `insert into organization_members (id, org_id, user_id, role) values ($1, $2, $3, $4)
         on conflict (org_id, user_id) do nothing`,
        [id(), data.orgId, users[0].id, data.role],
      );
      return { mode: "added" as const };
    }

    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const expires = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
    await sql.query(
      `insert into organization_invites (id, org_id, email, role, token, invited_by, expires_at)
       values ($1, $2, $3, $4, $5, $6, $7::timestamptz)`,
      [id(), data.orgId, data.email, data.role, token, context.userId, expires],
    );

    const orgMeta = await sql<{ name: string }>`
      select name from organizations where id = ${data.orgId} limit 1
    `;
    const inviter = await sql<{ name: string; email: string }>`
      select name, email from "user" where id = ${context.userId} limit 1
    `;
    const mail = await sendOrgInviteEmail({
      to: data.email,
      orgName: orgMeta[0]?.name || "équipe Kaiflow",
      inviterName: inviter[0]?.name || inviter[0]?.email,
      role: data.role,
      token,
    });

    return {
      mode: "invited" as const,
      token,
      emailSent: mail.ok,
      emailError: mail.ok ? undefined : mail.error,
    };
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orgId: string; memberId: string; role: MemberRole }) => {
    if (!data?.orgId || !data?.memberId) throw new Error("Paramètres manquants");
    if (data.role !== "admin" && data.role !== "member" && data.role !== "owner") {
      throw new Error("Rôle invalide");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const mine = await sql<{ role: string }>`
      select role from organization_members where org_id = ${data.orgId} and user_id = ${context.userId} limit 1
    `;
    const admin = await isPlatformAdmin(context.userId);
    if (mine[0]?.role !== "owner" && !admin) throw new Error("Seul le propriétaire peut changer les rôles");

    if (data.role !== "owner") {
      const owners = await sql<{ c: string }>`
        select count(*)::text as c from organization_members
        where org_id = ${data.orgId} and role = 'owner'
      `;
      const target = await sql<{ role: string }>`
        select role from organization_members where id = ${data.memberId} and org_id = ${data.orgId} limit 1
      `;
      if (target[0]?.role === "owner" && Number(owners[0]?.c ?? 0) <= 1) {
        throw new Error("Impossible de retirer le dernier propriétaire");
      }
    }

    await sql.query(
      `update organization_members set role = $1 where id = $2 and org_id = $3`,
      [data.role, data.memberId, data.orgId],
    );
    return { ok: true as const };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orgId: string; memberId: string }) => {
    if (!data?.orgId || !data?.memberId) throw new Error("Paramètres manquants");
    return data;
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const mine = await sql<{ role: string; id: string }>`
      select role, id from organization_members where org_id = ${data.orgId} and user_id = ${context.userId} limit 1
    `;
    const admin = await isPlatformAdmin(context.userId);
    const target = await sql<{ role: string; user_id: string }>`
      select role, user_id from organization_members where id = ${data.memberId} and org_id = ${data.orgId} limit 1
    `;
    if (!target[0]) throw new Error("Membre introuvable");
    if (target[0].role === "owner") throw new Error("Impossible de retirer le propriétaire");

    const can =
      admin ||
      mine[0]?.role === "owner" ||
      mine[0]?.role === "admin" ||
      mine[0]?.id === data.memberId;
    if (!can) throw new Error("Accès refusé");

    await sql`delete from organization_members where id = ${data.memberId} and org_id = ${data.orgId}`;
    return { ok: true as const };
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orgId: string; inviteId: string }) => data)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const mine = await sql<{ role: string }>`
      select role from organization_members where org_id = ${data.orgId} and user_id = ${context.userId} limit 1
    `;
    const admin = await isPlatformAdmin(context.userId);
    if ((!mine[0] || (mine[0].role !== "owner" && mine[0].role !== "admin")) && !admin) {
      throw new Error("Accès refusé");
    }
    await sql`delete from organization_invites where id = ${data.inviteId} and org_id = ${data.orgId}`;
    return { ok: true as const };
  });

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((token: string) => {
    if (!token) throw new Error("Token requis");
    return token;
  })
  .handler(async ({ context, data: token }) => {
    const sql = await getSql();
    const inv = await sql<{
      id: string;
      org_id: string;
      email: string;
      role: string;
    }>`
      select id, org_id, email, role from organization_invites
      where token = ${token} and expires_at > now()
      limit 1
    `;
    if (!inv[0]) throw new Error("Invitation expirée ou invalide");

    const users = await sql<{ email: string }>`select email from "user" where id = ${context.userId} limit 1`;
    if (users[0]?.email?.toLowerCase() !== inv[0].email.toLowerCase()) {
      throw new Error("Cette invitation est destinée à une autre adresse email");
    }

    await sql.query(
      `insert into organization_members (id, org_id, user_id, role) values ($1, $2, $3, $4)
       on conflict (org_id, user_id) do nothing`,
      [id(), inv[0].org_id, context.userId, inv[0].role],
    );
    await sql`delete from organization_invites where id = ${inv[0].id}`;
    return { orgId: inv[0].org_id };
  });

export const renameOrganization = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orgId: string; name: string }) => {
    const name = data?.name?.trim();
    if (!data?.orgId || !name) throw new Error("Nom requis");
    return { orgId: data.orgId, name };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const mine = await sql<{ role: string }>`
      select role from organization_members where org_id = ${data.orgId} and user_id = ${context.userId} limit 1
    `;
    const admin = await isPlatformAdmin(context.userId);
    if (mine[0]?.role !== "owner" && mine[0]?.role !== "admin" && !admin) {
      throw new Error("Accès refusé");
    }
    await sql.query(`update organizations set name = $1, updated_at = now() where id = $2`, [
      data.name,
      data.orgId,
    ]);
    return { ok: true as const };
  });
