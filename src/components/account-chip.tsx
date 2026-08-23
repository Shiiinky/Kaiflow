import { Link } from "@tanstack/react-router";
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

  useEffect(() => {
    if (!user) return;
    void getMyAccount()
      .then((a) => {
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
    <div className="flex items-center gap-2">
      <Link
        to="/compte"
        className="flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-surface-2"
        title="Mon compte"
      >
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full border border-accent/30 bg-accent/10 font-mono text-xs text-accent">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-sm text-muted-2 sm:inline">{label}</span>
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
        size="sm"
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
