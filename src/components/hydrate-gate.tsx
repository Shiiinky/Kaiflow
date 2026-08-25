import { useEffect, type ReactNode } from "react";
import { listFlows } from "@/lib/flow/api";
import { useFlowStore } from "@/lib/flow/store";

export function HydrateGate({ children }: { children: ReactNode }) {
  const hydrated = useFlowStore((s) => s.hydrated);

  useEffect(() => {
    let cancelled = false;
    listFlows()
      .then((docs) => {
        if (!cancelled) useFlowStore.getState().loadAll(docs);
      })
      .catch((err) => {
        console.error("[kaiflow] listFlows failed", err);
        if (!cancelled) {
          const current = useFlowStore.getState().flows;
          useFlowStore.setState({ hydrated: true, flows: current });
        }
      });
    return () => {
      cancelled = true;
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
