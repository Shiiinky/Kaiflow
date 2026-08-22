import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { FlowDoc } from "./types";

function asDoc(raw: unknown): FlowDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as FlowDoc;
  if (!doc.id || !Array.isArray(doc.nodes) || !doc.settings) return null;
  return doc;
}

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
    await sql.query(
      `insert into flows (id, user_id, nom, usine, atelier, doc, updated_at)
       values ($1, $2, $3, $4, $5, $6::jsonb, now())
       on conflict (id) do update set
         nom = excluded.nom,
         usine = excluded.usine,
         atelier = excluded.atelier,
         doc = excluded.doc,
         updated_at = now()
       where flows.user_id = $2`,
      [doc.id, context.userId, doc.nom, doc.usine, doc.atelier, JSON.stringify(doc)],
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
