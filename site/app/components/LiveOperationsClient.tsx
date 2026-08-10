"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LiveMap from "./LiveMap";

type SourceState = {
  source_id: string;
  name: string;
  connector_mode: string;
  runtime_state: string;
  record_count: number;
  observed_at: string | null;
  received_at: string | null;
  message: string;
  alert_eligible: boolean;
};
type Observation = {
  id: string;
  source_id: string;
  kind: string;
  observed_at: string | null;
  received_at: string;
  freshness_state: string;
  evidence_weight: number;
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown>;
};
type Snapshot = {
  schema: string;
  generated_at: string;
  summary: Record<string, number>;
  sources: SourceState[];
  observations: Observation[];
};

function timeLabel(value: string | null) {
  if (!value) return "unknown";
  return new Intl.DateTimeFormat("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
    hour12: false,
  }).format(new Date(value));
}

function observationTitle(observation: Observation) {
  return String(
    observation.properties.headline
      ?? observation.properties.name
      ?? observation.properties.site_id
      ?? observation.properties.locality
      ?? observation.kind.replaceAll("_", " "),
  );
}

export default function LiveOperationsClient() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [selectedObservation, setSelectedObservation] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (paused) return;
    try {
      setError("");
      const response = await fetch("/api/integration/v1/snapshot", { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`Snapshot request failed (${response.status})`);
      const next = await response.json() as Snapshot;
      setSnapshot(next);
      setSelectedSources((current) => current.size
        ? current
        : new Set(next.sources.filter((source) => source.connector_mode === "live").map((source) => source.source_id)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Live snapshot is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [paused]);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  const liveSources = snapshot?.sources.filter((source) => source.connector_mode === "live") ?? [];
  const liveCount = liveSources.filter((source) => source.runtime_state === "live").length;
  const emptyCount = liveSources.filter((source) => source.runtime_state === "empty").length;
  const issueCount = liveSources.filter((source) => ["unavailable", "stale"].includes(source.runtime_state)).length;
  const visibleObservations = useMemo(
    () => snapshot?.observations.filter((observation) => selectedSources.has(observation.source_id)) ?? [],
    [selectedSources, snapshot],
  );
  const selected = visibleObservations.find((observation) => observation.id === selectedObservation) ?? null;
  const selectedSource = selected
    ? snapshot?.sources.find((source) => source.source_id === selected.source_id)
    : null;

  return (
    <section className="live-workspace" aria-label="Live emergency information workspace">
      <div className="live-situation-strip">
        <div>
          <span>Connected</span>
          <strong>{liveCount}</strong>
        </div>
        <div>
          <span>No current records</span>
          <strong>{emptyCount}</strong>
          <small>Not all-clear</small>
        </div>
        <div>
          <span>Issues</span>
          <strong>{issueCount}</strong>
        </div>
        <div className="live-strip-actions">
          <span>{paused ? "Display paused" : "Auto refresh · 60 s"}</span>
          <strong>{snapshot ? timeLabel(snapshot.generated_at) : "—"}</strong>
          <div>
            <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume display" : "Pause display"}</button>
            <button type="button" onClick={() => void refresh()} disabled={paused}>Refresh</button>
            <a
              className="live-backtest-link"
              href="/replay#april-storm-backtest"
              aria-label="Open April Storm backtest"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                <path d="M4.5 8.5A8 8 0 1 1 4 14" />
                <path d="M4.5 3.5v5h5" />
                <path d="M12 7.5v5l3 2" />
              </svg>
              <span>回测</span>
            </a>
          </div>
        </div>
      </div>

      <div className="live-grid">
        <aside className="live-source-rail" aria-label="Live source layers">
          <header>
            <h2>Current feeds</h2>
          </header>
          {loading && <p className="ops-state" role="status">Loading sources…</p>}
          {error && <p className="ops-state is-error" role="alert">Snapshot unavailable. Showing last data.</p>}
          <div className="live-layer-actions">
            <button type="button" onClick={() => setSelectedSources(new Set(liveSources.map((source) => source.source_id)))}>Show all</button>
            <button type="button" onClick={() => setSelectedSources(new Set())}>Hide all</button>
          </div>
          <div className="live-source-list">
            {liveSources.map((source) => (
              <label
                key={source.source_id}
                htmlFor={`live-source-${source.source_id}`}
                aria-label={`${source.name} layer`}
                className={`live-source-row state-${source.runtime_state}`}
              >
                <input
                  id={`live-source-${source.source_id}`}
                  type="checkbox"
                  checked={selectedSources.has(source.source_id)}
                  onChange={(event) => setSelectedSources((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(source.source_id);
                    else next.delete(source.source_id);
                    return next;
                  })}
                />
                <span className="live-source-symbol" aria-hidden="true" />
                <span>
                  <strong>{source.name}</strong>
                  <small>{source.runtime_state.replaceAll("_", " ")} · {source.record_count}</small>
                </span>
              </label>
            ))}
          </div>
        </aside>

        <div className="live-map-column">
          <div className="live-map-heading">
            <div>
              <h2>Wellington map</h2>
            </div>
            <p><strong>{visibleObservations.length}</strong> selected</p>
          </div>
          <LiveMap observations={visibleObservations} selectedId={selectedObservation} onSelect={setSelectedObservation} />
          <ul className="sr-only" aria-label="Keyboard-accessible live observation list">
            {visibleObservations.map((observation) => (
              <li key={observation.id}>
                <button type="button" onClick={() => setSelectedObservation(observation.id)}>
                  {observationTitle(observation)} · {observation.source_id}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="live-inspector" aria-label="Selected live record">
          <h2>Details</h2>
          {selected ? (
            <>
              <span className="truth-chip">Official live record</span>
              <h3>{observationTitle(selected)}</h3>
              <span className="record-kind">{selected.kind.replaceAll("_", " ")}</span>
              <dl>
                <div><dt>Source</dt><dd>{selectedSource?.name ?? selected.source_id}</dd></div>
                <div><dt>Observed</dt><dd>{timeLabel(selected.observed_at)}</dd></div>
                <div><dt>Received</dt><dd>{timeLabel(selected.received_at)}</dd></div>
                <div><dt>Freshness</dt><dd>{selected.freshness_state}</dd></div>
                <div><dt>Evidence weight</dt><dd>{selected.evidence_weight}</dd></div>
              </dl>
              <details className="record-raw">
                <summary>Raw record</summary>
                <pre>{JSON.stringify(selected.properties, null, 2)}</pre>
              </details>
            </>
          ) : (
            <div className="live-inspector-empty">
              <strong>Select a map symbol</strong>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
