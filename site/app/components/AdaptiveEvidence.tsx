"use client";

import type { CSSProperties, ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

type EvidenceField = { label: string; value: string };

export type AdaptiveEvidenceModel = {
  record_id: string;
  case_id: string | null;
  entity_type: string;
  title: string;
  subtitle: string;
  badge: { label: string; tone: string };
  preview_fields: EvidenceField[];
  drawer_fields: EvidenceField[];
  source_label: string;
  observed_at: string;
  available_at: string;
  truth_label: string;
  boundary: string;
};

type EvidenceClusterModel = {
  title: string;
  groups: Array<{ entity_type: string; label: string; count: number }>;
  action: string;
};

export function AdaptiveEvidencePreview({
  model,
  cluster,
  className = "",
  style,
}: {
  model?: AdaptiveEvidenceModel | null;
  cluster?: EvidenceClusterModel | null;
  className?: string;
  style?: CSSProperties;
}) {
  if (!model && !cluster) return null;
  if (cluster) {
    return (
      <aside
        className={`adaptive-evidence-preview is-cluster ${className}`.trim()}
        data-adaptive-evidence="preview"
        data-evidence-entity="cluster"
        aria-hidden="true"
        style={style}
      >
        <header><strong>{cluster.title}</strong></header>
        <div className="adaptive-evidence-cluster-groups">
          {cluster.groups.map((group) => (
            <span key={group.entity_type} data-evidence-entity={group.entity_type}>
              <b>{group.count}</b> {group.label}
            </span>
          ))}
        </div>
        <small>{cluster.action}</small>
      </aside>
    );
  }
  return (
    <aside
      className={`adaptive-evidence-preview ${className}`.trim()}
      data-adaptive-evidence="preview"
      data-evidence-entity={model!.entity_type}
      aria-hidden="true"
      style={style}
    >
      <header>
        <span className={`adaptive-evidence-badge is-${model!.badge.tone}`}>{model!.badge.label}</span>
        <time>{model!.observed_at}</time>
      </header>
      <strong>{model!.title}</strong>
      <p>{model!.subtitle}</p>
      <dl>
        {model!.preview_fields.map((field) => (
          <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>
        ))}
      </dl>
      <small>{model!.source_label}</small>
    </aside>
  );
}

export function AdaptiveEvidenceDrawer({
  model,
  open,
  onClose,
  title = "Evidence details",
  children,
  footer,
  className = "",
}: {
  model?: AdaptiveEvidenceModel | null;
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={`replay-map-evidence-overlay adaptive-evidence-drawer ${className}`.trim()}
      data-adaptive-evidence="drawer"
      data-evidence-entity={model?.entity_type ?? "none"}
      hidden={!open}
      aria-label={title}
    >
      <div className="adaptive-evidence-handle" aria-hidden="true"><span /></div>
      <header className="replay-map-panel-header">
        <div>
          <h2>{title}</h2>
          <span>{model ? model.source_label : "No record selected"}</span>
        </div>
        <button type="button" data-drawer-affordance="collapse" aria-label="Close evidence details" onClick={onClose}><CaretDown size={19} weight="bold" aria-hidden="true" /></button>
      </header>
      {model ? (
        <div className="adaptive-evidence-record">
          <div className="adaptive-evidence-heading">
            <span className={`adaptive-evidence-badge is-${model.badge.tone}`}>{model.badge.label}</span>
            <span>{model.truth_label}</span>
          </div>
          <h3>{model.title}</h3>
          <p>{model.subtitle}</p>
          <dl className="adaptive-evidence-fields">
            {model.drawer_fields.map((field) => (
              <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>
            ))}
          </dl>
          <p className="adaptive-evidence-boundary">{model.boundary}</p>
        </div>
      ) : <p className="empty-evidence">Select a map record</p>}
      {children}
      {footer}
    </aside>
  );
}
