import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Gauge,
  Link2,
  ListOrdered,
  MoreHorizontal,
  Plus,
  Settings2,
  Trash2,
  Undo2,
  Redo2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FlowCanvas } from "@/components/editor/flow-canvas";
import { JohnsonPanel } from "@/components/editor/johnson-panel";
import { KpiBar } from "@/components/editor/kpi-bar";
import { MosDialog } from "@/components/editor/mos-dialog";
import {
  Chrono,
  KpiGrid,
  PropsForm,
  Recs,
  WhatIf,
} from "@/components/editor/side-rail";
import { Yamazumi } from "@/components/editor/yamazumi";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/require-auth";
import { blocksFor, NODE_H, NODE_W } from "@/lib/flow/blocks";
import { isAdminMode } from "@/lib/flow/types";
import { analyzeFlow } from "@/lib/flow/engine";
import { useFlowStore } from "@/lib/flow/store";
import { cn } from "@/lib/cn";
import type { FlowNode, NodeType } from "@/lib/flow/types";

export const Route = createFileRoute("/editor/$id")({
  component: () => (
    <RequireAuth>
      <EditorPage />
    </RequireAuth>
  ),
});

type SheetTab = "blocks" | "props" | "kpis" | "yamazumi" | "johnson" | "settings";

function EditorPage() {
  const { id } = Route.useParams();
  const doc = useFlowStore((s) => s.getFlow(id));
  const patchNode = useFlowStore((s) => s.patchNode);
  const moveNode = useFlowStore((s) => s.moveNode);
  const addNode = useFlowStore((s) => s.addNode);
  const removeNode = useFlowStore((s) => s.removeNode);
  const toggleLink = useFlowStore((s) => s.toggleLink);
  const setConnectionLabel = useFlowStore((s) => s.setConnectionLabel);
  const updateSettings = useFlowStore((s) => s.updateSettings);
  const renameMeta = useFlowStore((s) => s.renameMeta);
  const setJohnsonJobs = useFlowStore((s) => s.setJohnsonJobs);
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const commitHistory = useFlowStore((s) => s.commitHistory);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [sheetTab, setSheetTab] = useState<SheetTab>("blocks");
  const [sheetOpen, setSheetOpen] = useState(true);
  const [mosOpen, setMosOpen] = useState(false);
  const [recenterToken, setRecenterToken] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (selectedId && doc && !doc.nodes.some((n) => n.id === selectedId)) {
      setSelectedId(null);
    }
  }, [doc, selectedId]);

  if (!doc) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
        <p className="text-muted">Flux introuvable.</p>
        <Button asChild>
          <Link to="/app">Retour</Link>
        </Button>
      </div>
    );
  }

  const selected = doc.nodes.find((n) => n.id === selectedId) ?? null;
  const analysis = analyzeFlow(doc);
  const bottleneckIds = analysis.bottleneck?.ids ?? [];
  const admin = isAdminMode(doc);

  const sheetTabs: { id: SheetTab; label: string; icon: typeof Plus }[] = admin
    ? [
        { id: "blocks", label: "Blocs", icon: Plus },
        { id: "props", label: "Étape", icon: Settings2 },
        { id: "kpis", label: "KPI", icon: Gauge },
        { id: "settings", label: "Processus", icon: Settings2 },
      ]
    : [
        { id: "blocks", label: "Blocs", icon: Plus },
        { id: "props", label: "Poste", icon: Settings2 },
        { id: "kpis", label: "KPI", icon: Gauge },
        { id: "yamazumi", label: "Yama", icon: ListOrdered },
        { id: "johnson", label: "Seq", icon: Link2 },
        { id: "settings", label: "Ligne", icon: Settings2 },
      ];

  const placeBlock = (type: NodeType, label: string) => {
    const x = 80 + doc.nodes.length * 24;
    const y = 120 + (doc.nodes.length % 3) * 40;
    const nid = addNode(id, type, label, x, y);
    setSelectedId(nid);
    setSheetTab("props");
  };

  const onNodePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation();
      if (linkMode) {
        if (!linkSource) {
          setLinkSource(nodeId);
        } else {
          toggleLink(id, linkSource, nodeId);
          setLinkSource(null);
        }
        return;
      }
      setSelectedId(nodeId);
      setSheetTab("props");
      const startX = e.clientX;
      const startY = e.clientY;
      const node = doc.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const ox = node.x;
      const oy = node.y;
      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / scale;
        const dy = (ev.clientY - startY) / scale;
        moveNode(id, nodeId, ox + dx, oy + dy);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        commitHistory(id);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [commitHistory, doc, id, linkMode, linkSource, moveNode, scale, toggleLink],
  );

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-2 py-2 md:px-4">
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to="/app">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold md:text-base">{doc.nom}</div>
          <div className="truncate text-[11px] text-muted">
            {doc.usine} · {doc.atelier}
          </div>
        </div>
        <Button
          variant={linkMode ? "primary" : "secondary"}
          size="sm"
          onClick={() => {
            setLinkMode((v) => !v);
            setLinkSource(null);
          }}
          title="Relier deux blocs"
        >
          <Link2 className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => undo(id)}>
          <Undo2 className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => redo(id)}>
          <Redo2 className="size-4" />
        </Button>
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setMenuOpen((v) => !v)}>
            <MoreHorizontal className="size-4" />
          </Button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-md border border-border bg-card py-1 shadow-xl">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface"
                onClick={() => {
                  setMenuOpen(false);
                  setRecenterToken((t) => t + 1);
                }}
              >
                Ajuster la vue
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <KpiBar doc={doc} />

      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1">
          <FlowCanvas
            nodes={doc.nodes}
            connections={doc.connections}
            scale={scale}
            onScaleChange={setScale}
            selectedId={selectedId}
            bottleneckIds={bottleneckIds}
            linkMode={linkMode}
            linkSource={linkSource}
            onSelect={setSelectedId}
            onNodePointerDown={onNodePointerDown}
            recenterToken={recenterToken}
            onDropBlock={(type, label, x, y) => {
              const nid = addNode(id, type as NodeType, label, x, y);
              setSelectedId(nid);
              setSheetTab("props");
            }}
          />
        </div>

        <aside className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface md:flex">
          <div className="sticky top-0 z-10 flex gap-1 border-b border-border bg-surface p-2">
            {(admin
              ? (["blocks", "props", "kpis", "settings"] as SheetTab[])
              : (["blocks", "props", "kpis", "yamazumi", "johnson", "settings"] as SheetTab[])
            ).map((t) => (
              <button
                key={t}
                onClick={() => setSheetTab(t)}
                className={cn(
                  "flex-1 rounded-sm px-1 py-1.5 text-[10px] font-medium uppercase tracking-wide",
                  sheetTab === t ? "bg-accent/15 text-accent" : "text-muted hover:text-fg",
                )}
              >
                {t === "blocks"
                  ? "Blocs"
                  : t === "props"
                    ? admin
                      ? "Étape"
                      : "Poste"
                    : t === "kpis"
                      ? "KPI"
                      : t === "yamazumi"
                        ? "Yama"
                        : t === "johnson"
                          ? "Seq"
                          : admin
                            ? "Processus"
                            : "Ligne"}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-4 p-3">
            <SheetBody
              tab={sheetTab}
              doc={doc}
              selected={selected}
              placeBlock={placeBlock}
              onPatch={(patch) => selected && patchNode(id, selected.id, patch)}
              onRemove={() => {
                if (!selected) return;
                removeNode(id, selected.id);
                setSelectedId(null);
              }}
              onOpenMos={() => setMosOpen(true)}
              onSettings={(s) => updateSettings(id, s)}
              onMeta={(p) => renameMeta(id, p)}
              onJohnson={(jobs) => setJohnsonJobs(id, jobs)}
              onApplyCycle={(secs) => selected && patchNode(id, selected.id, { cycle: secs })}
              onConnectionLabel={(connId, label) => setConnectionLabel(id, connId, label)}
            />
          </div>
        </aside>
      </div>

      <div className="z-20 flex shrink-0 flex-col border-t border-border bg-surface md:hidden">
        <div className="flex gap-1 overflow-x-auto px-2 pt-2">
          {sheetTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSheetTab(t.id);
                setSheetOpen(true);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                sheetTab === t.id && sheetOpen ? "bg-accent text-bg" : "bg-card text-muted",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        {sheetOpen ? (
          <div className="max-h-[42dvh] overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            <SheetBody
              tab={sheetTab}
              doc={doc}
              selected={selected}
              placeBlock={placeBlock}
              onPatch={(patch) => selected && patchNode(id, selected.id, patch)}
              onRemove={() => {
                if (!selected) return;
                removeNode(id, selected.id);
                setSelectedId(null);
              }}
              onOpenMos={() => setMosOpen(true)}
              onSettings={(s) => updateSettings(id, s)}
              onMeta={(p) => renameMeta(id, p)}
              onJohnson={(jobs) => setJohnsonJobs(id, jobs)}
              onApplyCycle={(secs) => selected && patchNode(id, selected.id, { cycle: secs })}
              onConnectionLabel={(connId, label) => setConnectionLabel(id, connId, label)}
              mobile
            />
          </div>
        ) : null}
      </div>

      <MosDialog
        open={mosOpen}
        node={selected}
        onOpenChange={setMosOpen}
        onSave={(mos) => {
          if (selected) patchNode(id, selected.id, { mos });
        }}
      />
    </div>
  );
}

function SheetBody({
  tab,
  doc,
  selected,
  placeBlock,
  onPatch,
  onRemove,
  onOpenMos,
  onSettings,
  onMeta,
  onJohnson,
  onApplyCycle,
  onConnectionLabel,
  mobile,
}: {
  tab: SheetTab;
  doc: NonNullable<ReturnType<typeof useFlowStore.getState>["flows"][number]>;
  selected: FlowNode | null;
  placeBlock: (type: NodeType, label: string) => void;
  onPatch: (patch: Partial<FlowNode>) => void;
  onRemove: () => void;
  onOpenMos: () => void;
  onSettings: (s: typeof doc.settings) => void;
  onMeta: (p: Partial<Pick<typeof doc, "nom" | "usine" | "atelier">>) => void;
  onJohnson: (jobs: typeof doc.johnsonJobs) => void;
  onApplyCycle: (secs: number) => void;
  onConnectionLabel?: (connId: string, label: string) => void;
  mobile?: boolean;
}) {
  if (tab === "blocks") {
    return (
      <div className={cn("grid gap-2", mobile ? "grid-cols-2" : "grid-cols-1")}>
        {blocksFor(doc.mode).map((b) => (
          <button
            key={b.type}
            type="button"
            draggable={!mobile}
            onDragStart={(e) => {
              e.dataTransfer.setData("block-type", b.type);
              e.dataTransfer.setData("block-label", b.label);
            }}
            onClick={() => placeBlock(b.type, b.label)}
            className="rounded-md border border-border bg-card p-3 text-left active:border-accent hover:border-accent/50"
          >
            <div className="font-display text-sm font-semibold">{b.label}</div>
            <p className="mt-0.5 text-[11px] text-muted">{b.hint}</p>
            {mobile ? <p className="mt-1 text-[10px] text-accent">Toucher pour placer</p> : null}
          </button>
        ))}
        {!mobile ? (
          <p className="text-[11px] text-muted">
            Glissez un bloc sur le canvas, ou cliquez pour le placer.
          </p>
        ) : null}
      </div>
    );
  }

  if (tab === "props") {
    if (!selected) {
      return <p className="text-sm text-muted">Sélectionnez un bloc sur le flux.</p>;
    }
    return (
      <div className="space-y-4">
        <PropsForm
          node={selected}
          onChange={onPatch}
          onOpenMos={onOpenMos}
          connections={doc.connections}
          nodes={doc.nodes}
          onConnectionLabel={onConnectionLabel}
        />
        {!isAdminMode(doc) ? <Chrono onApply={onApplyCycle} /> : null}
        <Button variant="danger" size="sm" className="w-full" onClick={onRemove}>
          <Trash2 className="size-3.5" />
          Supprimer
        </Button>
      </div>
    );
  }

  if (tab === "kpis") {
    return (
      <div className="space-y-4">
        <KpiGrid doc={doc} />
        <WhatIf doc={doc} />
        <Recs doc={doc} />
      </div>
    );
  }

  if (tab === "yamazumi" && !isAdminMode(doc)) {
    const a = analyzeFlow(doc);
    return <Yamazumi analysis={a} />;
  }

  if (tab === "johnson" && !isAdminMode(doc)) {
    return <JohnsonPanel jobs={doc.johnsonJobs} onChange={onJohnson} />;
  }

  if (tab === "settings") {
    return (
      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-muted">Nom</span>
          <input
            className="h-10 w-full rounded-sm border border-border bg-bg px-3 text-sm"
            value={doc.nom}
            onChange={(e) => onMeta({ nom: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-muted">
            {isAdminMode(doc) ? "Service" : "Usine"}
          </span>
          <input
            className="h-10 w-full rounded-sm border border-border bg-bg px-3 text-sm"
            value={doc.usine}
            onChange={(e) => onMeta({ usine: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-muted">
            {isAdminMode(doc) ? "Processus" : "Atelier"}
          </span>
          <input
            className="h-10 w-full rounded-sm border border-border bg-bg px-3 text-sm"
            value={doc.atelier}
            onChange={(e) => onMeta({ atelier: e.target.value })}
          />
        </label>
        {!isAdminMode(doc) ? (
          <div className="grid grid-cols-3 gap-2">
            <label className="block space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-muted">Demande</span>
              <input
                type="number"
                className="h-10 w-full rounded-sm border border-border bg-bg px-2 text-sm"
                value={doc.settings.demand}
                onChange={(e) => onSettings({ ...doc.settings, demand: Number(e.target.value) })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-muted">Ouverture</span>
              <input
                type="number"
                className="h-10 w-full rounded-sm border border-border bg-bg px-2 text-sm"
                value={doc.settings.openingTime}
                onChange={(e) => onSettings({ ...doc.settings, openingTime: Number(e.target.value) })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-muted">Pauses</span>
              <input
                type="number"
                className="h-10 w-full rounded-sm border border-border bg-bg px-2 text-sm"
                value={doc.settings.plannedBreaks}
                onChange={(e) => onSettings({ ...doc.settings, plannedBreaks: Number(e.target.value) })}
              />
            </label>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
