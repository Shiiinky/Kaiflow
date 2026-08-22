import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronLeft,
  Download,
  Link2,
  Printer,
  Redo2,
  Settings2,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand";
import { FlowCanvas } from "@/components/editor/flow-canvas";
import { JohnsonPanel } from "@/components/editor/johnson-panel";
import { KpiBar } from "@/components/editor/kpi-bar";
import { MosDialog } from "@/components/editor/mos-dialog";
import { Chrono, KpiGrid, PropsForm, Recs, WhatIf } from "@/components/editor/side-rail";
import { Yamazumi } from "@/components/editor/yamazumi";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { BLOCKS } from "@/lib/flow/blocks";
import { analyzeFlow } from "@/lib/flow/engine";
import { useFlowStore } from "@/lib/flow/store";
import type { LineSettings, NodeType } from "@/lib/flow/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/editor/$id")({
  component: () => (
    <RequireAuth>
      <EditorPage />
    </RequireAuth>
  ),
});

function EditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === id));
  const {
    addNode,
    patchNode,
    moveNode,
    removeNode,
    toggleLink,
    commitHistory,
    undo,
    redo,
    renameMeta,
    updateSettings,
    deleteFlow,
    setJohnsonJobs,
  } = useFlowStore();

  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [mosOpen, setMosOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"kpis" | "poste" | "actions" | "johnson">("kpis");
  const [mobilePanel, setMobilePanel] = useState(false);
  const [yamaOpen, setYamaOpen] = useState(true);

  const analysis = useMemo(() => (flow ? analyzeFlow(flow) : null), [flow]);
  const selected = flow?.nodes.find((n) => n.id === selectedId) ?? null;
  const bnIds =
    analysis?.bottleneck && analysis.rendement !== null && analysis.rendement < 100
      ? analysis.bottleneck.ids
      : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(id);
        else undo(id);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (selectedId) removeNode(id, selectedId);
      }
      if (e.key === "Escape") {
        setLinkMode(false);
        setLinkSource(null);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, redo, removeNode, selectedId, undo]);

  if (!flow || !analysis) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg">
        <p className="text-muted">Flux introuvable.</p>
        <Button asChild>
          <Link to="/app">Retour</Link>
        </Button>
      </div>
    );
  }

  const dropBlock = (type: string, label: string, x: number, y: number) => {
    const nid = addNode(id, type as NodeType, label, x, y);
    setSelectedId(nid);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flow.nom.replace(/\s+/g, "-")}.kaiflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
        <BrandMark className="hidden text-lg sm:block" to="/app" />
        <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ChevronLeft className="size-4" />
          Flux
        </Link>
        <input
          value={flow.nom}
          onChange={(e) => renameMeta(id, { nom: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-center font-display text-sm font-bold outline-none focus:text-accent sm:max-w-sm"
        />
        <span className="hidden items-center gap-1.5 text-[11px] text-ok md:inline-flex">
          <span className="size-1.5 rounded-full bg-ok" />
          Compte
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => undo(id)} aria-label="Annuler">
            <Undo2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => redo(id)} aria-label="Rétablir">
            <Redo2 className="size-4" />
          </Button>
          <Button
            variant={linkMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setLinkMode((v) => !v);
              setLinkSource(null);
            }}
          >
            <Link2 className="size-4" />
            <span className="hidden sm:inline">Lier</span>
          </Button>
          <Button
            variant={yamaOpen ? "primary" : "ghost"}
            size="icon"
            onClick={() => setYamaOpen((v) => !v)}
            aria-label="Yamazumi"
          >
            <BarChart3 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(1.8, s * 1.12))}>
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.45, s / 1.12))}>
            <ZoomOut className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={downloadJson} aria-label="Exporter">
            <Download className="size-4" />
          </Button>
          <Button variant="secondary" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/rapport/$id" params={{ id }}>
              <Printer className="size-4" />
              Rapport
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobilePanel((v) => !v)}
          >
            Analyse
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[168px] shrink-0 flex-col border-r border-border bg-surface p-3 md:flex">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">Blocs</div>
          <div className="space-y-2">
            {BLOCKS.map((b) => (
              <button
                key={b.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("block-type", b.type);
                  e.dataTransfer.setData("block-label", b.label);
                }}
                onClick={() => dropBlock(b.type, b.label, 80 + flow.nodes.length * 24, 80 + (flow.nodes.length % 4) * 30)}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-left hover:border-accent/50"
              >
                <div className="text-sm font-medium">{b.label}</div>
                <div className="text-[11px] text-muted">{b.hint}</div>
              </button>
            ))}
          </div>
          <div className="mt-auto space-y-3 pt-4 text-[11px] leading-relaxed text-muted">
            <p>Glissez un bloc, ou cliquez pour le poser. Mode Lier : source puis cible.</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-xs border-2 border-warn" />
                Goulot au-dessus du takt
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1 w-3 rounded-xs bg-ok" />
                VA
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1 w-3 rounded-xs bg-warn" />
                NVA
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <FlowCanvas
            nodes={flow.nodes}
            connections={flow.connections}
            scale={scale}
            selectedId={selectedId}
            bottleneckIds={bnIds}
            linkMode={linkMode}
            linkSource={linkSource}
            onSelect={(nid) => {
              setSelectedId(nid);
              if (nid) setTab("poste");
            }}
            onNodePointerDown={(e, nid) => {
              e.stopPropagation();
              if (linkMode) {
                if (!linkSource) setLinkSource(nid);
                else {
                  toggleLink(id, linkSource, nid);
                  setLinkSource(null);
                  setLinkMode(false);
                }
                return;
              }
              setSelectedId(nid);
              setTab("poste");
              const node = flow.nodes.find((n) => n.id === nid);
              if (!node) return;
              const startX = e.clientX;
              const startY = e.clientY;
              const origX = node.x;
              const origY = node.y;
              commitHistory(id);
              const move = (ev: PointerEvent) => {
                moveNode(id, nid, origX + (ev.clientX - startX) / scale, origY + (ev.clientY - startY) / scale);
              };
              const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
            onDropBlock={dropBlock}
          />
          {yamaOpen ? (
            <div className="hidden h-[188px] shrink-0 border-t border-border bg-surface md:block">
              <div className="flex items-center justify-between px-4 pt-2">
                <div className="text-xs font-medium uppercase tracking-wider text-muted">
                  Yamazumi · takt {analysis.takt}s
                </div>
                {analysis.etp !== null ? (
                  <div className="text-xs text-muted">
                    ETP cible <span className="font-display text-accent">{analysis.etp}</span>
                  </div>
                ) : null}
              </div>
              <Yamazumi analysis={analysis} />
            </div>
          ) : null}
          <KpiBar doc={flow} />
        </div>

        <aside
          className={cn(
            "shrink-0 flex-col overflow-y-auto border-border bg-surface p-3",
            mobilePanel
              ? "fixed inset-x-0 bottom-0 top-14 z-30 flex w-full border-t"
              : "hidden w-[320px] border-l lg:flex",
          )}
        >
          <div className="mb-3 flex gap-1 rounded-sm bg-bg p-1">
            {(["kpis", "poste", "actions", "johnson"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-xs py-1.5 text-[11px] font-medium",
                  tab === t ? "bg-surface-2 text-fg" : "text-muted",
                )}
              >
                {t === "kpis" ? "KPIs" : t === "poste" ? "Poste" : t === "actions" ? "Actions" : "Johnson"}
              </button>
            ))}
          </div>
          {tab === "kpis" ? <KpiGrid doc={flow} /> : null}
          {tab === "poste" ? (
            selected ? (
              <div className="space-y-4">
                <PropsForm
                  node={selected}
                  onChange={(patch) => patchNode(id, selected.id, patch)}
                  onOpenMos={() => setMosOpen(true)}
                />
                <Chrono onApply={(seconds) => patchNode(id, selected.id, { cycle: seconds })} />
                <Button variant="danger" size="sm" className="w-full" onClick={() => removeNode(id, selected.id)}>
                  <Trash2 className="size-4" />
                  Supprimer le poste
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">Sélectionnez un bloc sur le canvas.</p>
            )
          ) : null}
          {tab === "actions" ? (
            <div className="space-y-4">
              <Recs doc={flow} />
              <WhatIf doc={flow} />
            </div>
          ) : null}
          {tab === "johnson" ? (
            <JohnsonPanel jobs={flow.johnsonJobs ?? []} onChange={(jobs) => setJohnsonJobs(id, jobs)} />
          ) : null}
        </aside>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-border bg-surface p-2 md:hidden">
        {BLOCKS.map((b) => (
          <button
            key={b.type}
            onClick={() => dropBlock(b.type, b.label, 40 + flow.nodes.length * 20, 40)}
            className="shrink-0 rounded-sm border border-border px-3 py-2 text-sm"
          >
            {b.label}
          </button>
        ))}
      </div>

      <MosDialog
        open={mosOpen}
        node={selected}
        onOpenChange={setMosOpen}
        onSave={(mos) => selected && patchNode(id, selected.id, { mos, cycle: 0 })}
      />

      {settingsOpen ? (
        <SettingsModal
          settings={flow.settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(s) => {
            updateSettings(id, s);
            setSettingsOpen(false);
          }}
          onDelete={() => {
            deleteFlow(id);
            void navigate({ to: "/app" });
          }}
        />
      ) : null}
    </div>
  );
}

function SettingsModal({
  settings,
  onClose,
  onSave,
  onDelete,
}: {
  settings: LineSettings;
  onClose: () => void;
  onSave: (s: LineSettings) => void;
  onDelete: () => void;
}) {
  const [s, setS] = useState(settings);
  const takt = Math.round((Math.max(0, s.openingTime - s.plannedBreaks) * 60) / Math.max(1, s.demand));
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold">Paramètres de ligne</h2>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            Demande (pièces / jour)
            <input
              type="number"
              className="mt-1 h-10 w-full rounded-sm border border-border bg-bg px-3"
              value={s.demand}
              onChange={(e) => setS({ ...s, demand: Number(e.target.value) })}
            />
          </label>
          <label className="block text-sm">
            Ouverture (min)
            <input
              type="number"
              className="mt-1 h-10 w-full rounded-sm border border-border bg-bg px-3"
              value={s.openingTime}
              onChange={(e) => setS({ ...s, openingTime: Number(e.target.value) })}
            />
          </label>
          <label className="block text-sm">
            Pauses planifiées (min)
            <input
              type="number"
              className="mt-1 h-10 w-full rounded-sm border border-border bg-bg px-3"
              value={s.plannedBreaks}
              onChange={(e) => setS({ ...s, plannedBreaks: Number(e.target.value) })}
            />
          </label>
        </div>
        <p className="mt-3 text-sm text-muted">
          Takt net : <span className="font-display text-accent tabular-nums">{takt}s</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => onSave(s)}>Enregistrer</Button>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" className="ml-auto" onClick={onDelete}>
            Supprimer le flux
          </Button>
        </div>
      </div>
    </div>
  );
}
