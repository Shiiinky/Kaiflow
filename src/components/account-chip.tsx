import { useState } from "react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function AccountChip() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Compte";
  return (
    <div className="flex items-center gap-2">
      {user.profileImageUrl ? (
        <img src={user.profileImageUrl} alt="" className="size-8 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 place-items-center rounded-full border border-accent/30 bg-accent/10 font-mono text-xs text-accent">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[140px] truncate text-sm text-muted-2 sm:inline">{label}</span>
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
