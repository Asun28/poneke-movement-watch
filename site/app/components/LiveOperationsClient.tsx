"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  Buildings,
  ClockCounterClockwise,
  Flask,
  FunnelSimple,
  MagnifyingGlass,
  Pause,
  Play,
  Pulse,
  SkipBack,
  SkipForward,
  Stack,
  Tray,
  X,
} from "@phosphor-icons/react";
import { buildLiveMapCard, filterLiveMapObservations, LIVE_MAP_LAYERS, toggleLiveMapPanel } from "../../lib/liveMapWorkspace.mjs";
import { buildStormFloodSimulation, compareSimulationToSavedInvestigation, simulationFrameAt } from "../../lib/liveSimulation.mjs";
import EventSymbolBadge from "./EventSymbolBadge";
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
type Snapshot = {
  schema: string;
  generated_at: string;
  summary: Record<string, number>;
  sources: SourceState[];
  observations: Observation[];
  evidence_inbox?: EvidenceInbox;
};

const CONTEXT_PLACEHOLDERS: ContextCard[] = [
  { source_id: "wcc-event-calendar", label: "City events", runtime_state: "mock", truth_label: "Mock · zero evidence", access_status: "terms review", evidence_weight: 0, summary: "Loading provider-shaped preview…" },
  { source_id: "wellington-airport-flights", label: "Flights in & out", runtime_state: "mock", truth_label: "Mock · zero evidence", access_status: "publisher clearance", evidence_weight: 0, summary: "Loading arrival and departure previews…" },
  { source_id: "centreport-cruise-schedule", label: "Cruise calls", runtime_state: "mock", truth_label: "Mock · zero evidence", access_status: "publisher clearance", evidence_weight: 0, summary: "Loading schedule preview…" },
];
const FALLBACK_MONITORING: MonitoringGroup[] = [
  { id: "sensors_weather", label: "Weather & natural sensors", record_count: 0, fresh_count: 0, source_count: 0 },
  { id: "official_hazards", label: "Warnings & natural hazards", record_count: 0, fresh_count: 0, source_count: 0 },
  { id: "community_reports", label: "Reports", record_count: 0, fresh_count: 0, source_count: 0 },
  { id: "access_context", label: "Access context", record_count: 0, fresh_count: 0, source_count: 0 },
];
const LIVE_LAYER_SYMBOLS: Record<string, string> = {
  "review-evidence": "report",
  "sensors-weather": "rain",
  "warnings-hazards": "warning",
  "access-impacts": "road",
  reports: "report",
  "other-live": "other",
};
const CONTEXT_SYMBOLS: Record<string, string> = {
  "wcc-event-calendar": "city-event",
  "wellington-airport-flights": "flight",
  "centreport-cruise-schedule": "cruise",
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

function CloseIcon() {
  return <X aria-hidden="true" size={18} weight="regular" />;
}

type LiveMapPanel = "filters" | "inbox" | "layers" | "context" | null;
type LiveTimeMode = "live" | "history" | "simulation";

export default function LiveOperationsClient() {
  const sourceSelectionInitialized = useRef(false);
  const detailRef = useRef<HTMLDialogElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [selectedObservation, setSelectedObservation] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(LIVE_MAP_LAYERS.map(({ id }) => id)));
  const [activePanel, setActivePanel] = useState<LiveMapPanel>(null);
  const [query, setQuery] = useState("");
  const [timeMode, setTimeMode] = useState<LiveTimeMode>("live");
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simulationPlaying, setSimulationPlaying] = useState(false);
  const [simulationSourceEnabled, setSimulationSourceEnabled] = useState(true);
  const scenario = useMemo(() => buildStormFloodSimulation(), []);
  const simulationFrame = useMemo(() => simulationFrameAt(scenario, simulationIndex), [scenario, simulationIndex]);
  const simulationMatch = useMemo(() => compareSimulationToSavedInvestigation(simulationFrame), [simulationFrame]);

  const refresh = useCallback(async () => {
    if (paused) return;
    try {
      setError("");
      const response = await fetch("/api/integration/v1/snapshot", { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`Snapshot request failed (${response.status})`);
      const next = await response.json() as Snapshot;
      setSnapshot(next);
      if (!sourceSelectionInitialized.current) {
        sourceSelectionInitialized.current = true;
        setSelectedSources(new Set(next.sources.filter((source) => source.connector_mode === "live").map((source) => source.source_id)));
      }
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

  useEffect(() => {
    if (timeMode !== "simulation" || !simulationPlaying) return;
    const timer = window.setInterval(() => {
      setSimulationIndex((current) => {
        if (current >= scenario.frames.length - 1) {
          setSimulationPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1_200);
    return () => window.clearInterval(timer);
  }, [scenario.frames.length, simulationPlaying, timeMode]);

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
  const inbox = snapshot?.evidence_inbox;
  const candidateCount = inbox?.candidates.length ?? null;
  const candidateStatus = loading || candidateCount === null
    ? "Checking review queue…"
    : candidateCount === 0
      ? "0 candidates to review · monitoring continues"
      : `${candidateCount} candidate${candidateCount === 1 ? "" : "s"} to review`;
  const inboxSummary = loading || !inbox
    ? "Review — · Held —"
    : `Review ${inbox.review_candidate_count} · Held ${inbox.suppressed_observation_count}`;
  const candidateEvidenceIds = useMemo(
    () => new Set(inbox?.candidates.flatMap((candidate) => candidate.evidence.supporting) ?? []),
    [inbox],
  );
  const mapSources = useMemo<SourceState[]>(() => {
    if (timeMode === "simulation") return [{ ...scenario.source, record_count: simulationFrame.observations.length } as SourceState];
    if (timeMode === "history") return [];
    return snapshot?.sources ?? [];
  }, [scenario.source, simulationFrame.observations.length, snapshot, timeMode]);
  const mapObservations = useMemo<Observation[]>(() => {
    if (timeMode === "simulation") return simulationFrame.observations as Observation[];
    if (timeMode === "history") return [];
    return snapshot?.observations ?? [];
  }, [simulationFrame.observations, snapshot, timeMode]);
  const effectiveSourceSelection = useMemo(
    () => timeMode === "simulation" ? new Set(simulationSourceEnabled ? [scenario.source.source_id] : []) : selectedSources,
    [scenario.source.source_id, selectedSources, simulationSourceEnabled, timeMode],
  );
  const effectiveCandidateEvidenceIds = useMemo(
    () => timeMode === "live" ? candidateEvidenceIds : new Set<string>(),
    [candidateEvidenceIds, timeMode],
  );
  const visibleObservations = useMemo(() => filterLiveMapObservations({
    observations: mapObservations,
    sources: mapSources,
    selectedSourceIds: effectiveSourceSelection,
    activeLayerIds: activeLayers,
    candidateEvidenceIds: effectiveCandidateEvidenceIds,
    query,
  }) as Observation[], [activeLayers, effectiveCandidateEvidenceIds, effectiveSourceSelection, mapObservations, mapSources, query]);
  const selected = visibleObservations.find((observation) => observation.id === selectedObservation) ?? null;
  const selectedSource = selected ? mapSources.find((source) => source.source_id === selected.source_id) : null;
  const selectedCard = selected ? buildLiveMapCard(selected, selectedSource) : null;
  const simulationSelected = selected?.properties.demo_data_status === "mock_simulation";
  const layerSources = timeMode === "simulation" ? mapSources : liveSources;
  const contextCards = inbox?.context_cards?.length ? inbox.context_cards : CONTEXT_PLACEHOLDERS;
  const filtersOpen = activePanel === "filters";
  const inboxOpen = activePanel === "inbox";
  const layersOpen = activePanel === "layers";
  const contextOpen = activePanel === "context";

  useEffect(() => {
    if (selected?.id) detailRef.current?.focus();
  }, [selected?.id]);

  function changeTimeMode(nextMode: LiveTimeMode) {
    setTimeMode(nextMode);
    setSimulationPlaying(false);
    if (nextMode === "simulation") setSimulationSourceEnabled(true);
    setSelectedObservation(null);
    setActivePanel(null);
    setQuery("");
  }

  function togglePanel(panel: Exclude<LiveMapPanel, null>) {
    setSelectedObservation(null);
    setQuery("");
    setActivePanel((current) => toggleLiveMapPanel(current, panel) as LiveMapPanel);
  }

  function selectObservation(observationId: string) {
    setActivePanel(null);
    setQuery("");
    setSelectedObservation(observationId);
  }

  function closeSelectedObservation() {
    setSelectedObservation(null);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[aria-label="Interactive evidence map"]')?.focus();
    });
  }

  function showCandidate(candidate: EvidenceCandidate) {
    const observationId = candidate.evidence.supporting[0];
    const observation = snapshot?.observations.find((item) => item.id === observationId);
    if (!observation) return;
    setSelectedSources((current) => new Set(current).add(observation.source_id));
    setActiveLayers((current) => new Set(current).add("review-evidence"));
    selectObservation(observation.id);
  }

  function toggleLayer(layerId: string) {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }

  return (
    <section className="live-workspace live-map-first" aria-label="Live emergency information workspace" aria-busy={loading}>
      <div className="live-command-deck" data-live-command-deck="grouped">
      <div className="live-situation-strip" aria-label="Live operational status">
        <section className="live-state-group live-source-health" data-live-state-group="source-health" aria-label="Source health">
          <span className="live-state-group-label">Source health</span>
          <div data-live-metric="connected"><span>Connected</span><strong>{loading ? "—" : liveCount}</strong></div>
          <div data-live-metric="empty"><span>Empty</span><strong>{loading ? "—" : emptyCount}</strong></div>
          <div data-live-metric="issues"><span>Issues</span><strong>{loading ? "—" : issueCount}</strong></div>
        </section>
        <section className="live-state-group live-operational-review" data-live-state-group="operational-review" aria-label="Operational review">
          <span className="live-state-group-label">Operational review</span>
          <span className="live-inbox-truth">{candidateStatus}</span>
          <span className="sr-only">Monitoring continues while the review queue updates.</span>
        </section>
        <div className="live-strip-actions">
          <span className="sr-only">{paused ? "Display paused." : "Auto refresh every 60 seconds."}</span>
          <span className="live-refresh-state" aria-hidden="true">{paused ? "Paused" : "Auto · 60s"}</span>
          <div>
            <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
            <button type="button" onClick={() => void refresh()} disabled={paused || loading}>{loading ? "Refreshing…" : "Refresh"}</button>
          </div>
        </div>
      </div>

      <nav className="live-time-modes" aria-label="Live Operations time modes">
        <button type="button" data-live-time-mode="live" aria-pressed={timeMode === "live"} onClick={() => changeTimeMode("live")}>
          <Pulse aria-hidden="true" size={18} weight="regular" />Live
        </button>
        <button type="button" data-live-time-mode="history" aria-pressed={timeMode === "history"} onClick={() => changeTimeMode("history")}>
          <ClockCounterClockwise aria-hidden="true" size={18} weight="regular" />History
        </button>
        <button type="button" data-live-time-mode="simulation" aria-pressed={timeMode === "simulation"} onClick={() => changeTimeMode("simulation")}>
          <span data-simulation-icon="flask"><Flask aria-hidden="true" size={18} weight="regular" /></span>Simulation
        </button>
      </nav>

      <section className="live-history-dock" hidden={timeMode !== "history"} aria-label="Saved investigation history">
        <div>
          <ClockCounterClockwise aria-hidden="true" size={20} weight="regular" />
          <span><strong>Saved investigations</strong><small>Historical records open in Replay with their original time boundary.</small></span>
        </div>
        <a href={simulationMatch.reference.replay_url}>Open April Storm 2026</a>
      </section>

      <section className="live-simulation-dock" data-density="compact" hidden={timeMode !== "simulation"} aria-label="Storm and flood simulation controls">
        <div className="live-simulation-heading">
          <span data-simulation-icon="flask"><Flask aria-hidden="true" size={20} weight="regular" /></span>
          <span><strong>Storm & flood exercise</strong><small>Mock scenario · weight 0 · no alert · no training</small></span>
          <output aria-live="polite">T+{simulationFrame.elapsed_minutes} min · {simulationFrame.label}</output>
        </div>
        <div className="live-simulation-controls">
          <button type="button" aria-label="Previous simulation step" disabled={simulationIndex === 0} onClick={() => { setSimulationPlaying(false); setSimulationIndex((current) => Math.max(0, current - 1)); }}><SkipBack aria-hidden="true" size={18} weight="regular" /></button>
          <button type="button" aria-label={simulationPlaying ? "Pause simulation" : "Play simulation"} onClick={() => { if (simulationIndex >= scenario.frames.length - 1) setSimulationIndex(0); setSimulationPlaying((value) => !value); }}>
            {simulationPlaying ? <Pause aria-hidden="true" size={18} weight="fill" /> : <Play aria-hidden="true" size={18} weight="fill" />}
          </button>
          <button type="button" aria-label="Next simulation step" disabled={simulationIndex === scenario.frames.length - 1} onClick={() => { setSimulationPlaying(false); setSimulationIndex((current) => Math.min(scenario.frames.length - 1, current + 1)); }}><SkipForward aria-hidden="true" size={18} weight="regular" /></button>
          <button type="button" aria-label="Reset simulation" onClick={() => { setSimulationPlaying(false); setSimulationIndex(0); }}><ArrowCounterClockwise aria-hidden="true" size={18} weight="regular" /></button>
          <label><span className="sr-only">Simulation timeline</span><input aria-label="Simulation timeline" type="range" min="0" max={scenario.frames.length - 1} step="1" value={simulationIndex} onChange={(event) => { setSimulationPlaying(false); setSimulationIndex(Number(event.currentTarget.value)); }} /></label>
        </div>
        <dl className="live-simulation-metrics">
          <div><dt>Rain</dt><dd>{simulationFrame.metrics.rainfall_mm_h} mm/h</dd></div>
          <div><dt>Vehicles</dt><dd>{simulationFrame.metrics.vehicle_change_pct}%</dd></div>
          <div><dt>People</dt><dd>{simulationFrame.metrics.pedestrian_change_pct}%</dd></div>
          <div><dt>Transit</dt><dd>+{simulationFrame.metrics.transit_delay_min} min</dd></div>
          <div><dt>Reports</dt><dd>{simulationFrame.metrics.report_count}</dd></div>
        </dl>
        <aside className="live-simulation-match" aria-label="Saved investigation comparison">
          <span><strong>{simulationMatch.reference.title}</strong><small>Pattern similarity only · {simulationMatch.coverage.available}/{simulationMatch.coverage.total} comparable signals</small></span>
          <output>{simulationMatch.score}%</output>
          <a href={simulationMatch.reference.replay_url}>Open saved investigation</a>
        </aside>
      </section>
      </div>

      <section className={`live-map-workspace${selected || inboxOpen || layersOpen || contextOpen ? " has-mobile-sheet" : ""}`} aria-label="Unified Live map workspace" data-live-map-first="true">
        <LiveMap
          observations={visibleObservations}
          sources={mapSources}
          selectedId={selectedObservation}
          highlightedIds={timeMode === "live" && activeLayers.has("review-evidence") ? candidateEvidenceIds : undefined}
          onSelect={selectObservation}
        />

        <div className="live-map-search">
          <label htmlFor="live-evidence-search" className="sr-only">{timeMode === "simulation" ? "Search simulated evidence" : "Search current evidence"}</label>
          <MagnifyingGlass aria-hidden="true" size={19} weight="regular" />
          <input id="live-evidence-search" type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder={timeMode === "simulation" ? "Search simulated evidence" : "Search current evidence"} />
          <output className="live-map-search-count" aria-live="polite">{timeMode === "live" && loading ? "…" : visibleObservations.length}</output>
          <button
            className="live-mobile-filter-toggle"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="live-map-overlay-filters"
            aria-label={filtersOpen ? "Hide map filters" : "Show map filters"}
            onClick={() => togglePanel("filters")}
          ><FunnelSimple aria-hidden="true" size={20} weight="regular" /></button>
          <button
            className="live-mobile-inbox-toggle"
            hidden={timeMode !== "live"}
            type="button"
            aria-expanded={inboxOpen}
            aria-controls="live-evidence-inbox"
            aria-label={inboxOpen ? "Hide Evidence Inbox" : "Show Evidence Inbox"}
            onClick={() => togglePanel("inbox")}
          ><Tray aria-hidden="true" size={20} weight="regular" /><b aria-label={inboxSummary}>{inbox ? `${inbox.review_candidate_count}·${inbox.suppressed_observation_count}` : "…"}</b></button>
        </div>
        {query.trim() && (
          <div className="live-map-search-results" aria-label="Live search results">
            {timeMode === "live" && loading ? <p role="status">Searching current feeds…</p> : null}
            {timeMode === "live" && !loading && error ? <p role="alert">Current feeds unavailable.</p> : null}
            {(timeMode !== "live" || !loading) && !error && visibleObservations.length === 0 ? <p>No matches in selected layers.</p> : null}
            {visibleObservations.slice(0, 7).map((observation) => {
              const source = mapSources.find((item) => item.source_id === observation.source_id);
              const card = buildLiveMapCard(observation, source);
              return (
                <button key={observation.id} type="button" onClick={() => selectObservation(observation.id)}>
                  <span><strong>{card.title}</strong><small>{card.source}</small></span>
                  <b>{card.value}</b>
                </button>
              );
            })}
          </div>
        )}

        <nav id="live-map-overlay-filters" className={`live-map-overlay-bar${filtersOpen ? " is-mobile-open" : ""}`} aria-label="Live map overlays" data-live-filter-layout="wrapped">
          {LIVE_MAP_LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`live-map-layer-filter${activeLayers.has(layer.id) ? " is-active" : ""}`}
              aria-pressed={activeLayers.has(layer.id)}
              data-filter-state={activeLayers.has(layer.id) ? "selected" : "available"}
              data-live-layer-toggle={layer.id}
              aria-label={`Toggle ${layer.label} layer`}
              title={layer.label}
              onClick={() => toggleLayer(layer.id)}
            ><EventSymbolBadge symbolId={LIVE_LAYER_SYMBOLS[layer.id]} decorative />{layer.compact_label}</button>
          ))}
        </nav>

        <div className="live-map-tools" role="toolbar" aria-label="Map tools">
          <button data-map-tool="evidence" type="button" hidden={timeMode !== "live"} aria-expanded={inboxOpen} aria-controls="live-evidence-inbox" aria-label={inboxOpen ? "Hide Evidence Inbox" : "Show Evidence Inbox"} title="Evidence Inbox" onClick={() => togglePanel("inbox")}>
            <Tray aria-hidden="true" size={20} weight="regular" />{(inbox?.review_candidate_count ?? 0) > 0 ? <span>{inbox?.review_candidate_count}</span> : null}
          </button>
          <button data-map-tool="layers" type="button" aria-expanded={layersOpen} aria-controls="live-map-layers" aria-label={layersOpen ? "Hide map layers" : "Show map layers"} title="Layers" onClick={() => togglePanel("layers")}><Stack aria-hidden="true" size={20} weight="regular" /></button>
          <button data-map-tool="context" type="button" hidden={timeMode !== "live"} aria-expanded={contextOpen} aria-controls="live-map-context" aria-label={contextOpen ? "Hide city context" : "Show city context"} title="City context" onClick={() => togglePanel("context")}><Buildings aria-hidden="true" size={20} weight="regular" /></button>
        </div>

        <aside id="live-evidence-inbox" className="live-map-inbox-overlay" aria-label="Evidence Inbox overlay" hidden={!inboxOpen}>
          <header>
            <div><h2>Evidence Inbox</h2><span data-inbox-summary="review-held">{inboxSummary}</span></div>
            <button type="button" aria-label="Hide Evidence Inbox" onClick={() => setActivePanel(null)}><CloseIcon /></button>
          </header>
          {inboxOpen && (
            <div className="live-map-inbox-body">
              <dl className="live-map-inbox-counts">
                <div><dt>Raw</dt><dd>{inbox?.raw_observation_count ?? "—"}</dd></div>
                <div><dt>Review</dt><dd>{inbox?.review_candidate_count ?? "—"}</dd></div>
                <div><dt>Held</dt><dd>{inbox?.suppressed_observation_count ?? "—"}</dd></div>
              </dl>
              {loading && <p className="ops-state is-loading" role="status">Checking evidence…</p>}
              {error && <p className="ops-state is-error" role="alert">Snapshot unavailable. Showing last data.</p>}
              {!loading && inbox?.candidates.length === 0 && <div className="live-no-candidates"><strong>0 candidates to review</strong><span>Monitoring continues</span></div>}
              <div className="live-candidate-list">
                {inbox?.candidates.map((candidate) => (
                  <button key={candidate.id} type="button" onClick={() => showCandidate(candidate)}>
                    <span><b>{candidate.triage.priority}</b><i>{candidate.severity}</i></span>
                    <strong>{candidate.title}</strong>
                    <small>{candidate.evidence.supporting.length} supporting · {candidate.triage.promotion_reason.replaceAll("_", " ")}</small>
                  </button>
                ))}
              </div>
              <details className="live-monitoring-compact">
                <summary>Monitoring groups</summary>
                {(inbox?.monitoring_groups ?? FALLBACK_MONITORING).map((group) => (
                  <div key={group.id}><span>{group.label}</span><output>{group.fresh_count} fresh</output></div>
                ))}
              </details>
              <a className="live-review-link" href="/alerts">Open Signal Review</a>
            </div>
          )}
        </aside>

        <aside id="live-map-layers" className="live-map-layers-overlay" aria-label="Live map layers" hidden={!layersOpen}>
          <header><h2>Layers</h2><button type="button" aria-label="Close layers" onClick={() => setActivePanel(null)}><CloseIcon /></button></header>
          {timeMode === "live" && loading && <p className="ops-state is-loading" role="status">Loading current feeds…</p>}
          <div className="live-layer-actions">
            <button type="button" onClick={() => setActiveLayers(new Set(LIVE_MAP_LAYERS.map(({ id }) => id)))}>Show all</button>
            <button type="button" onClick={() => setActiveLayers(new Set())}>Hide all</button>
          </div>
          <div className="live-domain-layer-list">
            {LIVE_MAP_LAYERS.map((layer) => (
              <label key={layer.id}><input type="checkbox" checked={activeLayers.has(layer.id)} onChange={() => toggleLayer(layer.id)} /><EventSymbolBadge symbolId={LIVE_LAYER_SYMBOLS[layer.id]} decorative /><span>{layer.label}</span></label>
            ))}
          </div>
          <details>
            <summary>{timeMode === "simulation" ? "Simulation source" : "Current feeds"}</summary>
            <div className="live-layer-actions">
              <button type="button" onClick={() => timeMode === "simulation" ? setSimulationSourceEnabled(true) : setSelectedSources(new Set(layerSources.map((source) => source.source_id)))}>Show all</button>
              <button type="button" onClick={() => timeMode === "simulation" ? setSimulationSourceEnabled(false) : setSelectedSources(new Set())}>Hide all</button>
            </div>
            <div className="live-source-list">
              {layerSources.map((source) => (
                <label key={source.source_id} htmlFor={`live-source-${source.source_id}`} aria-label={`${source.name} layer`} className={`live-source-row state-${source.runtime_state}`}>
                  <input id={`live-source-${source.source_id}`} type="checkbox" checked={timeMode === "simulation" ? simulationSourceEnabled : selectedSources.has(source.source_id)} onChange={(event) => {
                    if (timeMode === "simulation") {
                      setSimulationSourceEnabled(event.target.checked);
                      return;
                    }
                    setSelectedSources((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.add(source.source_id); else next.delete(source.source_id);
                      return next;
                    });
                  }} />
                  <span><strong>{source.name}</strong><small>{source.runtime_state.replaceAll("_", " ")} · {source.record_count}</small></span>
                </label>
              ))}
            </div>
          </details>
        </aside>

        <aside id="live-map-context" className="live-map-context-overlay" aria-label="City context overlay" hidden={!contextOpen}>
          <header><h2>City context</h2><button type="button" aria-label="Close city context" onClick={() => setActivePanel(null)}><CloseIcon /></button></header>
          {contextCards.map((card) => (
            <article key={card.source_id}>
              <div><h3><EventSymbolBadge symbolId={CONTEXT_SYMBOLS[card.source_id] ?? "other"} decorative />{card.label}</h3><span>{card.runtime_state.replaceAll("_", " ")}</span></div>
              <p>{card.summary}</p>
              <footer><strong>{card.truth_label}</strong><span>{card.access_status.replaceAll("_", " ")}</span></footer>
            </article>
          ))}
        </aside>

        {selected && selectedCard && (
          <dialog open ref={detailRef} tabIndex={-1} className="live-map-detail-overlay" aria-modal="false" aria-label="Selected evidence details" aria-live="polite" data-mobile-surface="bottom-sheet" data-escape-returns-map="true" onKeyDown={(event) => { if (event.key === "Escape") closeSelectedObservation(); }}>
            <header><div className="live-map-detail-status"><span className="truth-chip">{simulationSelected ? "Mock simulation · weight 0" : "Official live record"}</span><strong className={`state-${selectedCard.state.toLowerCase().replaceAll(" ", "-")}`}>{selectedCard.state}</strong></div><button type="button" aria-label="Close selected evidence" onClick={closeSelectedObservation}><CloseIcon /></button></header>
            <h2>{selectedCard.title}</h2>
            <dl>
              <div><dt>Value</dt><dd>{selectedCard.value}</dd></div>
              <div><dt>Observed</dt><dd>{timeLabel(selectedCard.observed_at)}</dd></div>
              <div><dt>Source</dt><dd>{selectedCard.source}</dd></div>
              <div><dt>Evidence</dt><dd>{selectedCard.evidence}</dd></div>
            </dl>
            <details className="record-raw"><summary>Raw record</summary><pre>{JSON.stringify(selected.properties, null, 2)}</pre></details>
            <a href={simulationSelected ? simulationMatch.reference.replay_url : "/alerts"}>{simulationSelected ? "Open saved investigation" : "Open Signal Review"}</a>
          </dialog>
        )}

      </section>
    </section>
  );
}
