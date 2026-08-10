"use client";

import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import LiveMap from "./LiveMap";

type SourceState = {
  source_id: string;
  name: string;
  role: string;
  connector_mode: string;
  runtime_state: string;
  record_count: number;
  observed_at: string | null;
  received_at: string | null;
  message: string;
  alert_eligible: boolean;
  access?: { status?: string };
  truth?: { demo_data_status?: string };
  provider_envelope?: Record<string, unknown>;
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
  evidence_inbox?: EvidenceInbox;
};

type EvidenceCandidate = {
  id: string;
  title: string;
  severity: string;
  source_id: string;
  observed_at: string | null;
  triage: { priority: string; promotion_reason: string; grouped_before_review: boolean };
  evidence: { supporting: string[]; contradicting: string[]; missing: string[]; context: string[] };
};
type MonitoringGroup = { id: string; label: string; record_count: number; fresh_count: number; source_count: number };
type ContextCard = {
  source_id: string;
  label: string;
  runtime_state: string;
  truth_label: string;
  access_status: string;
  evidence_weight: number;
  summary: string;
};
type EvidenceInbox = {
  raw_observation_count: number;
  review_candidate_count: number;
  suppressed_observation_count: number;
  candidates: EvidenceCandidate[];
  monitoring_groups: MonitoringGroup[];
  context_cards: ContextCard[];
};
type LiveView = "evidence" | "map" | "context";

const LIVE_VIEWS: { id: LiveView; label: string }[] = [
  { id: "evidence", label: "Evidence Inbox" },
  { id: "map", label: "Map" },
  { id: "context", label: "Context" },
];
const CONTEXT_PLACEHOLDERS: ContextCard[] = [
  { source_id: "wcc-event-calendar", label: "City events", runtime_state: "mock", truth_label: "Mock · zero evidence", access_status: "terms review", evidence_weight: 0, summary: "Loading provider-shaped preview…" },
  { source_id: "wellington-airport-flights", label: "Flights in & out", runtime_state: "mock", truth_label: "Mock · zero evidence", access_status: "publisher clearance", evidence_weight: 0, summary: "Loading arrival and departure previews…" },
  { source_id: "centreport-cruise-schedule", label: "Cruise calls", runtime_state: "mock", truth_label: "Mock · zero evidence", access_status: "publisher clearance", evidence_weight: 0, summary: "Loading schedule preview…" },
];

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
  const [activeView, setActiveView] = useState<LiveView>("evidence");

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

  const liveSources = useMemo(() => {
    const sourcePriority = new Map([
      ["gwrc-hilltop", 0], ["geonet-tilde-wlgt", 1], ["metservice-cap", 2], ["geonet-quakes", 3],
    ]);
    return (snapshot?.sources.filter((source) => source.connector_mode === "live") ?? [])
      .toSorted((first, second) => (sourcePriority.get(first.source_id) ?? 20) - (sourcePriority.get(second.source_id) ?? 20));
  }, [snapshot]);
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
  const inbox = snapshot?.evidence_inbox;
  const contextCards = inbox?.context_cards?.length ? inbox.context_cards : CONTEXT_PLACEHOLDERS;

  function showCandidate(candidate: EvidenceCandidate) {
    const observationId = candidate.evidence.supporting[0];
    const observation = snapshot?.observations.find((item) => item.id === observationId);
    if (observation) {
      setSelectedSources((current) => new Set(current).add(observation.source_id));
      setSelectedObservation(observation.id);
    }
    setActiveView("map");
  }

  function handleViewKey(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    const move = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    let nextIndex = move ? (index + move + LIVE_VIEWS.length) % LIVE_VIEWS.length : index;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = LIVE_VIEWS.length - 1;
    if (!move && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = LIVE_VIEWS[nextIndex];
    setActiveView(next.id);
    document.getElementById(`live-view-${next.id}`)?.focus();
  }

  return (
    <section
      className="live-workspace"
      aria-label="Live emergency information workspace"
      aria-busy={loading}
    >
      <div className="live-situation-strip" aria-label="Live source status">
        <div>
          <span>Connected</span>
          <strong>{loading ? "—" : liveCount}</strong>
        </div>
        <div>
          <span>No current records</span>
          <strong>{loading ? "—" : emptyCount}</strong>
          <small>Not all-clear</small>
        </div>
        <div>
          <span>Issues</span>
          <strong>{loading ? "—" : issueCount}</strong>
        </div>
        <div className="live-strip-actions">
          <span>{paused ? "Display paused" : "Auto refresh · 60 s"}</span>
          <strong>{snapshot ? timeLabel(snapshot.generated_at) : "—"}</strong>
          <div>
            <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume display" : "Pause display"}</button>
            <button type="button" onClick={() => void refresh()} disabled={paused || loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="live-view-tabs" role="tablist" aria-label="Live Operations views">
        {LIVE_VIEWS.map((view, index) => (
          <button
            key={view.id}
            id={`live-view-${view.id}`}
            type="button"
            role="tab"
            aria-selected={activeView === view.id}
            aria-controls={`live-panel-${view.id}`}
            tabIndex={activeView === view.id ? 0 : -1}
            onClick={() => setActiveView(view.id)}
            onKeyDown={(event) => handleViewKey(event, index)}
          >{view.label}</button>
        ))}
      </div>

      <section
        id="live-panel-evidence"
        className="live-inbox"
        role="tabpanel"
        aria-labelledby="live-view-evidence"
        hidden={activeView !== "evidence"}
      >
        <header className="live-inbox-header">
          <div><h2>Evidence Inbox</h2><span>Grouped before review</span></div>
          <dl>
            <div><dt>Raw</dt><dd>{inbox?.raw_observation_count ?? "—"}</dd></div>
            <div><dt>Needs review</dt><dd>{inbox?.review_candidate_count ?? "—"}</dd></div>
            <div><dt>Grouped / held</dt><dd>{inbox?.suppressed_observation_count ?? "—"}</dd></div>
          </dl>
        </header>
        <div className="live-inbox-grid">
          <section className="live-review-candidates" aria-labelledby="live-review-heading">
            <header><h3 id="live-review-heading">Review candidates</h3><a href="/alerts">Open Signal Review</a></header>
            {loading && <p className="ops-state is-loading" role="status">Grouping current evidence…</p>}
            {error && <p className="ops-state is-error" role="alert">Evidence snapshot unavailable. Showing last data.</p>}
            {!loading && inbox?.candidates.length === 0 && (
              <div className="live-no-candidates"><strong>No promoted candidates</strong><span>Not an all-clear</span></div>
            )}
            <div className="live-candidate-list">
              {inbox?.candidates.map((candidate) => (
                <button key={candidate.id} type="button" onClick={() => showCandidate(candidate)}>
                  <span><b>{candidate.triage.priority}</b><i>{candidate.severity}</i></span>
                  <strong>{candidate.title}</strong>
                  <small>{candidate.triage.promotion_reason.replaceAll("_", " ")} · {candidate.evidence.supporting.length} supporting</small>
                </button>
              ))}
            </div>
          </section>
          <aside className="live-monitoring" aria-labelledby="live-monitoring-heading">
            <header><h3 id="live-monitoring-heading">Monitoring</h3><span>Source groups</span></header>
            <div className="live-monitoring-list">
              {(inbox?.monitoring_groups ?? [
                { id: "sensors_weather", label: "Weather & natural sensors", record_count: 0, fresh_count: 0, source_count: 0 },
                { id: "official_hazards", label: "Warnings & natural hazards", record_count: 0, fresh_count: 0, source_count: 0 },
                { id: "community_reports", label: "Reports", record_count: 0, fresh_count: 0, source_count: 0 },
                { id: "access_context", label: "Access context", record_count: 0, fresh_count: 0, source_count: 0 },
              ]).map((group) => (
                <div key={group.id} data-monitoring-group={group.id}>
                  <span><strong>{group.label}</strong><small>{group.source_count} sources</small></span>
                  <output>{loading ? "—" : group.fresh_count}<small> fresh</small></output>
                </div>
              ))}
            </div>
            <div className="live-promotion-rule"><strong>Promote</strong><span>Official hazard · natural hazard signal · report + nearby sensor · sensor anomaly</span></div>
            <div className="live-hold-rule"><strong>Hold</strong><span>Road-only · planned activity · mock · stale</span></div>
          </aside>
        </div>
      </section>

      <div
        id="live-panel-map"
        className="live-grid"
        role="tabpanel"
        aria-labelledby="live-view-map"
        hidden={activeView !== "map"}
      >
        <aside className="live-source-rail" aria-label="Live source layers">
          <header>
            <h2>Current feeds</h2>
          </header>
          {loading && <p className="ops-state is-loading" role="status">Loading current feeds…</p>}
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

      <section
        id="live-panel-context"
        className="live-context-view"
        role="tabpanel"
        aria-labelledby="live-view-context"
        hidden={activeView !== "context"}
      >
        <header><h2>City context</h2><span>Never incident evidence by itself</span></header>
        <div className="live-context-grid">
          {contextCards.map((card) => (
            <article key={card.source_id}>
              <header><h3>{card.label}</h3><span>{card.runtime_state.replaceAll("_", " ")}</span></header>
              <p>{card.summary}</p>
              <footer><strong>{card.truth_label}</strong><span>{card.access_status.replaceAll("_", " ")}</span></footer>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
