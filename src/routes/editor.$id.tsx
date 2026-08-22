import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Gauge,
  Link2,
  ListOrdered,
  Maximize2,
  MoreHorizontal,
  Plus,
  Redo2,
  Settings2,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
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
import { BLOCKS, NODE_H, NODE_W } from "@/lib/flow/blocks";
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
  const navigate = useNavigate();
  const doc = useFlowStore((s) => s.getFlow(id));
  const addNode = useFlowStore((s) => s.addNode);
  const patchNode = useFlowStore((s) => s.patchNode);
  const moveNode = useFlowStore((s) => s.moveNode);
  const removeNode = useFlowStore((s) => s.removeNode);
  const toggleLink = useFlowStore((s) => s.toggleLink);
  const updateSettings = useFlowStore((s) => s.updateSettings);
  const renameMeta = useFlowStore((s) => s.renameMeta);
  const setJohnsonJobs = useFlowStore((s) => s.setJohnsonJobs);
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const commitHistory = useFlowStore((s) => s.commitHistory);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.85);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [sheetTab, setSheetTab] = useState<SheetTab>("blocks");
  const [sheetOpen, setSheetOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mosOpen, setMosOpen] = useState(false);
  const dragRef = useRef<{
    id: string;
    ox: number;
    oy: number;
    sx: number;
    sy: number;
  } | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setScale(0.62);
    }
  }, []);

  useEffect(() => {
    if (!doc) return;
    if (selectedId && !doc.nodes.some((n) => n.id === selectedId)) {
      setSelectedId(null);
    }
  }, [doc, selectedId]);

  const analysis = useMemo(() => (doc ? analyzeFlow(doc) : null), [doc]);
  const selected = doc?.nodes.find((n) => n.id === selectedId) ?? null;
  const bottleneckIds = analysis?.bottleneck?.ids ?? [];

  const fitView = useCallback(() => {
    if (!doc || !doc.nodes.length || !canvasWrapRef.current) return;
    const el = canvasWrapRef.current;
    const pad = 48;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of doc.nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W);
      maxY = Math.max(maxY, n.y + NODE_H);
    }
    const bw = maxX - minX || NODE_W;
    const bh = maxY - minY || NODE_H;
    const next = Math.min(
      1.4,
      Math.max(0.35, Math.min((el.clientWidth - pad * 2) / bw, (el.clientHeight - pad * 2) / bh)),
    );
    setScale(next);
  }, [doc]);

  const placeBlock = useCallback(
    (type: NodeType, label: string) => {
      if (!doc) return;
      const cx = 80 + Math.random() * 40;
      const cy = 80 + Math.random() * 40 + doc.nodes.length * 8;
      const nid = addNode(id, type, label, cx, cy);
      setSelectedId(nid);
      setSheetTab("props");
      setSheetOpen(true);
    },
    [addNode, doc, id],
  );

  const onDropBlock = useCallback(
    (type: string, label: string, x: number, y: number) => {
      const nid = addNode(id, type as NodeType, label, x, y);
      setSelectedId(nid);
      setSheetTab("props");
    },
    [addNode, id],
  );

  const onNodePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation();
      const node = doc?.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (linkMode) {
        if (!linkSource) {
          setLinkSource(nodeId);
          setSelectedId(nodeId);
        } else {
          toggleLink(id, linkSource, nodeId);
          setLinkSource(null);
          setLinkMode(false);
          setSelectedId(nodeId);
        }
        return;
      }

      setSelectedId(nodeId);
      setSheetTab("props");
      setSheetOpen(true);
      commitHistory(id);
      dragRef.current = {
        id: nodeId,
        ox: node.x,
        oy: node.y,
        sx: e.clientX,
        sy: e.clientY,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const nx = d.ox + (ev.clientX - d.sx) / scale;
        const ny = d.oy + (ev.clientY - d.sy) / scale;
        moveNode(id, d.id, Math.round(nx), Math.round(ny));
      };
      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [commitHistory, doc, id, linkMode, linkSource, moveNode, scale, toggleLink],
  );

  if (!doc) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4">
        <p className="text-muted">Flux introuvable.</p>
        <Button asChild>
          <Link to="/app">Retour à l&apos;atelier</Link>
        </Button>
      </div>
    );
  }

  const sheetTabs: { id: SheetTab; label: string; icon: typeof Plus }[] = [
    { id: "blocks", label: "Blocs", icon: Plus },
    { id: "props", label: "Poste", icon: Settings2 },
    { id: "kpis", label: "KPI", icon: Gauge },
    { id: "yamazumi", label: "Yama", icon: ListOrdered },
    { id: "johnson", label: "Seq", icon: Link2 },
    { id: "settings", label: "Ligne", icon: Settings2 },
  ];

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg">
      <header className="z-20 flex shrink-0 items-center gap-1.5 border-b border-border bg-surface px-2 py-1.5 sm:gap-2 sm:px-3">
        <Link
          to="/app"
          className="inline-flex size-10 items-center justify-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <input
            className="w-full truncate bg-transparent font-display text-base font-bold outline-none focus:text-accent sm:text-lg"
            value={doc.nom}
            onChange={(e) => renameMeta(id, { nom: e.target.value })}
            aria-label="Nom de la ligne"
          />
          <p className="truncate text-[10px] text-muted sm:text-xs">
            {doc.usine}
            {doc.atelier ? ` · ${doc.atelier}` : ""}
          </p>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Button
            size="icon"
            variant={linkMode ? "primary" : "ghost"}
            onClick={() => {
              setLinkMode((v) => !v);
              setLinkSource(null);
            }}
            title="Relier des postes"
          >
            <Link2 className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => undo(id)} title="Annuler">
            <Undo2 className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => redo(id)} title="Rétablir">
            <Redo2 className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setScale((s) => Math.min(1.8, s * 1.12))}
            title="Zoom +"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setScale((s) => Math.max(0.35, s / 1.12))}
            title="Zoom −"
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={fitView} title="Ajuster">
            <Maximize2 className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 md:hidden">
          <Button
            size="icon"
            variant={linkMode ? "primary" : "ghost"}
            onClick={() => {
              setLinkMode((v) => !v);
              setLinkSource(null);
            }}
            aria-label="Relier"
          >
            <Link2 className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => undo(id)} aria-label="Annuler">
            <Undo2 className="size-4" />
          </Button>
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <MoreHorizontal className="size-4" />
            </Button>
            {menuOpen ? (
              <>
                <button
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Fermer"
                />
                <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-md border border-border bg-surface p-1 shadow-xl">
                  <MenuItem
                    onClick={() => {
                      setScale((s) => Math.min(1.8, s * 1.12));
                      setMenuOpen(false);
                    }}
                  >
                    <ZoomIn className="size-4" /> Zoom +
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setScale((s) => Math.max(0.35, s / 1.12));
                      setMenuOpen(false);
                    }}
                  >
                    <ZoomOut className="size-4" /> Zoom −
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      fitView();
                      setMenuOpen(false);
                    }}
                  >
                    <Maximize2 className="size-4" /> Ajuster au flux
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      redo(id);
                      setMenuOpen(false);
                    }}
                  >
                    <Redo2 className="size-4" /> Rétablir
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      void navigate({ to: "/rapport/$id", params: { id } });
                      setMenuOpen(false);
                    }}
                  >
                    <Gauge className="size-4" /> Rapport PDF
                  </MenuItem>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {linkMode ? (
        <div className="shrink-0 border-b border-accent/30 bg-accent/10 px-3 py-1.5 text-center text-xs text-accent">
          {linkSource
            ? "Touchez le poste de destination"
            : "Touchez le poste de départ · pincez pour zoomer"}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div ref={canvasWrapRef} className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <FlowCanvas
            nodes={doc.nodes}
            connections={doc.connections}
            scale={scale}
            onScaleChange={setScale}
            selectedId={selectedId}
            bottleneckIds={bottleneckIds}
            linkMode={linkMode}
            linkSource={linkSource}
            onSelect={(nid) => {
              setSelectedId(nid);
              if (nid) {
                setSheetTab("props");
                setSheetOpen(true);
              }
            }}
            onNodePointerDown={onNodePointerDown}
            onDropBlock={onDropBlock}
          />
          <KpiBar doc={doc} />
        </div>

        <aside className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface md:flex">
          <div className="sticky top-0 z-10 flex gap-1 border-b border-border bg-surface p-2">
            {(["blocks", "props", "kpis", "yamazumi", "johnson", "settings"] as SheetTab[]).map(
              (t) => (
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
                      ? "Poste"
                      : t === "kpis"
                        ? "KPI"
                        : t === "yamazumi"
                          ? "Yama"
                          : t === "johnson"
                            ? "Seq"
                            : "Ligne"}
                </button>
              ),
            )}
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
            />
          </div>
        </aside>
      </div>

      <div className="z-20 flex shrink-0 flex-col border-t border-border bg-surface md:hidden">
        <div className="flex items-center gap-0.5 overflow-x-auto px-1 pt-1 [-webkit-overflow-scrolling:touch]">
          {sheetTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (sheetTab === t.id && sheetOpen) setSheetOpen(false);
                  else {
                    setSheetTab(t.id);
                    setSheetOpen(true);
                  }
                }}
                className={cn(
                  "flex min-w-[56px] flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px]",
                  sheetTab === t.id && sheetOpen ? "bg-accent/15 text-accent" : "text-muted",
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => setSheetOpen((v) => !v)}
            className="flex size-10 shrink-0 items-center justify-center text-muted"
            aria-label={sheetOpen ? "Réduire" : "Agrandir"}
          >
            {sheetOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
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

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm hover:bg-surface-2"
    >
      {children}
    </button>
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
  mobile?: boolean;
}) {
  if (tab === "blocks") {
    return (
      <div className={cn("grid gap-2", mobile ? "grid-cols-2" : "grid-cols-1")}>
        {BLOCKS.map((b) => (
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
      return <p className="text-sm text-muted">Sélectionnez un poste sur le flux.</p>;
    }
    return (
      <div className="space-y-4">
        <PropsForm node={selected} onChange={onPatch} onOpenMos={onOpenMos} />
        <Chrono onApply={onApplyCycle} />
        <Button variant="danger" size="sm" className="w-full" onClick={onRemove}>
          <Trash2 className="size-3.5" />
          Supprimer le poste
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

  if (tab === "yamazumi") {
    const a = analyzeFlow(doc);
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted">Hauteur = cycle utile · ligne pointillée = takt</p>
        <div className="h-40 rounded-md border border-border bg-bg">
          <Yamazumi analysis={a} />
        </div>
      </div>
    );
  }

  if (tab === "johnson") {
    return <JohnsonPanel jobs={doc.johnsonJobs ?? []} onChange={onJohnson} />;
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="text-[11px] uppercase tracking-wider text-muted">Nom</span>
        <input
          className="h-10 w-full rounded-sm border border-border bg-bg px-3"
          value={doc.nom}
          onChange={(e) => onMeta({ nom: e.target.value })}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span className="text-[11px] uppercase tracking-wider text-muted">Usine</span>
          <input
            className="h-10 w-full rounded-sm border border-border bg-bg px-3"
            value={doc.usine}
            onChange={(e) => onMeta({ usine: e.target.value })}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[11px] uppercase tracking-wider text-muted">Atelier</span>
          <input
            className="h-10 w-full rounded-sm border border-border bg-bg px-3"
            value={doc.atelier}
            onChange={(e) => onMeta({ atelier: e.target.value })}
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-[11px] uppercase tracking-wider text-muted">Demande / jour</span>
        <input
          type="number"
          min={1}
          className="h-10 w-full rounded-sm border border-border bg-bg px-3"
          value={doc.settings.demand}
          onChange={(e) => onSettings({ ...doc.settings, demand: Number(e.target.value) })}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span className="text-[11px] uppercase tracking-wider text-muted">Ouverture (min)</span>
          <input
            type="number"
            min={1}
            className="h-10 w-full rounded-sm border border-border bg-bg px-3"
            value={doc.settings.openingTime}
            onChange={(e) => onSettings({ ...doc.settings, openingTime: Number(e.target.value) })}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[11px] uppercase tracking-wider text-muted">Pauses (min)</span>
          <input
            type="number"
            min={0}
            className="h-10 w-full rounded-sm border border-border bg-bg px-3"
            value={doc.settings.plannedBreaks}
            onChange={(e) => onSettings({ ...doc.settings, plannedBreaks: Number(e.target.value) })}
          />
        </label>
      </div>
      <Button asChild variant="secondary" size="sm" className="w-full">
        <Link to="/rapport/$id" params={{ id: doc.id }}>
          Ouvrir le rapport
        </Link>
      </Button>
    </div>
  );
}
