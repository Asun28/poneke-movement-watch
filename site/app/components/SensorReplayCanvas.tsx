"use client";

import { useEffect, useMemo, useState } from "react";
import hilltopPack from "../../public/cop/v4/april-storm-hilltop-observations.json";
import detectorPack from "../../public/cop/v4/april-storm-hydro-detector.json";
import eventPack from "../../public/cop/v4/april-storm-event-pack.json";
import { buildSensorReplayDataset, filterSensorReplayReadings, sensorReplayFrame, updateVisibleSensorSeries } from "../../lib/replayDataWorkspace.mjs";
import { eventSymbolFor } from "../../lib/liveMapWorkspace.mjs";
import { replayIntervalMs } from "../layerModel.mjs";
import EventSymbolBadge from "./EventSymbolBadge";
import LiveMap from "./LiveMap";

type Investigation = {
  id: string;
  title: string;
  source_id: string;
  starts_at: string;
  as_of: string;
  default_target_at?: string;
};
type ReplaySpeed = 0.5 | 1 | 2 | 4;
type SensorFilter = "all" | "rain" | "flow" | "anomaly";
type MapGeometry = { type: string; coordinates: unknown };
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
};
type MovementOutcomePack = {
  slots: Array<{ target_at: string; signals: MovementOutcomeSignal[] }>;
};
type MovementCoverageFeature = {
  geometry: MapGeometry | null;
  properties: { countline_id: string };
};
type MovementCoverage = { features: MovementCoverageFeature[] };

function timeLabel(value: string | null) {
  if (!value) return "No replay time";
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "short",
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

export default function SensorReplayCanvas({ investigation }: { investigation: Investigation }) {
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
  const [showMovementOutcomes, setShowMovementOutcomes] = useState(false);
  const [showImpactEvidence, setShowImpactEvidence] = useState(false);
  const [movementOutcomePack, setMovementOutcomePack] = useState<MovementOutcomePack | null>(null);
  const [movementCoverage, setMovementCoverage] = useState<MovementCoverage | null>(null);
  const [movementLoadState, setMovementLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [visibleSeriesIds, setVisibleSeriesIds] = useState<Set<string>>(
    () => new Set(dataset.series.map((series: { id: string }) => series.id)),
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
  const observations = visibleReadings
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
      },
    }));
  const movementOutcomeObservations = useMemo(() => {
    if (!showMovementOutcomes || !movementOutcomePack || !movementCoverage || !frame.target_at) return [];
    const target = new Date(frame.target_at).getTime();
    const slot = [...(movementOutcomePack.slots ?? [])]
      .filter((item) => new Date(item.target_at).getTime() <= target)
      .at(-1);
    if (!slot) return [];
    const geometryByCountline = new Map<string, MovementCoverageFeature>(
      movementCoverage.features.map((feature) => [String(feature.properties.countline_id), feature]),
    );
    return slot.signals.map((signal) => {
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
          model: "Movement seasonal MAD v1",
          availability: "Retrospective only",
        },
      };
    });
  }, [frame.target_at, movementCoverage, movementOutcomePack, showMovementOutcomes]);

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

  async function toggleMovementOutcomes() {
    if (showMovementOutcomes) {
      setShowMovementOutcomes(false);
      return;
    }
    setShowMovementOutcomes(true);
    if (movementOutcomePack || movementLoadState === "loading") return;
    setMovementLoadState("loading");
    try {
      const [outcomes, coverage] = await Promise.all([
      fetch("/cop/v4/april-storm-movement-outcomes.json").then((response) => {
        if (!response.ok) throw new Error("movement outcomes unavailable");
        return response.json() as Promise<MovementOutcomePack>;
      }),
      fetch("/cop/v1/countline-coverage.geojson").then((response) => {
        if (!response.ok) throw new Error("movement coverage unavailable");
        return response.json() as Promise<MovementCoverage>;
      }),
      ]);
      setMovementOutcomePack(outcomes);
      setMovementCoverage(coverage);
      setMovementLoadState("ready");
    } catch {
      setMovementLoadState("error");
    }
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

  return (
    <section id="replay-map" className="replay-map-workspace sensor-replay-workspace" data-replay-map-first="true" data-replay-dataset="sensor" aria-label="April sensor replay">
      <LiveMap
        observations={[...observations, ...movementOutcomeObservations]}
        sources={[
          { source_id: investigation.source_id, name: "Greater Wellington Hilltop" },
          { source_id: "wcc-transport-sensors", name: "WCC Transport Sensors" },
        ]}
        selectedId={selectedId}
        showBasemap={showBasemap}
        markerScale={markerScale}
        onSelect={setSelectedId}
      />
      <div className="replay-compact-bar" aria-label="Replay controls">
        <div className="replay-compact-identity">
          <h2>{investigation.title}</h2>
          <span>{timeLabel(frame.target_at)}</span>
        </div>
        <div className="filter-group" aria-label="Filter sensor series">
          {(["all", "rain", "flow", "anomaly"] as SensorFilter[]).map((value) => (
            <button key={value} type="button" className={filter === value ? "active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value === "all" ? "All" : value === "rain" ? "Rain" : value === "flow" ? "Flow" : "Candidates"}
            </button>
          ))}
        </div>
        <div className="replay-compact-actions">
          <button type="button" aria-expanded={layersOpen} aria-label={layersOpen ? "Hide sensor layers" : "Show sensor layers"} onClick={() => setLayersOpen((value) => !value)}>
            Layers <span>{visibleSeriesIds.size}/{dataset.series.length}</span>
          </button>
        </div>
        <div className="replay-compact-inputs">
          <label><span>Date</span><input type="date" aria-label="Replay date" value={selectedDate} min={replayDates[0]} max={replayDates.at(-1)} onChange={(event) => selectDate(event.currentTarget.value)} /></label>
          <label><span>Time</span><select aria-label="Replay time" value={frame.target_at ?? ""} onChange={(event) => selectTime(event.currentTarget.value)}>{dateSlots.map((time: string) => <option key={time} value={time}>{time.slice(11, 16)}</option>)}</select></label>
          <label><span>Speed</span><select aria-label="Replay speed" value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value) as ReplaySpeed)}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>
          <div className="replay-buttons">
            <button type="button" aria-label="Previous replay step" disabled={slotIndex === 0} onClick={() => { setSlotIndex((value) => Math.max(0, value - 1)); setPlaying(false); }}>←</button>
            <button type="button" className="play-button" aria-label={playing ? "Pause replay" : "Play replay"} aria-pressed={playing} onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button>
            <button type="button" aria-label="Next replay step" disabled={slotIndex >= dataset.slots.length - 1} onClick={() => { setSlotIndex((value) => Math.min(dataset.slots.length - 1, value + 1)); setPlaying(false); }}>→</button>
          </div>
        </div>
        <output className="replay-compact-count" aria-live="polite">{dataset.playable_record_count.toLocaleString("en-NZ")} / {dataset.total_record_count.toLocaleString("en-NZ")} records</output>
        <input className="replay-compact-scrubber" type="range" aria-label="Replay timeline" min={0} max={Math.max(0, dataset.slots.length - 1)} value={slotIndex} onChange={(event) => { setSlotIndex(Number(event.currentTarget.value)); setPlaying(false); }} />
      </div>
      <aside className="sensor-layer-overlay" aria-label="Sensor map layers" hidden={!layersOpen}>
        <header><h2>Layers</h2><button type="button" aria-label="Close sensor layers" onClick={() => setLayersOpen(false)}>×</button></header>
        <label className="sensor-core-layer"><input type="checkbox" checked={showBasemap} onChange={(event) => setShowBasemap(event.currentTarget.checked)} /><span>Street basemap</span></label>
        <div className="sensor-evidence-layer-summary" aria-label="April evidence layers">
          {dataset.layer_groups.map((group: { id: string; label: string; series_count: number }) => (
            <button key={group.id} type="button" onClick={() => setFilter(group.id === "rainfall" ? "rain" : group.id === "river-flow" ? "flow" : "anomaly")}>
              <span>{group.label}</span><strong>{group.series_count}</strong>
            </button>
          ))}
          <button type="button" aria-pressed={showMovementOutcomes} onClick={() => void toggleMovementOutcomes()}>
            <span>Movement outcomes</span><strong>{movementLoadState === "loading" ? "…" : movementOutcomeObservations.length || "Off"}</strong>
          </button>
          <button type="button" aria-label="Toggle official impact evidence" aria-pressed={showImpactEvidence} onClick={() => setShowImpactEvidence((value) => !value)}>
            <span>Official impacts</span><strong>{eventPack.ground_truth.length}</strong>
          </button>
        </div>
        {movementLoadState === "error" ? <p className="sensor-layer-error" role="status">Movement layer unavailable</p> : null}
        <section className="sensor-impact-evidence" aria-label="Official impact evidence" hidden={!showImpactEvidence}>
          <header><strong>Official impact evidence</strong><span>Post-event · withheld</span></header>
          <ul>
            {eventPack.ground_truth.map((item) => <li key={item.id}><strong>{item.source}</strong><span>{item.label}</span></li>)}
          </ul>
        </section>
        <label className="sensor-symbol-size"><span>Symbol size <output>{Math.round(markerScale * 100)}%</output></span><input type="range" aria-label="Sensor symbol size" min="0.8" max="1.6" step="0.1" value={markerScale} onChange={(event) => setMarkerScale(Number(event.currentTarget.value))} /></label>
        <div className="sensor-layer-actions"><button type="button" onClick={() => setVisibleSeriesIds(new Set(dataset.series.map((series: { id: string }) => series.id)))}>Show all</button><button type="button" onClick={() => setVisibleSeriesIds(new Set())}>Hide all</button></div>
        <div className="sensor-series-list" aria-label={`${dataset.series.length} sensor series`}>
          {dataset.series.map((series: { id: string; site: string; measurement: string; detector_episode_count: number }) => {
            const symbol = eventSymbolFor({ source_id: investigation.source_id, kind: series.measurement, properties: { measurement: series.measurement } });
            return (
              <label key={series.id}>
                <input type="checkbox" checked={visibleSeriesIds.has(series.id)} onChange={(event) => { const checked = event.currentTarget.checked; setVisibleSeriesIds((current) => updateVisibleSensorSeries(current, series.id, checked)); }} />
                <EventSymbolBadge symbolId={symbol.id} decorative />
                <span><strong>{series.site}</strong><small>{series.measurement}{series.detector_episode_count ? ` · ${series.detector_episode_count} candidates` : ""}</small></span>
              </label>
            );
          })}
        </div>
      </aside>
      <div className="sensor-reading-strip" aria-label="Current sensor values">
        {observations.map((observation) => (
          <button key={observation.id} type="button" onClick={() => setSelectedId(observation.id)}>
            <span>{String(observation.properties.name)}</span>
            <strong>{compactValue(Number(observation.properties.value), String(observation.properties.unit))}{observation.properties.detector_candidate ? " · candidate" : ""}</strong>
          </button>
        ))}
      </div>
      <span className="sr-only">Only observations available by the selected replay time are shown.</span>
    </section>
  );
}
