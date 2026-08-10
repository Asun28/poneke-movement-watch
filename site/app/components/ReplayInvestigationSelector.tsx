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

export default function ReplayInvestigationSelector({ catalog }: { catalog: Investigation[] }) {
  const defaultId = catalog.find((item) => item.id === "august-movement-review-2026")?.id ?? catalog[0]?.id ?? "";
  const [investigations, setInvestigations] = useState(catalog);
  const [selectedId, setSelectedId] = useState(defaultId);
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
      if (requestedId && merged.some((item) => item.id === requestedId)) setSelectedId(requestedId);
    }, 0);
  }, [catalog]);

  const selected = investigations.find((item) => item.id === selectedId) ?? investigations[0];

  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get("investigation");
    if (!selected || requestedId !== selected.id) return;
    const target = document.getElementById(selected.target_hash);
    if (target instanceof HTMLDetailsElement) target.open = true;
  }, [selected]);

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

  function openSelected() {
    if (selected) window.location.assign(buildReplayInvestigationUrl(selected));
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
    window.location.assign(result.replay_url);
  }

  return (
    <section className="replay-investigation-selector" aria-label="Replay investigations">
      <div className="replay-investigation-primary">
        <div className="replay-investigation-heading">
          <h2>Investigation</h2>
          <span>{selected?.scope === "local_draft" ? "Local draft" : "Packaged case"}</span>
        </div>
        <label className="replay-investigation-select">
          <span>Investigation</span>
          <select name="investigation" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {investigations.map((item) => (
              <option key={item.id} value={item.id}>{item.title} · {item.data_label}</option>
            ))}
          </select>
        </label>
        <div className="replay-investigation-actions">
          <button type="button" className="is-primary" onClick={openSelected}>Open investigation</button>
          <button type="button" aria-expanded={isCreating} aria-controls="new-replay-investigation" onClick={() => { setIsCreating((value) => !value); setNotice(""); }}>New investigation</button>
        </div>
      </div>

      {selected && (
        <dl className="replay-investigation-meta">
          <div><dt>Source</dt><dd>{sourceName(selected.source_id)}</dd></div>
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
    </section>
  );
}
