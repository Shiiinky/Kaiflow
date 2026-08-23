import { Link } from "@tanstack/react-router";
import { LogOut, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { getMyAccount } from "@/lib/billing/org-api";

export function AccountChip() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getMyAccount()
      .then((a) => {
        setIsAdmin(a.isPlatformAdmin);
        const primary = a.orgs[0];
        if (primary) {
          setPlanLabel(primary.planLabel);
          setIsPaid(primary.isPaid);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [user]);

  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Compte";
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {isAdmin ? (
        <Button variant="secondary" size="sm" asChild className="hidden sm:inline-flex">
          <Link to="/admin">
            <Shield className="mr-1 size-3.5" />
            Admin
          </Link>
        </Button>
      ) : null}
      <Link
        to="/compte"
        className="flex min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 hover:bg-surface-2 sm:gap-2"
        title="Mon compte"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10 font-mono text-xs text-accent">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate text-sm text-muted-2 md:inline">
          {label}
        </span>
        {planLabel ? (
          <span
            className={
              isPaid
                ? "hidden rounded-full border border-ok/30 bg-ok/10 px-1.5 py-0.5 text-[10px] font-medium text-ok sm:inline"
                : "hidden rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted sm:inline"
            }
          >
            {planLabel}
          </span>
        ) : null}
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 sm:hidden"
        disabled={signingOut}
        aria-label="Déconnexion"
        title="Déconnexion"
        onClick={() => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        }}
      >
        {signingOut ? "…" : <LogOut className="size-4" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="hidden shrink-0 sm:inline-flex"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        }}
      >
        {signingOut ? "…" : "Déconnexion"}
      </Button>
    </div>
  );
}
