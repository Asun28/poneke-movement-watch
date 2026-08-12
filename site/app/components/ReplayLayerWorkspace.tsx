"use client";

import { FormEvent, useState } from "react";
import { OPERATIONAL_BASEMAP } from "../../lib/operationalBasemap.mjs";
import { INVESTIGATION_MODULES } from "../../lib/replaySourceWorkspace.mjs";
import {
  filterSourcesByOperationsTarget,
  sourceLayerState,
  sourceSelectionSummary,
} from "../layerModel.mjs";
import SourceIconPicker, {
  SourceIconMode,
  SourceIconPreview,
} from "./SourceIconPicker";
import type { SourceLayer } from "../movementCanvasTypes";

const MODULE_LABELS: Record<string, string> = {
  replay_analyzer: "Replay Analyzer",
  live_operations: "Live Operations",
  alert_centre: "Signal Review",
};
const STATUS_OPTIONS = [
  { value: "registered_only", label: "Registered only" },
  { value: "mock_preview", label: "Mock preview" },
  { value: "real_replay", label: "Historical records" },
];
const ACCESS_OPTIONS = [
  { value: "public_free", label: "Public / free" },
  { value: "key_required", label: "API key" },
  { value: "paid_key_required", label: "Paid API" },
  { value: "permission_required", label: "Permission" },
];

export type InvestigationSourceDraft = {
  id: string;
  name: string;
  endpoint: string;
  demo_data_status: string;
  access_status: string;
  assigned_modules: string[];
  icon_mode: SourceIconMode;
  custom_icon_data_url: string | null;
};

const EMPTY_SOURCE_DRAFT: InvestigationSourceDraft = {
  id: "",
  name: "",
  endpoint: "",
  demo_data_status: "registered_only",
  access_status: "public_free",
  assigned_modules: ["replay_analyzer"],
  icon_mode: "auto",
  custom_icon_data_url: null,
};

type LayerWorkspaceProps = {
  sources: SourceLayer[];
  showBasemap: boolean;
  showCoverage: boolean;
  symbolSize: number;
  selectedSourceIds: Set<string>;
  sourceStorageNotice: string;
  onSetBasemap: (value: boolean) => void;
  onSetCoverage: (value: boolean) => void;
  onSetSymbolSize: (value: number) => void;
  onToggleSource: (sourceId: string) => void;
  onSelectAllSources: () => void;
  onReplayOnly: () => void;
  onClearSources: () => void;
  onSaveSource: (draft: InvestigationSourceDraft) => { ok: boolean; errors: string[] };
};

export default function ReplayLayerWorkspace({
  sources,
  showBasemap,
  showCoverage,
  symbolSize,
  selectedSourceIds,
  sourceStorageNotice,
  onSetBasemap,
  onSetCoverage,
  onSetSymbolSize,
  onToggleSource,
  onSelectAllSources,
  onReplayOnly,
  onClearSources,
  onSaveSource,
}: LayerWorkspaceProps) {
  const [sourceQuery, setSourceQuery] = useState("");
  const [operationsTarget, setOperationsTarget] = useState("replay_analyzer");
  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceDraft, setSourceDraft] = useState<InvestigationSourceDraft>(EMPTY_SOURCE_DRAFT);
  const [sourceFormNotice, setSourceFormNotice] = useState("");
  const summary = sourceSelectionSummary(selectedSourceIds, sources);
  const visibleSources = filterSourcesByOperationsTarget(
    sources,
    operationsTarget,
    sourceQuery,
  ) as SourceLayer[];
  const editingSource = editingSourceId
    ? sources.find((source) => source.id === editingSourceId) ?? null
    : null;
  const canonicalEdit = editingSource && editingSource.record_origin !== "local_draft";

  function startAddSource() {
    setEditingSourceId(null);
    setSourceDraft({ ...EMPTY_SOURCE_DRAFT, assigned_modules: [...EMPTY_SOURCE_DRAFT.assigned_modules] });
    setSourceFormNotice("");
    setSourceFormOpen(true);
  }

  function startEditSource(source: SourceLayer) {
    setEditingSourceId(source.id);
    setSourceDraft({
      id: source.id,
      name: source.name,
      endpoint: source.endpoint ?? "",
      demo_data_status: source.demo_data_status,
      access_status: source.access_status,
      assigned_modules: [...(source.assigned_modules ?? [])],
      icon_mode: source.icon_mode ?? "auto",
      custom_icon_data_url: source.custom_icon_data_url ?? null,
    });
    setSourceFormNotice("");
    setSourceFormOpen(true);
  }

  function cancelSourceForm() {
    setEditingSourceId(null);
    setSourceDraft({ ...EMPTY_SOURCE_DRAFT, assigned_modules: [...EMPTY_SOURCE_DRAFT.assigned_modules] });
    setSourceFormNotice("");
    setSourceFormOpen(false);
  }

  function setSourceField(field: keyof InvestigationSourceDraft, value: string) {
    setSourceDraft((current) => ({ ...current, [field]: value }));
  }

  function setSourceModule(module: string, checked: boolean) {
    setSourceDraft((current) => ({
      ...current,
      assigned_modules: checked
        ? [...new Set([...current.assigned_modules, module])]
        : current.assigned_modules.filter((item) => item !== module),
    }));
  }

  function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSaveSource(sourceDraft);
    if (!result.ok) {
      const field = result.errors[0]?.split(":")[1]?.replaceAll("_", " ") ?? "source";
      setSourceFormNotice(`Check ${field}.`);
      return;
    }
    setSourceFormNotice(editingSourceId ? "Changes saved locally." : "Source added locally.");
    setOperationsTarget(sourceDraft.assigned_modules[0] ?? "all");
    setEditingSourceId(null);
    setSourceDraft({ ...EMPTY_SOURCE_DRAFT, assigned_modules: [...EMPTY_SOURCE_DRAFT.assigned_modules] });
    setSourceFormOpen(false);
  }

  return (
    <>
      <section className="layer-group" aria-labelledby="base-layers-heading">
        <div className="layer-group-heading">
          <h4 id="base-layers-heading">Map layers</h4>
          <span>2 display layers</span>
        </div>
        <label className="core-layer-row" htmlFor="layer-basemap" data-temporal-mode="static-context">
          <input
            id="layer-basemap"
            aria-label="Calm streets basemap"
            type="checkbox"
            checked={showBasemap}
            onChange={(event) => onSetBasemap(event.currentTarget.checked)}
          />
          <span className="sr-only">Calm streets basemap</span>
          <span className="layer-mini-symbol basemap-symbol" aria-hidden="true" />
          <span><strong>{OPERATIONAL_BASEMAP.label}</strong><small>Static context · display only</small></span>
        </label>
        <label className="core-layer-row" htmlFor="layer-coverage" data-temporal-mode="static-context">
          <input
            id="layer-coverage"
            aria-label="Sensor coverage"
            type="checkbox"
            checked={showCoverage}
            onChange={(event) => onSetCoverage(event.currentTarget.checked)}
          />
          <span className="sr-only">Sensor coverage</span>
          <span className="layer-mini-symbol coverage-symbol" aria-hidden="true" />
          <span><strong>Sensor coverage</strong><small>Static context · 414 WCC countlines</small></span>
        </label>
        <label className="symbol-size-control">
          <span><strong>Map symbol size</strong><output>{symbolSize}px</output></span>
          <input
            type="range"
            aria-label="Map symbol size"
            min="7"
            max="16"
            value={symbolSize}
            onChange={(event) => onSetSymbolSize(Number(event.currentTarget.value))}
          />
        </label>
      </section>

      <section className="layer-group source-layer-group" aria-labelledby="source-layers-heading">
        <div className="layer-group-heading">
          <h4 id="source-layers-heading">Investigation sources</h4>
          <span>{sourceStorageNotice}</span>
        </div>
        <div className="replay-temporal-key" aria-label="Replay layer time modes">
          <span data-temporal-mode="time-slot">Current slot</span>
          <span data-temporal-mode="snapshot">Snapshot</span>
          <span data-temporal-mode="static-context">Static context</span>
        </div>
        <details
          className="source-onboarding"
          open={sourceFormOpen}
          onToggle={(event) => setSourceFormOpen(event.currentTarget.open)}
        >
          <summary onClick={() => { if (!sourceFormOpen) startAddSource(); }}>
            <span>{editingSourceId ? "Edit source" : "Add source"}</span>
            <b aria-hidden="true">{sourceFormOpen ? "−" : "+"}</b>
          </summary>
          <form onSubmit={saveSource}>
            <label>
              <span>Source name</span>
              <input
                required
                value={sourceDraft.name}
                onChange={(event) => setSourceField("name", event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Source ID</span>
              <input
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="source-name"
                disabled={Boolean(editingSource)}
                value={sourceDraft.id}
                onChange={(event) => setSourceField("id", event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Endpoint</span>
              <input
                type="url"
                placeholder="https://…"
                disabled={Boolean(canonicalEdit)}
                value={sourceDraft.endpoint}
                onChange={(event) => setSourceField("endpoint", event.currentTarget.value)}
              />
            </label>
            <div className="source-onboarding-pair">
              <label>
                <span>Data status</span>
                <select
                  disabled={Boolean(canonicalEdit)}
                  value={sourceDraft.demo_data_status}
                  onChange={(event) => setSourceField("demo_data_status", event.currentTarget.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option
                      disabled={option.value === "real_replay" && !canonicalEdit}
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Access</span>
                <select
                  disabled={Boolean(canonicalEdit)}
                  value={sourceDraft.access_status}
                  onChange={(event) => setSourceField("access_status", event.currentTarget.value)}
                >
                  {ACCESS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <SourceIconPicker
              mode={sourceDraft.icon_mode}
              customIconDataUrl={sourceDraft.custom_icon_data_url}
              onChange={({ mode, customIconDataUrl }) => {
                setSourceDraft((current) => ({
                  ...current,
                  icon_mode: mode,
                  custom_icon_data_url: customIconDataUrl,
                }));
              }}
            />
            <fieldset>
              <legend>Use in</legend>
              {INVESTIGATION_MODULES.map((module) => (
                <label key={module}>
                  <input
                    type="checkbox"
                    checked={sourceDraft.assigned_modules.includes(module)}
                    onChange={(event) => setSourceModule(module, event.currentTarget.checked)}
                  />
                  <span>{MODULE_LABELS[module]}</span>
                </label>
              ))}
            </fieldset>
            {canonicalEdit ? <small>Registry truth is locked.</small> : null}
            <div className="source-onboarding-actions">
              <button type="submit">{editingSourceId ? "Save changes" : "Add to investigation"}</button>
              {editingSourceId ? (
                <button type="button" onClick={cancelSourceForm}>Cancel</button>
              ) : null}
            </div>
            <output aria-live="polite">{sourceFormNotice}</output>
          </form>
        </details>
        <label className="source-operations-filter">
          <span>Module</span>
          <select
            aria-label="Filter investigation sources by module"
            value={operationsTarget}
            onChange={(event) => setOperationsTarget(event.currentTarget.value)}
          >
            <option value="replay_analyzer">Replay Analyzer</option>
            <option value="live_operations">Live Operations</option>
            <option value="alert_centre">Signal Review</option>
            <option value="all">All sources</option>
          </select>
        </label>
        <label className="source-layer-search">
          <span>Search source layers</span>
          <input
            type="search"
            aria-label="Search source layers"
            value={sourceQuery}
            placeholder="Name or role"
            onChange={(event) => setSourceQuery(event.currentTarget.value)}
          />
        </label>
        <div className="layer-actions" aria-label="Source layer selection actions">
          <button type="button" onClick={onReplayOnly}>Replay source only</button>
          <button type="button" onClick={onSelectAllSources}>Select all</button>
          <button type="button" onClick={onClearSources}>Clear sources</button>
        </div>
        <div className="source-layer-list" aria-label={`${visibleSources.length} investigation sources`}>
          {visibleSources.map((source) => {
            const state = sourceLayerState(source);
            const isSelected = selectedSourceIds.has(source.id);
            return (
              <div
                className={`source-layer-row ${state.playable ? "is-playable" : "is-contract"}`}
                data-source-layer={source.id}
                data-playable={String(state.playable)}
                data-temporal-mode={state.playable ? "time-slot" : "static-context"}
                data-selected={String(isSelected)}
                key={source.id}
              >
                <button
                  className={`source-layer-toggle ${isSelected ? "is-selected" : ""}`}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? "Remove" : "Add"} ${source.name} ${state.playable ? "time layer" : "context reference"}`}
                  onClick={() => onToggleSource(source.id)}
                >
                  <SourceIconPreview
                    mode={source.icon_mode ?? "auto"}
                    customIconDataUrl={source.custom_icon_data_url}
                    size={Math.max(18, symbolSize + 7)}
                  />
                  <span className="source-layer-toggle-mark" aria-hidden="true">
                    {isSelected ? "✓" : "+"}
                  </span>
                </button>
                <span className="source-layer-copy">
                  <strong>{source.name}</strong>
                  <small>{source.role.replaceAll("_", " ")}</small>
                  <span className="source-layer-status">
                    <em>{source.record_origin === "canonical" ? "Registry" : "Local"}</em>
                    {(source.assigned_modules ?? []).map((module) => (
                      <em className={`operations-${module}`} key={module}>{MODULE_LABELS[module]}</em>
                    ))}
                    <em>{state.truth_label}</em>
                    <em>{state.access_label}</em>
                    <em>{state.record_label}</em>
                    <em>{state.year_label}</em>
                  </span>
                </span>
                <button
                  className="source-edit-button"
                  type="button"
                  aria-label={`Edit ${source.name}`}
                  onClick={() => startEditSource(source)}
                >
                  Edit
                </button>
              </div>
            );
          })}
          {visibleSources.length === 0 ? (
            <p className="no-source-match">No source layer matches this search.</p>
          ) : null}
        </div>
        <div className="layer-selection-summary" aria-live="polite">
          <strong>{summary.playable_source_count} playable</strong>
          <span>{summary.selected_count} included</span>
        </div>
      </section>
    </>
  );
}
