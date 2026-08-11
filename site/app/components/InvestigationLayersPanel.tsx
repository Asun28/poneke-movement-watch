"use client";

import type { ReactNode } from "react";

export function InvestigationLayersButton({
  open,
  selectedCount,
  totalCount,
  onToggle,
}: {
  open: boolean;
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? "Hide Investigation Layers" : "Show Investigation Layers"}
      onClick={onToggle}
    >Layers <span>{selectedCount}/{totalCount}</span></button>
  );
}

export default function InvestigationLayersPanel({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="replay-layer-overlay" hidden={!open}>
      <aside className="layer-workspace investigation-layers-panel" aria-label="Investigation Layers">
        <header className="layer-workspace-header">
          <h3>Investigation Layers</h3>
          <button type="button" aria-label="Hide Investigation Layers" onClick={onClose}>×</button>
        </header>
        {children}
        <a className="investigation-layers-add" href="/setup">+ Add data source</a>
      </aside>
    </div>
  );
}
