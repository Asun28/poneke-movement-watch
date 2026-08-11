"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  buildReplayInvestigationUrl,
  mergeReplayInvestigations,
  prepareReplayInvestigationDraft,
} from "../../lib/replayInvestigations.mjs";

type Investigation = {
  id: string;
  case_id: string;
  title: string;
  scope: "packaged" | "local_draft";
  editable: boolean;
  source_id: string;
  primary_source_id?: string;
  supporting_source_ids?: string[];
  starts_at: string;
  as_of: string;
  target_hash: string;
  record_count: number | null;
  data_label: string;
  truth_label: string;
  incident_created: false;
  external_effect: "none";
};

const STORAGE_KEY = "poneke-replay-investigations-v1";

function inputTime(value: string) {
  return value.slice(0, 16);
}

function sourceOffset(value: string) {
  return value.match(/([+-]\d{2}:\d{2})$/)?.[1] ?? "+12:00";
}

function investigationTime(value: string, sourceTemplate: string) {
  return `${value}:00${sourceOffset(sourceTemplate)}`;
}

function sourceName(sourceId: string) {
  if (sourceId === "gwrc-hilltop") return "GWRC Hilltop";
  if (sourceId === "wcc-transport-sensors") return "WCC Transport Sensors";
  return sourceId;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
    hour12: false,
  }).format(new Date(value));
}

export default function ReplayInvestigationSelector({
  catalog,
  activeId,
  onSelect,
}: {
  catalog: Investigation[];
  activeId?: string;
  onSelect?: (investigation: Investigation) => void;
}) {
  const defaultId = catalog.find((item) => item.id === "august-movement-review-2026")?.id ?? catalog[0]?.id ?? "";
  const [investigations, setInvestigations] = useState(catalog);
  const [selectedId, setSelectedId] = useState(activeId ?? defaultId);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceId, setSourceId] = useState(catalog.find((item) => item.id === defaultId)?.source_id ?? catalog[0]?.source_id ?? "");
  const selectedSourceWindow = catalog.find((item) => item.source_id === sourceId) ?? catalog[0];
  const [startsAt, setStartsAt] = useState(inputTime(selectedSourceWindow?.starts_at ?? ""));
  const [asOf, setAsOf] = useState(inputTime(selectedSourceWindow?.as_of ?? ""));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let stored: unknown = [];
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      stored = [];
    }
    const merged = mergeReplayInvestigations(catalog, stored);
    const requestedId = new URLSearchParams(window.location.search).get("investigation");
    window.setTimeout(() => {
      setInvestigations(merged);
      const next = merged.find((item) => item.id === requestedId)
        ?? merged.find((item) => item.id === activeId)
        ?? merged.find((item) => item.id === defaultId)
        ?? merged[0];
      if (next) {
        setSelectedId(next.id);
        onSelect?.(next as Investigation);
        if (requestedId) {
          window.history.replaceState(null, "", workspaceReplayUrl(next));
          window.setTimeout(() => window.scrollTo({ top: 0, behavior: "auto" }), 0);
        }
      }
    }, 0);
  }, [activeId, catalog, defaultId, onSelect]);

  const selected = investigations.find((item) => item.id === selectedId) ?? investigations[0];

  const sourceWindows = useMemo(() => {
    const seen = new Set<string>();
    return catalog.filter((item) => {
      if (seen.has(item.source_id)) return false;
      seen.add(item.source_id);
      return true;
    });
  }, [catalog]);

  function chooseSource(nextSourceId: string) {
    const next = sourceWindows.find((item) => item.source_id === nextSourceId);
    setSourceId(nextSourceId);
    if (next) {
      setStartsAt(inputTime(next.starts_at));
      setAsOf(inputTime(next.as_of));
    }
  }

  function selectInvestigation(nextId: string) {
    const next = investigations.find((item) => item.id === nextId);
    if (!next) return;
    setSelectedId(next.id);
    onSelect?.(next as Investigation);
    window.history.replaceState(null, "", workspaceReplayUrl(next));
    setNotice("Dataset loaded.");
  }

  function createInvestigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sourceWindow = sourceWindows.find((item) => item.source_id === sourceId);
    const result = prepareReplayInvestigationDraft({
      title,
      source_id: sourceId,
      starts_at: investigationTime(startsAt, sourceWindow?.starts_at ?? ""),
      as_of: investigationTime(asOf, sourceWindow?.as_of ?? ""),
    }, sourceWindows, investigations.map((item) => item.id));
    if (!result.ready) {
      setNotice(result.errors.includes("outside_source_window")
        ? "Choose times inside the packaged source window."
        : "Check the title, source and time window.");
      return;
    }
    const next = mergeReplayInvestigations(investigations, [result.investigation]);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.filter((item) => item.scope === "local_draft")));
    } catch {
      setNotice("Draft prepared for this session; browser save failed.");
      return;
    }
    setInvestigations(next);
    setSelectedId(result.investigation.id);
    setNotice("Local investigation created.");
    onSelect?.(result.investigation as Investigation);
    window.history.replaceState(null, "", workspaceReplayUrl(result.investigation as Investigation));
  }

  return (
    <section className={`replay-investigation-selector ${isPanelOpen ? "" : "is-collapsed"}`} aria-label="Replay investigations">
      <header className="replay-investigation-compact-header">
        <div>
          <h2>{selected?.title ?? "Select an investigation"}</h2>
          <span>{selected?.data_label ?? "No case selected"}</span>
        </div>
        <button
          type="button"
          aria-expanded={isPanelOpen}
          aria-label={isPanelOpen ? "Hide investigation settings" : "Show investigation settings"}
          aria-controls="replay-investigation-settings"
          onClick={() => setIsPanelOpen((value) => !value)}
        >{isPanelOpen ? "Done" : "Change"}</button>
      </header>

      <div id="replay-investigation-settings" className="replay-investigation-body" hidden={!isPanelOpen}>
        <div className="replay-investigation-primary">
          <div className="replay-investigation-heading">
            <h2>Case settings</h2>
            <span>{selected?.scope === "local_draft" ? "Local draft" : "Packaged case"}</span>
          </div>
          <label className="replay-investigation-select">
            <span>Investigation</span>
            <select name="investigation" value={selectedId} onChange={(event) => selectInvestigation(event.target.value)}>
              {investigations.map((item) => (
                <option key={item.id} value={item.id}>{item.title} · {item.data_label}</option>
              ))}
            </select>
          </label>
          <div className="replay-investigation-actions">
            <button type="button" aria-expanded={isCreating} aria-controls="new-replay-investigation" onClick={() => { setIsCreating((value) => !value); setNotice(""); }}>New investigation</button>
          </div>
        </div>

        {selected && (
          <dl className="replay-investigation-meta">
            <div><dt>Primary</dt><dd>{sourceName(selected.primary_source_id ?? selected.source_id)}</dd></div>
            {selected.supporting_source_ids?.length ? <div><dt>Support</dt><dd>{selected.supporting_source_ids.map(sourceName).join(", ")}</dd></div> : null}
            <div><dt>Start</dt><dd>{dateLabel(selected.starts_at)}</dd></div>
            <div><dt>Cutoff</dt><dd>{dateLabel(selected.as_of)}</dd></div>
            <div><dt>Status</dt><dd>{selected.scope === "local_draft" ? "Local draft · not Incident/COP" : selected.truth_label}</dd></div>
          </dl>
        )}

        <form id="new-replay-investigation" aria-label="New Replay investigation" hidden={!isCreating} onSubmit={createInvestigation}>
          <label><span>Title</span><input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label><span>Primary source</span><select required value={sourceId} onChange={(event) => chooseSource(event.target.value)}>{sourceWindows.map((item) => <option key={item.source_id} value={item.source_id}>{sourceName(item.source_id)} · {item.data_label}</option>)}</select></label>
          <label><span>Start</span><input required type="datetime-local" value={startsAt} min={inputTime(selectedSourceWindow?.starts_at ?? "")} max={inputTime(selectedSourceWindow?.as_of ?? "")} onChange={(event) => setStartsAt(event.target.value)} /></label>
          <label><span>Replay cutoff</span><input required type="datetime-local" value={asOf} min={inputTime(selectedSourceWindow?.starts_at ?? "")} max={inputTime(selectedSourceWindow?.as_of ?? "")} onChange={(event) => setAsOf(event.target.value)} /></label>
          <div className="replay-investigation-form-actions">
            <span>Local draft · not Incident/COP</span>
            <button type="submit">Create &amp; open</button>
          </div>
          {notice && <p role={notice.startsWith("Local") ? "status" : "alert"}>{notice}</p>}
        </form>
      </div>
    </section>
  );
}

function workspaceReplayUrl(investigation: Investigation) {
  return buildReplayInvestigationUrl(investigation).replace(/#[^#]*$/, "#replay-map");
}
