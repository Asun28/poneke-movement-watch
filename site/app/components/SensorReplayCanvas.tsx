"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import hilltopPack from "../../public/cop/v4/april-storm-hilltop-observations.json";
import detectorPack from "../../public/cop/v4/april-storm-hydro-detector.json";
import eventPack from "../../public/cop/v4/april-storm-event-pack.json";
import { buildAdaptiveEvidenceModel } from "../../lib/adaptiveEvidence.mjs";
import { buildMovementEvidenceDetail, buildSensorReplayDataset, buildSensorReplayLayerStates, defaultSensorReplayLayers, filterSensorReplayReadings, movementOutcomeSignalsAt, sensorReplayFrame, sensorReplayTimelinePoints, toggleSensorEvidenceFilter, updateVisibleSensorSeries, wellingtonCityWeatherReadings } from "../../lib/replayDataWorkspace.mjs";
import { eventSymbolFor } from "../../lib/liveMapWorkspace.mjs";
import { OPERATIONAL_BASEMAP } from "../../lib/operationalBasemap.mjs";
import { replayIntervalMs } from "../layerModel.mjs";
import { AdaptiveEvidenceDrawer } from "./AdaptiveEvidence";
import EventSymbolBadge from "./EventSymbolBadge";
import LiveMap from "./LiveMap";
import InvestigationLayersPanel, { InvestigationLayersButton } from "./InvestigationLayersPanel";
import ReplayDensityTimeline from "./ReplayDensityTimeline";

type Investigation = {
  id: string;
  title: string;
  source_id: string;
  starts_at: string;
  as_of: string;
  default_target_at?: string;
};
type ReplaySpeed = 0.5 | 1 | 2 | 4;
type SensorFilter = "all" | "rain" | "flow" | "anomaly" | null;
type MapGeometry = { type: string; coordinates: unknown };
type MovementHistoryPoint = { observed_at: string; observed_count: number };
type SignalConfidence = { level: string; history_samples: number; basis: string };
type MovementOutcomeSignal = {
  id: string;
  countline_id: string;
  name: string;
  transport_class: string;
  direction: string;
  observed_count: number;
  expected_count: number;
  change_direction: string;
  robust_z: number;
  observed_at: string;
  history_samples: number;
  matched_history: MovementHistoryPoint[];
  signal_confidence: SignalConfidence;
};
type MovementOutcomePack = {
  slots: Array<{ target_at: string; signals: MovementOutcomeSignal[] }>;
};
type MovementCoverageFeature = {
  geometry: MapGeometry | null;
  properties: { countline_id: string };
};
type MovementCoverage = { features: MovementCoverageFeature[] };

function timelineTick(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));
}

function compactValue(value: number, unit: string) {
  return `${new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 2 }).format(value)} ${unit}`.trim();
}

type MovementEvidenceDetail = ReturnType<typeof buildMovementEvidenceDetail>;

function movementCount(value: number) {
  return new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 1 }).format(value);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));
}

function MovementHistoryChart({ detail }: { detail: MovementEvidenceDetail }) {
  const points = [
    ...detail.history,
    { observed_at: detail.observed_at, observed_count: detail.observed },
  ].filter((point) => point.observed_at);
  const width = 300;
  const height = 112;
  const padding = { left: 28, right: 8, top: 10, bottom: 24 };
  const maxValue = Math.max(detail.expected, ...points.map((point) => point.observed_count), 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (index / Math.max(1, points.length - 1)) * chartWidth;
  const y = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;
  const linePoints = points.map((point, index) => `${x(index)},${y(point.observed_count)}`).join(" ");
  const colour = detail.change_direction === "decrease" ? "#c75845" : "#d78916";

  return (
    <section className="april-movement-history" aria-label="Matched-hour movement history">
      <header>
        <div><strong>Matched-hour history</strong><span>{detail.history_count} prior hours</span></div>
        <div className="april-history-legend"><span><i style={{ background: colour }} />Observed</span><span><i className="baseline" />Expected</span></div>
      </header>
      {detail.history_available ? (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Historical observed counts for ${detail.name}; current ${movementCount(detail.observed)}, expected ${movementCount(detail.expected)}.`}>
            {[0, 0.5, 1].map((step) => <line key={step} x1={padding.left} x2={width - padding.right} y1={padding.top + chartHeight * step} y2={padding.top + chartHeight * step} className="grid" />)}
            <text x="2" y={padding.top + 4}>{movementCount(maxValue)}</text>
            <text x="18" y={padding.top + chartHeight + 3}>0</text>
            <line x1={padding.left} x2={width - padding.right} y1={y(detail.expected)} y2={y(detail.expected)} className="expected" />
            <polyline points={linePoints} fill="none" stroke={colour} className="observed" />
            {points.map((point, index) => <circle key={`${point.observed_at}:${index}`} cx={x(index)} cy={y(point.observed_count)} r={index === points.length - 1 ? 4 : 2.5} fill={index === points.length - 1 ? "#102a33" : colour} />)}
          </svg>
          <div className="april-history-range"><span>{shortDate(points[0].observed_at)}</span><strong>Selected hour</strong><span>{shortDate(points.at(-1)!.observed_at)}</span></div>
        </>
      ) : <p>History unavailable</p>}
    </section>
  );
}

export default function SensorReplayCanvas({ investigation, investigationControl }: { investigation: Investigation; investigationControl?: ReactNode }) {
  const defaultLayers = defaultSensorReplayLayers();
  const dataset = useMemo(
    () => buildSensorReplayDataset(hilltopPack, investigation, detectorPack),
    [investigation],
  );
  const preferredIndex = investigation.default_target_at
    ? dataset.slots.findIndex((time: string) => time >= investigation.default_target_at!)
    : -1;
  const [slotIndex, setSlotIndex] = useState(preferredIndex >= 0 ? preferredIndex : Math.max(0, dataset.slots.length - 1));
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const [playing, setPlaying] = useState(false);
  const [filter, setFilter] = useState<SensorFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [showBasemap, setShowBasemap] = useState(true);
  const [markerScale, setMarkerScale] = useState(1);
  const [showMovementOutcomes, setShowMovementOutcomes] = useState(defaultLayers.movement_outcomes);
  const [showImpactEvidence, setShowImpactEvidence] = useState(defaultLayers.official_impacts);
  const [movementOutcomePack, setMovementOutcomePack] = useState<MovementOutcomePack | null>(null);
  const [movementCoverage, setMovementCoverage] = useState<MovementCoverage | null>(null);
  const [movementLoadState, setMovementLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    defaultLayers.movement_outcomes ? "loading" : "idle",
  );
  const [visibleSeriesIds, setVisibleSeriesIds] = useState<Set<string>>(
    () => new Set(defaultLayers.hilltop_observations
      ? dataset.series.map((series: { id: string }) => series.id)
      : []),
  );
  const frame = useMemo(() => sensorReplayFrame(dataset, slotIndex), [dataset, slotIndex]);
  const replayDates = useMemo(
    () => [...new Set(dataset.slots.map((time: string) => time.slice(0, 10)))],
    [dataset],
  );
  const selectedDate = frame.target_at?.slice(0, 10) ?? replayDates[0] ?? "";
  const dateSlots = dataset.slots.filter((time: string) => time.startsWith(selectedDate));
  const visibleReadings = filterSensorReplayReadings(frame.readings, {
    visibleSeriesIds,
    measurementFilter: filter,
  });
  const weatherReadings = filter === "all"
    ? wellingtonCityWeatherReadings(visibleReadings)
    : visibleReadings;
  const selectedLayerCount = Number(showBasemap)
    + Number(showMovementOutcomes)
    + Number(filter !== null)
    + Number(showImpactEvidence);
  const observations = weatherReadings
    .map((reading: {
      id: string;
      site: string;
      measurement: string;
      unit: string;
      geometry: { type: string; coordinates: unknown } | null;
      observed_at: string;
      available_at: string;
      value: number;
      change: number | null;
      detector_candidate: boolean;
      detector_threshold: number | null;
    }) => ({
      id: reading.id,
      source_id: investigation.source_id,
      kind: reading.detector_candidate
        ? "sensor_anomaly"
        : reading.measurement.toLowerCase().includes("rain") ? "rainfall_measurement" : "river_flow_measurement",
      observed_at: reading.observed_at,
      freshness_state: "historical replay",
      evidence_weight: reading.detector_candidate ? 1 : 2,
      geometry: reading.geometry,
      properties: {
        name: reading.site,
        measurement: reading.measurement,
        value: reading.value,
        unit: reading.unit,
        change: reading.change,
        available_at: reading.available_at,
        detector_candidate: reading.detector_candidate,
        detector_threshold: reading.detector_threshold,
        model: reading.detector_candidate ? "Hydro robust v1 · investigation only" : null,
        map_label: compactValue(reading.value, reading.unit),
      },
    }));
  const movementOutcomeSignals = useMemo(() => {
    if (!showMovementOutcomes || !movementOutcomePack || !frame.target_at) return [];
    return movementOutcomeSignalsAt(movementOutcomePack, frame.target_at);
  }, [frame.target_at, movementOutcomePack, showMovementOutcomes]);
  const movementOutcomeObservations = useMemo(() => {
    if (!movementCoverage) return [];
    const geometryByCountline = new Map<string, MovementCoverageFeature>(
      movementCoverage.features.map((feature) => [String(feature.properties.countline_id), feature]),
    );
    return movementOutcomeSignals.map((signal) => {
      const feature = geometryByCountline.get(String(signal.countline_id));
      return {
        id: `april-outcome:${signal.id}`,
        source_id: "wcc-transport-sensors",
        kind: "movement_outcome",
        observed_at: signal.observed_at,
        freshness_state: "retrospective only",
        evidence_weight: 0,
        geometry: feature?.geometry ?? null,
        properties: {
          name: signal.name,
          transport_class: signal.transport_class,
          direction: signal.direction,
          observed_count: signal.observed_count,
          expected_count: signal.expected_count,
          change_direction: signal.change_direction,
          robust_z: signal.robust_z,
          history_samples: signal.history_samples,
          matched_history: signal.matched_history,
          signal_confidence: signal.signal_confidence,
          model: "Movement seasonal MAD v1",
          availability: "Retrospective only",
        },
      };
    });
  }, [movementCoverage, movementOutcomeSignals]);
  const selectedMovementSignal = movementOutcomeSignals.find((signal) => `april-outcome:${signal.id}` === selectedId) ?? null;
  const selectedMovementDetail = useMemo(
    () => selectedMovementSignal ? buildMovementEvidenceDetail(selectedMovementSignal) : null,
    [selectedMovementSignal],
  );
  const replayObservations = [...observations, ...movementOutcomeObservations];
  const layerStates = buildSensorReplayLayerStates(
    frame,
    movementOutcomeSignals,
    eventPack.ground_truth.length,
  );
  const selectedObservation = replayObservations.find((observation) => observation.id === selectedId) ?? null;
  const selectedEvidence = selectedObservation
    ? buildAdaptiveEvidenceModel(selectedObservation, {
      case_id: investigation.id,
      source_label: selectedObservation.source_id === "wcc-transport-sensors"
        ? "WCC Transport Sensors"
        : "Greater Wellington Hilltop",
      truth_label: selectedObservation.kind === "movement_outcome"
        ? "Retrospective analysis"
        : "Historical replay",
    })
    : null;

  useEffect(() => {
    if (!showMovementOutcomes || movementOutcomePack || movementLoadState !== "loading") return;
    let active = true;
    Promise.all([
      fetch("/cop/v4/april-storm-movement-outcomes.json").then((response) => {
        if (!response.ok) throw new Error("movement outcomes unavailable");
        return response.json() as Promise<MovementOutcomePack>;
      }),
      fetch("/cop/v1/countline-coverage.geojson").then((response) => {
        if (!response.ok) throw new Error("movement coverage unavailable");
        return response.json() as Promise<MovementCoverage>;
      }),
    ]).then(([outcomes, coverage]) => {
      if (!active) return;
      setMovementOutcomePack(outcomes);
      setMovementCoverage(coverage);
      setMovementLoadState("ready");
    }).catch(() => {
      if (active) setMovementLoadState("error");
    });
    return () => { active = false; };
  }, [movementLoadState, movementOutcomePack, showMovementOutcomes]);

  useEffect(() => {
    if (!playing || dataset.slots.length < 2) return;
    const timer = window.setInterval(() => {
      setSlotIndex((current) => {
        if (current >= dataset.slots.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, replayIntervalMs(speed));
    return () => window.clearInterval(timer);
  }, [dataset.slots.length, playing, speed]);

  function toggleMovementOutcomes() {
    if (showMovementOutcomes) {
      setShowMovementOutcomes(false);
      if (selectedId?.startsWith("april-outcome:")) setSelectedId(null);
      return;
    }
    setShowMovementOutcomes(true);
    if (!movementOutcomePack && movementLoadState !== "loading") setMovementLoadState("loading");
  }

  function selectDate(date: string) {
    const index = dataset.slots.findIndex((time: string) => time.startsWith(date));
    if (index >= 0) setSlotIndex(index);
    setPlaying(false);
    setSelectedId(null);
  }

  function selectTime(targetAt: string) {
    const index = dataset.slots.indexOf(targetAt);
    if (index >= 0) setSlotIndex(index);
    setPlaying(false);
    setSelectedId(null);
  }

  const replayTimelinePoints = useMemo(() => sensorReplayTimelinePoints(dataset), [dataset]);

  return (
    <section id="replay-map" className="replay-map-workspace sensor-replay-workspace" data-replay-map-first="true" data-replay-time-policy="playhead-bound" data-replay-dataset="sensor" data-primary-layer="movement-outcomes" data-delta-encoding="signed-centre-bar" data-weather-label-mode="marker" data-movement-icon-adapter="shared" aria-label="April movement impact replay">
      <LiveMap
        observations={replayObservations}
        sources={[
          { source_id: investigation.source_id, name: "Greater Wellington Hilltop" },
          { source_id: "wcc-transport-sensors", name: "WCC Transport Sensors" },
        ]}
        selectedId={selectedId}
        showBasemap={showBasemap}
        markerScale={markerScale}
        onSelect={setSelectedId}
        adaptiveEvidenceContext={{ case_id: investigation.id, truth_label: "Historical replay" }}
      />
      <div className="replay-compact-bar" aria-label="Replay controls" data-replay-command-bar="unified" data-replay-toolbar-layout="two-tier" data-replay-density="compact">
        <div className="replay-playback-header" aria-label="Playback header">
          {investigationControl}
          <div className="replay-compact-inputs">
            <label><span>Date</span><input type="date" aria-label="Replay date" value={selectedDate} min={replayDates[0]} max={replayDates.at(-1)} onChange={(event) => selectDate(event.currentTarget.value)} /></label>
            <label><span>Time</span><select aria-label="Replay time" value={frame.target_at ?? ""} onChange={(event) => selectTime(event.currentTarget.value)}>{dateSlots.map((time: string) => <option key={time} value={time}>{time.slice(11, 16)}</option>)}</select></label>
            <label><span>Speed</span><select aria-label="Replay speed" value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value) as ReplaySpeed)}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>
            <div className="replay-buttons">
              <button type="button" aria-label="Previous replay step" disabled={slotIndex === 0} onClick={() => { setSlotIndex((value) => Math.max(0, value - 1)); setPlaying(false); setSelectedId(null); }}>←</button>
              <button type="button" className="play-button" aria-label={playing ? "Pause replay" : "Play replay"} aria-pressed={playing} onClick={() => { setPlaying((value) => !value); setSelectedId(null); }}>{playing ? "Pause" : "Play"}</button>
              <button type="button" aria-label="Next replay step" disabled={slotIndex >= dataset.slots.length - 1} onClick={() => { setSlotIndex((value) => Math.min(dataset.slots.length - 1, value + 1)); setPlaying(false); setSelectedId(null); }}>→</button>
            </div>
          </div>
          <output className="replay-compact-count" aria-live="polite">{replayObservations.length} at selected time{frame.stale_reading_count ? ` · ${frame.stale_reading_count} stale hidden` : ""}</output>
        </div>
        <ReplayDensityTimeline
          points={replayTimelinePoints}
          currentIndex={slotIndex}
          disabled={dataset.slots.length === 0}
          densityMeasure="new-sensor-observations"
          densityLabel="new observations"
          formatTick={timelineTick}
          onChange={(index) => { setSlotIndex(index); setPlaying(false); setSelectedId(null); }}
        />
        <nav className="replay-filter-subbar replay-compact-actions" aria-label="Replay filters and layers">
          <div className="replay-primary-filters" data-replay-filter-zone="primary">
            <div className="filter-group" aria-label="Replay evidence filters">
              <button type="button" className={showMovementOutcomes ? "active" : ""} aria-pressed={showMovementOutcomes} onClick={toggleMovementOutcomes}>
                Movement
              </button>
              {(["all", "rain", "flow", "anomaly"] as Exclude<SensorFilter, null>[]).map((value) => (
                <button key={value} type="button" className={filter === value ? "active" : ""} aria-pressed={filter === value} onClick={() => { setFilter((current) => toggleSensorEvidenceFilter(current, value) as SensorFilter); setSelectedId(null); }}>
                  {value === "all" ? "Weather" : value === "rain" ? "Rain" : value === "flow" ? "Flow" : "Hydro candidates"}
                </button>
              ))}
            </div>
          </div>
          <div className="replay-primary-actions" data-replay-action-zone="always-visible">
            <InvestigationLayersButton open={layersOpen} selectedCount={selectedLayerCount} totalCount={4} onToggle={() => setLayersOpen((value) => !value)} />
          </div>
        </nav>
      </div>
      <InvestigationLayersPanel open={layersOpen} onClose={() => setLayersOpen(false)}>
        <div className="sensor-investigation-layers">
        <label className="sensor-core-layer"><input type="checkbox" checked={showBasemap} onChange={(event) => setShowBasemap(event.currentTarget.checked)} /><span>{OPERATIONAL_BASEMAP.label}</span></label>
        <div className="sensor-evidence-layer-summary" aria-label="April evidence layers">
          <span className="sensor-layer-role">Primary · city movement</span>
          <button className="sensor-primary-layer" type="button" data-temporal-mode="time-slot" aria-pressed={showMovementOutcomes} onClick={toggleMovementOutcomes}>
            <span>Movement outcomes<small>Current hour</small></span><strong>{movementLoadState === "loading" ? "…" : showMovementOutcomes ? layerStates.movement_outcomes.label : "Off"}</strong>
          </button>
          <span className="sensor-layer-role">Supporting · weather and river</span>
          {dataset.layer_groups.map((group: { id: string; label: string; series_count: number }) => {
            const groupFilter: Exclude<SensorFilter, null> = group.id === "rainfall" ? "rain" : group.id === "river-flow" ? "flow" : "anomaly";
            return (
              <button key={group.id} type="button" data-temporal-mode="snapshot" aria-pressed={filter === groupFilter} onClick={() => { setFilter((current) => toggleSensorEvidenceFilter(current, groupFilter) as SensorFilter); setSelectedId(null); }}>
                <span>{group.label}<small>Snapshot</small></span><strong>{group.id === "rainfall" ? layerStates.rainfall.label : group.id === "river-flow" ? layerStates.river_flow.label : layerStates.detector_candidates.label}</strong>
              </button>
            );
          })}
          <button type="button" data-temporal-mode="static-context" aria-label="Toggle official impact evidence" aria-pressed={showImpactEvidence} onClick={() => setShowImpactEvidence((value) => !value)}>
            <span>Official impacts<small>Static context</small></span><strong>{eventPack.ground_truth.length}</strong>
          </button>
          {frame.stale_reading_count ? <output className="sensor-stale-summary">{layerStates.stale_sensors.label}</output> : null}
        </div>
        {movementLoadState === "error" ? <p className="sensor-layer-error" role="status">Movement layer unavailable</p> : null}
        <section className="sensor-impact-evidence" aria-label="Official impact evidence" hidden={!showImpactEvidence}>
          <header><strong>Official impact evidence</strong><span>{layerStates.official_impacts.label}</span></header>
          <ul>
            {eventPack.ground_truth.map((item) => <li key={item.id}><strong>{item.source}</strong><span>{item.label}</span></li>)}
          </ul>
        </section>
        <label className="sensor-symbol-size"><span>Symbol size <output>{Math.round(markerScale * 100)}%</output></span><input type="range" aria-label="Sensor symbol size" min="0.8" max="1.6" step="0.1" value={markerScale} onChange={(event) => setMarkerScale(Number(event.currentTarget.value))} /></label>
        <div className="sensor-layer-actions"><button type="button" onClick={() => { setVisibleSeriesIds(new Set(dataset.series.map((series: { id: string }) => series.id))); setSelectedId(null); }}>Show all</button><button type="button" onClick={() => { setVisibleSeriesIds(new Set()); setSelectedId(null); }}>Hide all</button></div>
        <div className="sensor-series-list" aria-label={`${dataset.series.length} sensor series`}>
          {dataset.series.map((series: { id: string; site: string; measurement: string; detector_episode_count: number }) => {
            const symbol = eventSymbolFor({ source_id: investigation.source_id, kind: series.measurement, properties: { measurement: series.measurement } });
            return (
              <label key={series.id}>
                <input type="checkbox" checked={visibleSeriesIds.has(series.id)} onChange={(event) => { const checked = event.currentTarget.checked; setVisibleSeriesIds((current) => updateVisibleSensorSeries(current, series.id, checked)); setSelectedId(null); }} />
                <EventSymbolBadge symbolId={symbol.id} decorative />
                <span><strong>{series.site}</strong><small>{series.measurement}{series.detector_episode_count ? ` · ${series.detector_episode_count} candidates` : ""}</small></span>
              </label>
            );
          })}
        </div>
        </div>
      </InvestigationLayersPanel>
      <AdaptiveEvidenceDrawer
        model={selectedEvidence}
        open={Boolean(selectedEvidence)}
        onClose={() => setSelectedId(null)}
        title={selectedEvidence?.entity_type === "movement" ? "Selected April movement evidence" : "Selected April sensor evidence"}
        className="april-movement-evidence"
      >
        <span className="sr-only">Retrospective analysis; not event-time evidence.</span>
        {selectedMovementDetail ? <MovementHistoryChart detail={selectedMovementDetail} /> : null}
      </AdaptiveEvidenceDrawer>
      <span className="sr-only">Only observations available by the selected replay time are shown.</span>
    </section>
  );
}
