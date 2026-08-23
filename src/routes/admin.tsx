import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Crown,
  LayoutDashboard,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AccountChip } from "@/components/account-chip";
import { BrandMark } from "@/components/brand";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import {
  adminListOrgs,
  adminSetOrgPlan,
  adminSetOrgStatus,
  adminSetPlatformRole,
  adminSetUserPlan,
} from "@/lib/billing/org-api";
import type { PlanId } from "@/lib/billing/plans";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireAuth>
      <AdminPage />
    </RequireAuth>
  ),
});

type AdminData = Awaited<ReturnType<typeof adminListOrgs>>;
type Tab = "overview" | "users" | "orgs";

function PlanButtons({
  current,
  onPick,
  disabled,
}: {
  current: PlanId;
  onPick: (p: PlanId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {(["free", "pro", "enterprise"] as PlanId[]).map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled || current === p}
          className={
            current === p
              ? "rounded border border-accent/40 bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent"
              : "rounded border border-border px-2 py-0.5 text-[10px] uppercase text-muted hover:border-accent hover:text-fg disabled:opacity-40"
          }
          onClick={() => onPick(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("users");
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | PlanId>("all");
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void adminListOrgs()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message || "Accès refusé"));
  };

  useEffect(() => {
    reload();
  }, []);

  const flash = (msg: string) => {
    setOk(msg);
    window.setTimeout(() => setOk(null), 2500);
  };

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      flash(success);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.users.filter((u) => {
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      if (!needle) return true;
      return (
        u.name?.toLowerCase().includes(needle) ||
        u.email?.toLowerCase().includes(needle) ||
        u.primaryOrgName?.toLowerCase().includes(needle)
      );
    });
  }, [data, q, planFilter]);

  const filteredOrgs = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.orgs.filter((o) => {
      if (planFilter !== "all" && o.plan !== planFilter) return false;
      if (!needle) return true;
      return (
        o.name.toLowerCase().includes(needle) ||
        o.slug.toLowerCase().includes(needle) ||
        (o.ownerEmail ?? "").toLowerCase().includes(needle) ||
        (o.ownerName ?? "").toLowerCase().includes(needle)
      );
    });
  }, [data, q, planFilter]);

  const nav: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "orgs", label: "Organisations", icon: Building2 },
  ];

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <BrandMark to="/app" />
          <span className="hidden items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent sm:inline-flex">
            <Shield className="size-3" />
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app">
              <ArrowLeft className="mr-1 size-3.5" />
              App
            </Link>
          </Button>
          <AccountChip />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:px-8">
        <aside className="w-full shrink-0 md:w-52">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Menu admin</p>
          <nav className="flex gap-1 md:flex-col">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={
                    active
                      ? "flex flex-1 items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-left text-sm font-medium text-accent md:flex-none"
                      : "flex flex-1 items-center gap-2 rounded-md border border-transparent px-3 py-2 text-left text-sm text-muted hover:border-border hover:bg-surface hover:text-fg md:flex-none"
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">
            {tab === "overview" && "Vue d'ensemble"}
            {tab === "users" && "Gestion des comptes"}
            {tab === "orgs" && "Organisations"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {tab === "users" && "Upgrade / downgrade, rôles plateforme, recherche."}
            {tab === "orgs" && "Plans, statuts et sièges des organisations."}
            {tab === "overview" && "Indicateurs payants / gratuits."}
          </p>

          {error ? (
            <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          ) : null}
          {ok ? (
            <div className="mt-4 rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{ok}</div>
          ) : null}

          {!data ? (
            <p className="mt-6 text-sm text-muted">Chargement…</p>
          ) : (
            <>
              {tab === "overview" ? (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Utilisateurs", data.stats.totalUsers],
                    ["Organisations", data.stats.totalOrgs],
                    ["Payantes", data.stats.paid],
                    ["Gratuites", data.stats.free],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-md border border-border bg-surface p-4">
                      <div className="text-[10px] uppercase tracking-wide text-muted">{k}</div>
                      <div className="mt-1 font-display text-3xl font-bold tabular-nums">{v}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              {(tab === "users" || tab === "orgs") && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input
                      className="h-10 w-full rounded-sm border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-accent"
                      placeholder={
                        tab === "users"
                          ? "Rechercher nom, email, organisation…"
                          : "Rechercher org, propriétaire…"
                      }
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>
                  <select
                    className="h-10 rounded-sm border border-border bg-surface px-2 text-sm"
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value as "all" | PlanId)}
                  >
                    <option value="all">Tous les plans</option>
                    <option value="free">Gratuit</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Entreprise</option>
                  </select>
                </div>
              )}

              {tab === "users" ? (
                <div className="mt-4 overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="bg-surface text-xs uppercase text-muted">
                      <tr>
                        <th className="px-3 py-2.5">Utilisateur</th>
                        <th className="px-3 py-2.5">Organisation</th>
                        <th className="px-3 py-2.5">Plan</th>
                        <th className="px-3 py-2.5">Flux</th>
                        <th className="px-3 py-2.5">Rôle</th>
                        <th className="px-3 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-t border-border align-top">
                          <td className="px-3 py-3">
                            <div className="font-medium">{u.name || "—"}</div>
                            <div className="text-xs text-muted">{u.email}</div>
                          </td>
                          <td className="px-3 py-3 text-xs">
                            <div>{u.primaryOrgName || "—"}</div>
                            <div className="text-muted">{u.orgCount} org · {u.status}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={
                                u.isPaid
                                  ? "inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-xs text-ok"
                                  : "rounded-full border border-border px-2 py-0.5 text-xs"
                              }
                            >
                              {u.isPaid ? <Crown className="size-3" /> : null}
                              {u.planLabel}
                            </span>
                          </td>
                          <td className="px-3 py-3 tabular-nums">{u.flowCount}</td>
                          <td className="px-3 py-3 text-xs">
                            {u.platformRole === "platform_admin" ? (
                              <span className="text-accent">platform_admin</span>
                            ) : (
                              "user"
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-2">
                              <PlanButtons
                                current={u.plan}
                                disabled={busy || !u.primaryOrgId}
                                onPick={(p) =>
                                  void run(
                                    () => adminSetUserPlan({ data: { userId: u.id, plan: p } }),
                                    `${u.email} → ${p}`,
                                  )
                                }
                              />
                              <div className="flex flex-wrap gap-1">
                                {u.platformRole === "platform_admin" ? (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-danger hover:text-danger"
                                    onClick={() =>
                                      void run(
                                        () =>
                                          adminSetPlatformRole({
                                            data: { userId: u.id, role: "user" },
                                          }),
                                        "Rôle admin retiré",
                                      )
                                    }
                                  >
                                    Retirer admin
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-accent hover:text-accent"
                                    onClick={() =>
                                      void run(
                                        () =>
                                          adminSetPlatformRole({
                                            data: { userId: u.id, role: "platform_admin" },
                                          }),
                                        "Admin plateforme accordé",
                                      )
                                    }
                                  >
                                    + Admin plateforme
                                  </button>
                                )}
                                {u.primaryOrgId ? (
                                  <Link
                                    to="/entreprise/$orgId"
                                    params={{ orgId: u.primaryOrgId }}
                                    className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:border-accent"
                                  >
                                    Ouvrir org
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                            Aucun utilisateur trouvé
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {tab === "orgs" ? (
                <div className="mt-4 overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="bg-surface text-xs uppercase text-muted">
                      <tr>
                        <th className="px-3 py-2.5">Organisation</th>
                        <th className="px-3 py-2.5">Propriétaire</th>
                        <th className="px-3 py-2.5">Plan</th>
                        <th className="px-3 py-2.5">Sièges</th>
                        <th className="px-3 py-2.5">Statut</th>
                        <th className="px-3 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrgs.map((o) => (
                        <tr key={o.id} className="border-t border-border align-top">
                          <td className="px-3 py-3">
                            <div className="font-medium">{o.name}</div>
                            <div className="text-xs text-muted">{o.slug}</div>
                          </td>
                          <td className="px-3 py-3 text-xs">
                            <div>{o.ownerName}</div>
                            <div className="text-muted">{o.ownerEmail}</div>
                          </td>
                          <td className="px-3 py-3">
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
                          <td className="px-3 py-3 tabular-nums">
                            {o.memberCount}/{o.maxSeats}
                          </td>
                          <td className="px-3 py-3">
                            <select
                              className="h-8 rounded-sm border border-border bg-bg px-1 text-xs"
                              value={o.status}
                              disabled={busy}
                              onChange={(e) =>
                                void run(
                                  () =>
                                    adminSetOrgStatus({
                                      data: { orgId: o.id, status: e.target.value },
                                    }),
                                  `Statut → ${e.target.value}`,
                                )
                              }
                            >
                              <option value="active">active</option>
                              <option value="trial">trial</option>
                              <option value="past_due">past_due</option>
                              <option value="canceled">canceled</option>
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-2">
                              <PlanButtons
                                current={o.plan}
                                disabled={busy}
                                onPick={(p) =>
                                  void run(
                                    () => adminSetOrgPlan({ data: { orgId: o.id, plan: p } }),
                                    `${o.name} → ${p}`,
                                  )
                                }
                              />
                              <Link
                                to="/entreprise/$orgId"
                                params={{ orgId: o.id }}
                                className="inline-block rounded border border-border px-1.5 py-0.5 text-[10px] hover:border-accent"
                              >
                                Gérer membres
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrgs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">
                            Aucune organisation trouvée
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
