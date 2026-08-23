import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Crown, Plus, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountChip } from "@/components/account-chip";
import { BrandMark } from "@/components/brand";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import {
  createOrganization,
  getMyAccount,
  type AccountSnapshot,
} from "@/lib/billing/org-api";
import { PLANS } from "@/lib/billing/plans";

export const Route = createFileRoute("/compte")({
  component: () => (
    <RequireAuth>
      <ComptePage />
    </RequireAuth>
  ),
});

function ComptePage() {
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void getMyAccount()
      .then(setAccount)
      .catch((e: Error) => setError(e.message || "Erreur"));
  };

  useEffect(() => {
    reload();
  }, []);

  const onCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createOrganization({ data: { name: newName.trim() } });
      setNewName("");
      setCreating(false);
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
          {account?.isPlatformAdmin ? (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/admin">
                <Shield className="mr-1.5 size-3.5" />
                Admin
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app">Mes flux</Link>
          </Button>
          <AccountChip />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Compte</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Mon espace</h1>
        {account ? (
          <p className="mt-1 text-sm text-muted">
            {account.name} · {account.email}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">Chargement…</p>
        )}

        {error ? (
          <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Organisations</h2>
            <Button size="sm" variant="secondary" onClick={() => setCreating((v) => !v)}>
              <Plus className="mr-1 size-3.5" />
              Nouvelle entreprise
            </Button>
          </div>

          {creating ? (
            <div className="mt-3 flex flex-col gap-2 rounded-md border border-border bg-surface p-3 sm:flex-row">
              <input
                className="h-10 flex-1 rounded-sm border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
                placeholder="Nom de l'entreprise"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button disabled={busy || !newName.trim()} onClick={() => void onCreate()}>
                Créer
              </Button>
            </div>
          ) : null}

          <ul className="mt-4 space-y-3">
            {(account?.orgs ?? []).map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-sm border border-accent/25 bg-accent/10 text-accent">
                    <Building2 className="size-5" />
                  </span>
                  <div>
                    <div className="font-medium">{o.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span
                        className={
                          o.isPaid
                            ? "inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-ok"
                            : "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5"
                        }
                      >
                        {o.isPaid ? <Crown className="size-3" /> : null}
                        {o.planLabel}
                      </span>
                      <span>
                        {o.memberCount}/{o.maxSeats} siège{o.maxSeats > 1 ? "s" : ""}
                      </span>
                      <span className="uppercase tracking-wide">{o.role}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link to="/entreprise/$orgId" params={{ orgId: o.id }}>
                    Gérer
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-lg font-bold">Plans</h2>
          <p className="mt-1 text-sm text-muted">
            Pour passer en Pro ou Entreprise, contactez-nous ou demandez à un admin Kaiflow d'activer
            le plan.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.values(PLANS).map((p) => (
              <div key={p.id} className="rounded-md border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-wider text-muted">{p.label}</div>
                <div className="mt-1 font-display text-xl font-bold">{p.priceLabel}</div>
                <ul className="mt-3 space-y-1 text-xs text-muted-2">
                  {p.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
