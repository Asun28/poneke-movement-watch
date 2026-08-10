"use client";

import { useEffect, useMemo, useState } from "react";
import hilltopPack from "../../public/cop/v4/april-storm-hilltop-observations.json";
import { buildSensorReplayDataset, sensorReplayFrame } from "../../lib/replayDataWorkspace.mjs";
import { replayIntervalMs } from "../layerModel.mjs";
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
type SensorFilter = "all" | "rain" | "flow";

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
    () => buildSensorReplayDataset(hilltopPack, investigation),
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
  const frame = useMemo(() => sensorReplayFrame(dataset, slotIndex), [dataset, slotIndex]);
  const replayDates = useMemo(
    () => [...new Set(dataset.slots.map((time: string) => time.slice(0, 10)))],
    [dataset],
  );
  const selectedDate = frame.target_at?.slice(0, 10) ?? replayDates[0] ?? "";
  const dateSlots = dataset.slots.filter((time: string) => time.startsWith(selectedDate));
  const observations = frame.readings
    .filter((reading: { measurement: string }) => {
      const measurement = reading.measurement.toLowerCase();
      return filter === "all" || (filter === "rain" ? measurement.includes("rain") : measurement.includes("flow"));
    })
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
    }) => ({
      id: reading.id,
      source_id: investigation.source_id,
      kind: reading.measurement.toLowerCase().includes("rain") ? "rainfall_measurement" : "river_flow_measurement",
      observed_at: reading.observed_at,
      freshness_state: "historical replay",
      evidence_weight: 2,
      geometry: reading.geometry,
      properties: {
        name: reading.site,
        measurement: reading.measurement,
        value: reading.value,
        unit: reading.unit,
        change: reading.change,
        available_at: reading.available_at,
      },
    }));

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
        observations={observations}
        sources={[{ source_id: investigation.source_id, name: "Greater Wellington Hilltop" }]}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="replay-compact-bar" aria-label="Replay controls">
        <div className="replay-compact-identity">
          <h2>{investigation.title}</h2>
          <span>{timeLabel(frame.target_at)}</span>
        </div>
        <div className="filter-group" aria-label="Filter sensor series">
          {(["all", "rain", "flow"] as SensorFilter[]).map((value) => (
            <button key={value} type="button" className={filter === value ? "active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value === "all" ? "All" : value === "rain" ? "Rain" : "Flow"}
            </button>
          ))}
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
      <div className="sensor-reading-strip" aria-label="Current sensor values">
        {observations.map((observation) => (
          <button key={observation.id} type="button" onClick={() => setSelectedId(observation.id)}>
            <span>{String(observation.properties.name)}</span>
            <strong>{compactValue(Number(observation.properties.value), String(observation.properties.unit))}</strong>
          </button>
        ))}
      </div>
      <span className="sr-only">Only observations available by the selected replay time are shown.</span>
    </section>
  );
}
