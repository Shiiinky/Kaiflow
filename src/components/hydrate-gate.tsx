import { useEffect, type ReactNode } from "react";
import { useFlowStore } from "@/lib/flow/store";

export function HydrateGate({ children }: { children: ReactNode }) {
  const hydrated = useFlowStore((s) => s.hydrated);

  useEffect(() => {
    const finish = () => {
      useFlowStore.getState().seedIfEmpty();
      useFlowStore.getState().setHydrated();
    };
    const unsub = useFlowStore.persist.onFinishHydration(finish);
    if (useFlowStore.persist.hasHydrated()) finish();
    const t = window.setTimeout(finish, 80);
    return () => {
      unsub();
      window.clearTimeout(t);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        Chargement des flux…
      </div>
    );
  }
  return children;
}
