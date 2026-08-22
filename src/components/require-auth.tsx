import { type ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { HydrateGate } from "@/components/hydrate-gate";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg font-mono text-sm text-muted">
        Connexion…
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <HydrateGate>{children}</HydrateGate>;
}
