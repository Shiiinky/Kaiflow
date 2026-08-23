import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountChip } from "@/components/account-chip";
import { BrandMark } from "@/components/brand";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { adminListOrgs, adminSetOrgPlan } from "@/lib/billing/org-api";
import type { PlanId } from "@/lib/billing/plans";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireAuth>
      <AdminPage />
    </RequireAuth>
  ),
});

type AdminData = Awaited<ReturnType<typeof adminListOrgs>>;

function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"orgs" | "users">("orgs");

  const reload = () => {
    void adminListOrgs()
      .then(setData)
      .catch((e: Error) => setError(e.message || "Accès refusé"));
  };

  useEffect(() => {
    reload();
  }, []);

  const setPlan = (orgId: string, plan: PlanId) => {
    void adminSetOrgPlan({ data: { orgId, plan, status: "active" } })
      .then(reload)
      .catch((e: Error) => setError(e.message));
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
        <BrandMark to="/app" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/compte">
              <ArrowLeft className="mr-1 size-3.5" />
              Compte
            </Link>
          </Button>
          <AccountChip />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Kaiflow Admin</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Pilotage commercial</h1>
        <p className="mt-1 text-sm text-muted">
          Vue des organisations payantes / gratuites et des comptes utilisateurs.
        </p>

        {error ? (
          <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {data ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Organisations", data.stats.totalOrgs],
                ["Payantes", data.stats.paid],
                ["Gratuites", data.stats.free],
                ["Utilisateurs", data.stats.totalUsers],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-md border border-border bg-surface p-3">
                  <div className="text-[10px] uppercase text-muted">{k}</div>
                  <div className="font-display text-2xl font-bold tabular-nums">{v}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-2">
              <Button size="sm" variant={tab === "orgs" ? "default" : "secondary"} onClick={() => setTab("orgs")}>
                Organisations
              </Button>
              <Button
                size="sm"
                variant={tab === "users" ? "default" : "secondary"}
                onClick={() => setTab("users")}
              >
                Utilisateurs
              </Button>
            </div>

            {tab === "orgs" ? (
              <div className="mt-4 overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-surface text-xs uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2">Organisation</th>
                      <th className="px-3 py-2">Propriétaire</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Sièges</th>
                      <th className="px-3 py-2">Statut</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orgs.map((o) => (
                      <tr key={o.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="font-medium">{o.name}</div>
                          <div className="text-xs text-muted">{o.slug}</div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <div>{o.ownerName}</div>
                          <div className="text-muted">{o.ownerEmail}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              o.isPaid
                                ? "inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-xs text-ok"
                                : "rounded-full border border-border px-2 py-0.5 text-xs"
                            }
                          >
                            {o.isPaid ? <Crown className="size-3" /> : null}
                            {o.planLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {o.memberCount}/{o.maxSeats}
                        </td>
                        <td className="px-3 py-2 text-xs">{o.status}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {(["free", "pro", "enterprise"] as PlanId[]).map((p) => (
                              <button
                                key={p}
                                type="button"
                                disabled={o.plan === p}
                                className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase hover:border-accent disabled:opacity-40"
                                onClick={() => setPlan(o.id, p)}
                              >
                                {p}
                              </button>
                            ))}
                            <Link
                              to="/entreprise/$orgId"
                              params={{ orgId: o.id }}
                              className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:border-accent"
                            >
                              ouvrir
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-surface text-xs uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2">Utilisateur</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Flux</th>
                      <th className="px-3 py-2">Rôle plateforme</th>
                      <th className="px-3 py-2">Créé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{u.name}</td>
                        <td className="px-3 py-2 text-xs text-muted">{u.email}</td>
                        <td className="px-3 py-2 tabular-nums">{u.flowCount}</td>
                        <td className="px-3 py-2 text-xs">{u.platformRole}</td>
                        <td className="px-3 py-2 text-xs text-muted">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : !error ? (
          <p className="mt-6 text-sm text-muted">Chargement…</p>
        ) : null}
      </main>
    </div>
  );
}
