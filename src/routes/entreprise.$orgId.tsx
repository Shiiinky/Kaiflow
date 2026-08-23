import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Mail, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AccountChip } from "@/components/account-chip";
import { BrandMark } from "@/components/brand";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import {
  getOrgDetail,
  inviteMember,
  removeMember,
  renameOrganization,
  revokeInvite,
  updateMemberRole,
} from "@/lib/billing/org-api";
import { canManageMembers, type MemberRole } from "@/lib/billing/plans";

export const Route = createFileRoute("/entreprise/$orgId")({
  component: () => (
    <RequireAuth>
      <OrgPage />
    </RequireAuth>
  ),
});

type Detail = Awaited<ReturnType<typeof getOrgDetail>>;

function inviteUrl(token: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/invite/${token}`;
  }
  return `https://kaiflow.fr/invite/${token}`;
}

function OrgPage() {
  const { orgId } = Route.useParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [busy, setBusy] = useState(false);
  const [nameEdit, setNameEdit] = useState("");
  const [lastInvite, setLastInvite] = useState<{
    email: string;
    mode: "added" | "invited";
    link?: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const reload = useCallback(() => {
    void getOrgDetail({ data: orgId })
      .then((d) => {
        setDetail(d);
        setNameEdit(d.org.name);
      })
      .catch((e: Error) => setError(e.message || "Erreur"));
  }, [orgId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const manage = detail ? canManageMembers(detail.myRole) || detail.isPlatformAdmin : false;

  const copyLink = async (token: string, id: string) => {
    const url = inviteUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt("Copiez ce lien d'invitation :", url);
    }
  };

  const onInvite = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setLastInvite(null);
    try {
      const res = await inviteMember({ data: { orgId, email: email.trim(), role } });
      if (res.mode === "added") {
        setLastInvite({ email: email.trim(), mode: "added" });
      } else {
        setLastInvite({
          email: email.trim(),
          mode: "invited",
          link: inviteUrl(res.token),
        });
      }
      setEmail("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur invitation");
    } finally {
      setBusy(false);
    }
  };

  const onRename = async () => {
    if (!nameEdit.trim() || nameEdit === detail?.org.name) return;
    setBusy(true);
    try {
      await renameOrganization({ data: { orgId, name: nameEdit.trim() } });
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
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

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        {!detail ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Entreprise</p>
            {manage ? (
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="h-11 flex-1 rounded-sm border border-border bg-surface px-3 font-display text-2xl font-extrabold outline-none focus:border-accent"
                  value={nameEdit}
                  onChange={(e) => setNameEdit(e.target.value)}
                  onBlur={() => void onRename()}
                />
              </div>
            ) : (
              <h1 className="mt-1 font-display text-3xl font-extrabold">{detail.org.name}</h1>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              <span className="rounded-full border border-border px-2 py-0.5">{detail.org.planLabel}</span>
              <span className="rounded-full border border-border px-2 py-0.5">{detail.org.status}</span>
              <span>
                {detail.members.length}/{detail.limits.maxSeats} sièges · rôle {detail.myRole}
              </span>
            </div>

            {error ? (
              <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            {manage ? (
              <section className="mt-8 rounded-md border border-border bg-surface p-4">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <UserPlus className="size-4 text-accent" />
                  Inviter un collaborateur
                </h2>
                <p className="mt-1 text-xs text-muted">
                  S'il a déjà un compte Kaiflow, il est ajouté tout de suite. Sinon, un lien
                  d'invitation est généré (valable 14 jours) — à partager manuellement (aucun email
                  automatique pour l'instant).
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    className="h-10 flex-1 rounded-sm border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
                    placeholder="email@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void onInvite();
                    }}
                  />
                  <select
                    className="h-10 rounded-sm border border-border bg-bg px-2 text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value as MemberRole)}
                  >
                    <option value="member">Membre</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button disabled={busy || !email.trim()} onClick={() => void onInvite()}>
                    Inviter
                  </Button>
                </div>

                {lastInvite ? (
                  <div className="mt-4 rounded-md border border-accent/40 bg-accent/10 px-3 py-3 text-sm">
                    {lastInvite.mode === "added" ? (
                      <p>
                        <strong>{lastInvite.email}</strong> a un compte et a été ajouté
                        immédiatement.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p>
                          Invitation créée pour <strong>{lastInvite.email}</strong>. Envoyez-lui ce
                          lien :
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <code className="block flex-1 overflow-x-auto rounded border border-border bg-bg px-2 py-1.5 text-xs break-all">
                            {lastInvite.link}
                          </code>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              if (lastInvite.link) {
                                void navigator.clipboard.writeText(lastInvite.link).then(() => {
                                  setCopiedId("last");
                                  setTimeout(() => setCopiedId(null), 2000);
                                });
                              }
                            }}
                          >
                            {copiedId === "last" ? (
                              <Check className="size-3.5" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            {copiedId === "last" ? "Copié" : "Copier"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="mt-8">
              <h2 className="font-display text-lg font-bold">Membres</h2>
              <ul className="mt-3 divide-y divide-border rounded-md border border-border">
                {detail.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{m.name}</div>
                      <div className="truncate text-xs text-muted">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {manage && detail.myRole === "owner" && m.role !== "owner" ? (
                        <select
                          className="h-8 rounded-sm border border-border bg-bg px-1 text-xs"
                          value={m.role}
                          onChange={(e) => {
                            void updateMemberRole({
                              data: {
                                orgId,
                                memberId: m.id,
                                role: e.target.value as MemberRole,
                              },
                            })
                              .then(reload)
                              .catch((err: Error) => setError(err.message));
                          }}
                        >
                          <option value="member">Membre</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Propriétaire</option>
                        </select>
                      ) : (
                        <span className="text-xs uppercase tracking-wide text-muted">{m.role}</span>
                      )}
                      {manage && m.role !== "owner" ? (
                        <button
                          type="button"
                          className="text-muted hover:text-danger"
                          title="Retirer"
                          onClick={() => {
                            void removeMember({ data: { orgId, memberId: m.id } })
                              .then(reload)
                              .catch((err: Error) => setError(err.message));
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {detail.invites.length > 0 ? (
              <section className="mt-8">
                <h2 className="font-display text-lg font-bold">Invitations en attente</h2>
                <p className="mt-1 text-xs text-muted">
                  Aucun email n'est envoyé automatiquement — partagez le lien avec le collaborateur.
                </p>
                <ul className="mt-3 divide-y divide-border rounded-md border border-border">
                  {detail.invites.map((i) => (
                    <li
                      key={i.id}
                      className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <Mail className="size-4 shrink-0 text-muted" />
                        <span className="truncate">{i.email}</span>
                        <span className="shrink-0 text-xs text-muted">({i.role})</span>
                      </div>
                      {manage ? (
                        <div className="flex shrink-0 items-center gap-2">
                          {i.token ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                              onClick={() => void copyLink(i.token!, i.id)}
                            >
                              {copiedId === i.id ? (
                                <Check className="size-3.5" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                              {copiedId === i.id ? "Copié" : "Copier le lien"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="text-xs text-muted hover:text-danger"
                            onClick={() => {
                              void revokeInvite({ data: { orgId, inviteId: i.id } })
                                .then(reload)
                                .catch((err: Error) => setError(err.message));
                            }}
                          >
                            Révoquer
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
