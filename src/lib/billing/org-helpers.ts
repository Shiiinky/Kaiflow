import { getSql } from "@/lib/db";
import { PLANS, planOf, type MemberRole, type PlanId } from "./plans";

export function newId() {
  return crypto.randomUUID();
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "org"
  );
}

export async function uniqueSlug(base: string) {
  const sql = await getSql();
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const rows = await sql<{ id: string }>`select id from organizations where slug = ${slug} limit 1`;
    if (rows.length === 0) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function platformAdminEmails(): Set<string> {
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function isPlatformAdmin(userId: string, email?: string | null) {
  const sql = await getSql();
  const rows = await sql<{ platform_role: string; email: string }>`
    select platform_role, email from "user" where id = ${userId} limit 1
  `;
  const row = rows[0];
  if (!row) return false;
  if (row.platform_role === "platform_admin") return true;
  const emails = platformAdminEmails();
  const mail = (email ?? row.email)?.toLowerCase();
  if (mail && emails.has(mail)) {
    await sql.query(`update "user" set platform_role = 'platform_admin' where id = $1`, [userId]);
    return true;
  }
  return false;
}

export type OrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  max_seats: number;
  billing_email: string | null;
  notes: string | null;
  created_at: string;
  role?: string;
  member_count?: number;
};

export type AccountSnapshot = {
  userId: string;
  email: string | null;
  name: string | null;
  isPlatformAdmin: boolean;
  orgs: Array<{
    id: string;
    name: string;
    slug: string;
    plan: PlanId;
    planLabel: string;
    status: string;
    maxSeats: number;
    memberCount: number;
    role: MemberRole;
    isPaid: boolean;
  }>;
  primaryOrgId: string | null;
};
