"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import registryData from "../public/cop/v2/source-registry.json";
import {
  MOVEMENT_REPLAY_SOURCE_ID,
  canInspectSelectedSources,
  canReplaySelectedSources,
  findNearestMapMarker,
  playableSignalsForSources,
  sourceLayerState,
  sourceSelectionSummary,
} from "./layerModel.mjs";

type Coordinate = [number, number];
type LineFeature = {
  id: string;
  geometry: { type: "LineString"; coordinates: Coordinate[] };
  properties: Record<string, unknown>;
};
type FeatureCollection = { type: "FeatureCollection"; features: LineFeature[] };
type Filter = "all" | "people" | "vehicles";
type HistoryPoint = { observed_at: string; observed_count: number };
type SignalConfidence = { level: string; history_samples: number; basis: string };
type ReplaySignal = {
  id: string;
  countline_id: string;
  viewpoint_id: string;
  name: string;
  transport_class: string;
  direction: string;
  change_direction: "increase" | "decrease";
  observed_count: number;
  expected_count: number;
  robust_z: number;
  observed_at: string;
  matched_history: HistoryPoint[];
  signal_confidence: SignalConfidence;
};
type ReplaySlot = {
  target_at: string;
  observed_groups: number;
  expected_groups: number;
  data_gap_groups: number;
  candidate_count: number;
  signals: ReplaySignal[];
};
type ReplayPayload = {
  schema: "movement-replay/v1";
  available_from: string;
  available_to: string;
  default_target_at: string;
  data_as_of: string;
  publisher_cadence: string;
  slots: ReplaySlot[];
};
type SourceLayer = {
  id: string;
  name: string;
  role: string;
  demo_data_status: string;
  access_status: string;
};
type MapHitTarget = {
  id: string;
  x: number;
  y: number;
  radius: number;
  feature: LineFeature;
};
type MapInspection = {
  feature: LineFeature;
  left: number;
  top: number;
};

const PEOPLE = new Set(["Pedestrian", "Cyclist", "E-scooter"]);
const DIRECTION_VECTORS: Record<string, Coordinate> = {
  N: [0, -1],
  NE: [Math.SQRT1_2, -Math.SQRT1_2],
  E: [1, 0],
  SE: [Math.SQRT1_2, Math.SQRT1_2],
  S: [0, 1],
  SW: [-Math.SQRT1_2, Math.SQRT1_2],
  W: [-1, 0],
  NW: [-Math.SQRT1_2, -Math.SQRT1_2],
};
const TILE_SIZE = 256;
const EMPTY_HISTORY: HistoryPoint[] = [];
const tileCache = new Map<string, HTMLImageElement>();
const failedTiles = new Set<string>();
const sourceLayers = registryData.sources as SourceLayer[];

function signalKey(feature: LineFeature) {
  return [
    feature.properties.countline_id,
    feature.properties.transport_class,
    feature.properties.direction,
  ].join(":");
}

function replaySignalFeature(
  signal: ReplaySignal,
  coverageByCountline: Map<string, LineFeature>,
): LineFeature | null {
  const coverageFeature = coverageByCountline.get(signal.countline_id);
  if (!coverageFeature) return null;
  return {
    type: "Feature",
    id: signal.id,
    geometry: coverageFeature.geometry,
    properties: signal,
  } as LineFeature & { type: "Feature" };
}

function formatReplayTime(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  }).format(new Date(value)).replace(",", " ·");
}

function lonLatToWorld([longitude, latitude]: Coordinate): Coordinate {
  const limitedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const sine = Math.sin((limitedLatitude * Math.PI) / 180);
  return [
    (longitude + 180) / 360,
    0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI),
  ];
}

function createViewport(
  coordinates: Coordinate[],
  width: number,
  height: number,
  zoom: number,
) {
  const worldCoordinates = coordinates.map(lonLatToWorld);
  const worldXs = worldCoordinates.map(([x]) => x);
  const worldYs = worldCoordinates.map(([, y]) => y);
  const bounds = {
    west: Math.min(...worldXs),
    east: Math.max(...worldXs),
    north: Math.min(...worldYs),
    south: Math.max(...worldYs),
  };
  const padding = 28;
  const availableWidth = Math.max(1, width - padding * 2);
  const availableHeight = Math.max(1, height - padding * 2);
  const baseScale = Math.min(
    availableWidth / Math.max(Number.EPSILON, bounds.east - bounds.west),
    availableHeight / Math.max(Number.EPSILON, bounds.south - bounds.north),
  );
  const worldScale = baseScale * zoom;
  const center: Coordinate = [
    (bounds.west + bounds.east) / 2,
    (bounds.north + bounds.south) / 2,
  ];
  const projectWorld = ([worldX, worldY]: Coordinate): Coordinate => [
    width / 2 + (worldX - center[0]) * worldScale,
    height / 2 + (worldY - center[1]) * worldScale,
  ];

  return {
    center,
    worldScale,
    tileZoom: Math.max(0, Math.min(19, Math.round(Math.log2(worldScale / TILE_SIZE)))),
    project: (coordinate: Coordinate) => projectWorld(lonLatToWorld(coordinate)),
    projectWorld,
  };
}

function drawStreetTiles(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: ReturnType<typeof createViewport>,
  onTileSettled: () => void,
) {
  const tileCount = 2 ** viewport.tileZoom;
  const left = viewport.center[0] - width / (2 * viewport.worldScale);
  const right = viewport.center[0] + width / (2 * viewport.worldScale);
  const top = viewport.center[1] - height / (2 * viewport.worldScale);
  const bottom = viewport.center[1] + height / (2 * viewport.worldScale);
  const minTileX = Math.floor(left * tileCount);
  const maxTileX = Math.floor(right * tileCount);
  const minTileY = Math.max(0, Math.floor(top * tileCount));
  const maxTileY = Math.min(tileCount - 1, Math.floor(bottom * tileCount));
  const tilePixelSize = viewport.worldScale / tileCount;

  context.save();
  context.globalAlpha = 0.78;
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount;
      const key = `${viewport.tileZoom}/${wrappedTileX}/${tileY}`;
      const [screenX, screenY] = viewport.projectWorld([
        tileX / tileCount,
        tileY / tileCount,
      ]);
      const image = tileCache.get(key);

      if (image?.complete && image.naturalWidth > 0) {
        context.drawImage(image, screenX, screenY, tilePixelSize + 1, tilePixelSize + 1);
        continue;
      }
      if (image || failedTiles.has(key)) continue;

      const pendingImage = new Image();
      pendingImage.decoding = "async";
      pendingImage.referrerPolicy = "strict-origin-when-cross-origin";
      pendingImage.onload = onTileSettled;
      pendingImage.onerror = () => {
        tileCache.delete(key);
        failedTiles.add(key);
        onTileSettled();
      };
      tileCache.set(key, pendingImage);
      pendingImage.src = `https://tile.openstreetmap.org/${key}.png`;
    }
  }
  context.restore();

  context.fillStyle = "rgba(232, 240, 241, 0.18)";
  context.fillRect(0, 0, width, height);
}

function drawMap(
  canvas: HTMLCanvasElement,
  coverage: LineFeature[],
  signals: LineFeature[],
  selectedId: string | null,
  zoom: number,
  showBasemap: boolean,
  showCoverage: boolean,
  symbolSize: number,
  onTileSettled: () => void,
): MapHitTarget[] {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return [];
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const context = canvas.getContext("2d");
  if (!context || coverage.length === 0) return [];
  context.scale(ratio, ratio);
  const width = rect.width;
  const height = rect.height;
  context.clearRect(0, 0, width, height);

  const coordinates = coverage.flatMap((feature) => feature.geometry.coordinates);
  const viewport = createViewport(coordinates, width, height, zoom);
  const project = viewport.project;
  if (showBasemap) drawStreetTiles(context, width, height, viewport, onTileSettled);

  if (showCoverage) {
    context.strokeStyle = "rgba(35, 72, 83, 0.68)";
    context.fillStyle = "rgba(35, 72, 83, 0.78)";
    context.lineWidth = 1.4;
    for (const feature of coverage) {
      const [start, end] = feature.geometry.coordinates.map(project);
      context.beginPath();
      context.moveTo(...start);
      context.lineTo(...end);
      context.stroke();
      context.beginPath();
      context.arc((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, 1.6, 0, Math.PI * 2);
      context.fill();
    }
  }

  const hitTargets: MapHitTarget[] = [];
  for (const feature of signals) {
    const [start, rawEnd] = feature.geometry.coordinates.map(project);
    const dx = rawEnd[0] - start[0];
    const dy = rawEnd[1] - start[1];
    const length = Math.hypot(dx, dy) || 1;
    const end: Coordinate = length < 9
      ? [start[0] + (dx / length) * 9, start[1] + (dy / length) * 9]
      : rawEnd;
    const isSelected = feature.id === selectedId;
    const decreasing = feature.properties.change_direction === "decrease";
    context.strokeStyle = decreasing ? "#C75845" : "#D78916";
    context.lineWidth = isSelected ? Math.max(5, symbolSize * 0.6) : Math.max(3, symbolSize * 0.35);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(...start);
    context.lineTo(...end);
    context.stroke();
    drawMovementMarker(
      context,
      start,
      String(feature.properties.direction),
      isSelected,
      decreasing ? "#C75845" : "#D78916",
      symbolSize,
    );
    if (start[0] >= 0 && start[0] <= width && start[1] >= 0 && start[1] <= height) {
      hitTargets.push({
        id: feature.id,
        x: start[0],
        y: start[1],
        radius: isSelected ? symbolSize + 3 : symbolSize,
        feature,
      });
    }
  }
  return hitTargets;
}

function drawMovementMarker(
  context: CanvasRenderingContext2D,
  [x, y]: Coordinate,
  direction: string,
  isSelected: boolean,
  colour: string,
  symbolSize: number,
) {
  const radius = isSelected ? symbolSize + 3 : symbolSize;
  context.fillStyle = "#F8FBFB";
  context.strokeStyle = isSelected ? "#102A33" : colour;
  context.lineWidth = isSelected ? 3 : 2;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  const normalisedDirection = direction.toUpperCase();
  const [vectorX, vectorY] = DIRECTION_VECTORS[normalisedDirection] ?? [1, 0];
  const arrowHalfLength = radius * 0.55;
  const headX = x + vectorX * arrowHalfLength;
  const headY = y + vectorY * arrowHalfLength;
  const perpendicularX = -vectorY;
  const perpendicularY = vectorX;
  const headLength = radius * 0.32;
  const headWidth = radius * 0.26;

  context.strokeStyle = "#102A33";
  context.lineWidth = isSelected ? 2.4 : 2;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(x - vectorX * arrowHalfLength, y - vectorY * arrowHalfLength);
  context.lineTo(headX, headY);
  context.moveTo(headX, headY);
  context.lineTo(
    headX - vectorX * headLength + perpendicularX * headWidth,
    headY - vectorY * headLength + perpendicularY * headWidth,
  );
  context.moveTo(headX, headY);
  context.lineTo(
    headX - vectorX * headLength - perpendicularX * headWidth,
    headY - vectorY * headLength - perpendicularY * headWidth,
  );
  context.stroke();
}

function TrendView({ signal }: { signal?: LineFeature }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = (signal?.properties.matched_history as HistoryPoint[] | undefined) ?? EMPTY_HISTORY;
  const observed = signal ? Number(signal.properties.observed_count) : 0;
  const expected = signal ? Number(signal.properties.expected_count) : 0;
  const points = useMemo(() => signal
    ? [...history, { observed_at: String(signal.properties.observed_at), observed_count: observed }]
    : [], [history, observed, signal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      const width = rect.width;
      const height = rect.height;
      const padding = { left: 32, right: 12, top: 12, bottom: 22 };
      const maxValue = Math.max(expected, ...points.map((point) => point.observed_count), 1);
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const x = (index: number) => padding.left + (index / Math.max(1, points.length - 1)) * chartWidth;
      const y = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(16, 42, 51, 0.12)";
      context.lineWidth = 1;
      for (let step = 0; step <= 2; step += 1) {
        const gridY = padding.top + (chartHeight / 2) * step;
        context.beginPath();
        context.moveTo(padding.left, gridY);
        context.lineTo(width - padding.right, gridY);
        context.stroke();
      }
      context.fillStyle = "#526b73";
      context.font = "9px Consolas, monospace";
      context.fillText(String(Math.round(maxValue)), 2, padding.top + 4);
      context.fillText("0", 20, padding.top + chartHeight + 3);

      context.setLineDash([5, 4]);
      context.strokeStyle = "#1e6a8d";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(padding.left, y(expected));
      context.lineTo(width - padding.right, y(expected));
      context.stroke();
      context.setLineDash([]);

      const colour = signal?.properties.change_direction === "decrease" ? "#c75845" : "#d78916";
      context.strokeStyle = colour;
      context.lineWidth = 2.5;
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(x(index), y(point.observed_count));
        else context.lineTo(x(index), y(point.observed_count));
      });
      context.stroke();
      points.forEach((point, index) => {
        context.fillStyle = index === points.length - 1 ? "#102a33" : colour;
        context.beginPath();
        context.arc(x(index), y(point.observed_count), index === points.length - 1 ? 4 : 2.5, 0, Math.PI * 2);
        context.fill();
      });
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [expected, points, signal]);

  const firstDate = points[0]?.observed_at;
  const lastDate = points.at(-1)?.observed_at;
  const shortDate = (value: string) => new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));

  return (
    <section className="trend-panel" aria-labelledby="trend-heading">
      <div className="trend-heading-row">
        <div>
          <p className="eyebrow">Matched-hour trend</p>
          <h4 id="trend-heading">Prior 12 matching weeks</h4>
        </div>
        <div className="trend-legend" aria-label="Trend legend">
          <span><i className="observed-line" />Observed count</span>
          <span><i className="expected-line" />Expected baseline</span>
        </div>
      </div>
      {signal ? (
        <>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Observed count history for ${String(signal.properties.name)}. Current ${observed}; expected ${expected}.`}
          />
          <div className="trend-range">
            <span>{firstDate ? shortDate(firstDate) : ""}</span>
            <strong>Selected hour</strong>
            <span>{lastDate ? shortDate(lastDate) : ""}</span>
          </div>
          <p>Real observations at the same weekday and hour. Gaps are not interpolated.</p>
        </>
      ) : (
        <p className="trend-empty">Select a signal in a replay hour to view its real matched history.</p>
      )}
    </section>
  );
}

type LayerWorkspaceProps = {
  showBasemap: boolean;
  showCoverage: boolean;
  symbolSize: number;
  selectedSourceIds: Set<string>;
  onClose: () => void;
  onSetBasemap: (value: boolean) => void;
  onSetCoverage: (value: boolean) => void;
  onSetSymbolSize: (value: number) => void;
  onToggleSource: (sourceId: string) => void;
  onSelectAllSources: () => void;
  onReplayOnly: () => void;
  onClearSources: () => void;
};

function LayerWorkspace({
  showBasemap,
  showCoverage,
  symbolSize,
  selectedSourceIds,
  onClose,
  onSetBasemap,
  onSetCoverage,
  onSetSymbolSize,
  onToggleSource,
  onSelectAllSources,
  onReplayOnly,
  onClearSources,
}: LayerWorkspaceProps) {
  const [sourceQuery, setSourceQuery] = useState("");
  const summary = sourceSelectionSummary(selectedSourceIds, sourceLayers);
  const visibleSources = sourceLayers.filter((source) => (
    `${source.name} ${source.role}`.toLowerCase().includes(sourceQuery.trim().toLowerCase())
  ));

  return (
    <aside className="layer-workspace" aria-labelledby="layer-workspace-heading">
      <header className="layer-workspace-header">
        <div>
          <p className="eyebrow">Map + integration</p>
          <h3 id="layer-workspace-heading">Layer workspace</h3>
        </div>
        <button type="button" aria-label="Hide layer panel" onClick={onClose}>×</button>
      </header>

      <section className="layer-group" aria-labelledby="base-layers-heading">
        <div className="layer-group-heading">
          <h4 id="base-layers-heading">Map layers</h4>
          <span>2 display layers</span>
        </div>
        <label className="core-layer-row" htmlFor="layer-basemap">
          <input
            id="layer-basemap"
            aria-label="Street basemap"
            type="checkbox"
            checked={showBasemap}
            onChange={(event) => onSetBasemap(event.currentTarget.checked)}
          />
          <span className="sr-only">Street basemap</span>
          <span className="layer-mini-symbol basemap-symbol" aria-hidden="true" />
          <span><strong>Street basemap</strong><small>OpenStreetMap · display only</small></span>
        </label>
        <label className="core-layer-row" htmlFor="layer-coverage">
          <input
            id="layer-coverage"
            aria-label="Sensor coverage"
            type="checkbox"
            checked={showCoverage}
            onChange={(event) => onSetCoverage(event.currentTarget.checked)}
          />
          <span className="sr-only">Sensor coverage</span>
          <span className="layer-mini-symbol coverage-symbol" aria-hidden="true" />
          <span><strong>Sensor coverage</strong><small>414 WCC countlines</small></span>
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
          <h4 id="source-layers-heading">Source layers</h4>
          <span>{summary.selected_count}/{sourceLayers.length} selected</span>
        </div>
        <p className="layer-truth-note">
          Only selected sources with real replay records are played.
        </p>
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
        <div className="source-layer-list" aria-label={`${visibleSources.length} source layers`}>
          {visibleSources.map((source) => {
            const state = sourceLayerState(source);
            return (
              <label
                className={`source-layer-row ${state.playable ? "is-playable" : "is-contract"}`}
                htmlFor={`source-layer-${source.id}`}
                data-source-layer={source.id}
                data-playable={String(state.playable)}
                key={source.id}
              >
                <input
                  id={`source-layer-${source.id}`}
                  aria-label={source.name}
                  type="checkbox"
                  checked={selectedSourceIds.has(source.id)}
                  onChange={() => onToggleSource(source.id)}
                />
                <span className="sr-only">{source.name}</span>
                <span
                  className="layer-mini-symbol source-symbol"
                  style={{ width: symbolSize, height: symbolSize }}
                  aria-hidden="true"
                />
                <span className="source-layer-copy">
                  <strong>{source.name}</strong>
                  <small>{source.role.replaceAll("_", " ")}</small>
                  <span className="source-layer-status">
                    <em>{state.truth_label}</em>
                    <em>{state.access_label}</em>
                    <em>{state.record_label}</em>
                  </span>
                </span>
              </label>
            );
          })}
          {visibleSources.length === 0 ? (
            <p className="no-source-match">No source layer matches this search.</p>
          ) : null}
        </div>
        <div className="layer-selection-summary" aria-live="polite">
          <strong>{summary.playable_source_count} playable</strong>
          <span>{summary.selected_count} selected integration layers</span>
        </div>
      </section>
    </aside>
  );
}

export default function MovementCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitTargetsRef = useRef<MapHitTarget[]>([]);
  const [coverage, setCoverage] = useState<LineFeature[]>([]);
  const [snapshotSignals, setSnapshotSignals] = useState<LineFeature[]>([]);
  const [replay, setReplay] = useState<ReplayPayload | null>(null);
  const [slotIndex, setSlotIndex] = useState(0);
  const [selectedSignalKey, setSelectedSignalKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [zoom, setZoom] = useState(1);
  const [tileRevision, setTileRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [replayWarning, setReplayWarning] = useState<string | null>(null);
  const [isLayerRailOpen, setIsLayerRailOpen] = useState(true);
  const [showBasemap, setShowBasemap] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [symbolSize, setSymbolSize] = useState(10);
  const [selectedSourceIds, setSelectedSourceIds] = useState(
    () => new Set([MOVEMENT_REPLAY_SOURCE_ID]),
  );
  const [mapInspection, setMapInspection] = useState<MapInspection | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/cop/v1/countline-coverage.geojson").then((response) => response.json()),
      fetch("/cop/v1/movement-signals.geojson").then((response) => response.json()),
    ])
      .then(([coverageData, signalData]: FeatureCollection[]) => {
        setCoverage(coverageData.features);
        setSnapshotSignals(signalData.features);
        setSelectedSignalKey(signalData.features[0] ? signalKey(signalData.features[0]) : null);
      })
      .catch(() => setError("The replay files could not be loaded. Check the COP feed."));

    fetch("/cop/v1/movement-replay.json")
      .then((response) => {
        if (!response.ok) throw new Error("replay unavailable");
        return response.json();
      })
      .then((payload: ReplayPayload) => {
        setReplay(payload);
        const defaultIndex = payload.slots.findIndex(
          (slot) => slot.target_at === payload.default_target_at,
        );
        setSlotIndex(defaultIndex >= 0 ? defaultIndex : payload.slots.length - 1);
      })
      .catch(() => setReplayWarning("History replay is unavailable; showing the published snapshot."));
  }, []);

  const coverageByCountline = useMemo(() => new Map(
    coverage.map((feature) => [String(feature.properties.countline_id), feature]),
  ), [coverage]);
  const currentSlot = replay?.slots[slotIndex];
  const signals = useMemo(() => {
    if (!currentSlot) return snapshotSignals;
    return currentSlot.signals
      .map((signal) => replaySignalFeature(signal, coverageByCountline))
      .filter((feature): feature is LineFeature => feature !== null);
  }, [coverageByCountline, currentSlot, snapshotSignals]);
  const replaySourceSelected = canReplaySelectedSources(selectedSourceIds, sourceLayers);
  const inspectionEnabled = canInspectSelectedSources(
    isPlaying,
    selectedSourceIds,
    sourceLayers,
  );
  const selectedLayerSignals = useMemo(
    () => playableSignalsForSources(signals, selectedSourceIds, sourceLayers) as LineFeature[],
    [selectedSourceIds, signals],
  );
  const filteredSignals = useMemo(() => selectedLayerSignals.filter((feature) => {
    const mode = String(feature.properties.transport_class);
    if (filter === "people") return PEOPLE.has(mode);
    if (filter === "vehicles") return !PEOPLE.has(mode);
    return true;
  }), [selectedLayerSignals, filter]);

  const selected = filteredSignals.find(
    (feature) => signalKey(feature) === selectedSignalKey,
  ) ?? filteredSignals[0];

  useEffect(() => {
    if (!isPlaying || !replay || !replaySourceSelected) return;
    const timer = window.setInterval(() => {
      setSlotIndex((current) => {
        if (current >= replay.slots.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [isPlaying, replay, replaySourceSelected]);

  const replayDates = useMemo(() => replay
    ? [...new Set(replay.slots.map((slot) => slot.target_at.slice(0, 10)))]
    : [], [replay]);
  const selectedDate = currentSlot?.target_at.slice(0, 10) ?? "2026-08-06";
  const selectedHour = currentSlot?.target_at.slice(11, 13) ?? "12";
  const availableHours = replay?.slots
    .filter((slot) => slot.target_at.startsWith(selectedDate))
    .map((slot) => slot.target_at.slice(11, 13)) ?? [];
  const selectDateAndHour = (date: string, hour: string) => {
    if (!replay || !replaySourceSelected) return;
    const exact = replay.slots.findIndex(
      (slot) => slot.target_at.startsWith(`${date}T${hour}:`),
    );
    const firstOnDate = replay.slots.findIndex((slot) => slot.target_at.startsWith(`${date}T`));
    if (exact >= 0) setSlotIndex(exact);
    else if (firstOnDate >= 0) setSlotIndex(firstOnDate);
    setIsPlaying(false);
    setMapInspection(null);
  };
  const replayLabel = currentSlot
    ? formatReplayTime(currentSlot.target_at)
    : "12:00 · Thursday 6 August 2026";
  const confidence = selected?.properties.signal_confidence as SignalConfidence | undefined;
  const replayEnabled = Boolean(replay && replaySourceSelected);
  const toggleSource = (sourceId: string) => {
    if (sourceId === MOVEMENT_REPLAY_SOURCE_ID && selectedSourceIds.has(sourceId)) {
      setIsPlaying(false);
    }
    setMapInspection(null);
    setSelectedSourceIds((current) => {
      const next = new Set(current);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animationFrame = 0;
    const render = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        hitTargetsRef.current = drawMap(
          canvas,
          coverage,
          filteredSignals,
          selected?.id ?? null,
          zoom,
          showBasemap,
          showCoverage,
          symbolSize,
          () => setTileRevision((value) => value + 1),
        );
      });
    };
    window.addEventListener("resize", render);
    render();
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", render);
    };
  }, [coverage, filteredSignals, selected, showBasemap, showCoverage, symbolSize, tileRevision, zoom]);

  const inspectMap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!inspectionEnabled) {
      setMapInspection(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const target = findNearestMapMarker(
      hitTargetsRef.current,
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      symbolSize + 9,
    ) as MapHitTarget | null;
    if (!target) {
      setMapInspection(null);
      return;
    }
    setMapInspection({
      feature: target.feature,
      left: Math.min(Math.max(12, target.x + target.radius + 12), Math.max(12, rect.width - 272)),
      top: Math.min(Math.max(12, target.y - 34), Math.max(12, rect.height - 190)),
    });
  };

  return (
    <section
      className={`investigation-frame ${isLayerRailOpen ? "has-layer-rail" : ""}`}
      aria-labelledby="map-heading"
    >
      {isLayerRailOpen ? (
        <LayerWorkspace
          showBasemap={showBasemap}
          showCoverage={showCoverage}
          symbolSize={symbolSize}
          selectedSourceIds={selectedSourceIds}
          onClose={() => setIsLayerRailOpen(false)}
          onSetBasemap={setShowBasemap}
          onSetCoverage={setShowCoverage}
          onSetSymbolSize={setSymbolSize}
          onToggleSource={toggleSource}
          onSelectAllSources={() => { setSelectedSourceIds(new Set(sourceLayers.map((source) => source.id))); setMapInspection(null); }}
          onReplayOnly={() => { setSelectedSourceIds(new Set([MOVEMENT_REPLAY_SOURCE_ID])); setMapInspection(null); }}
          onClearSources={() => { setSelectedSourceIds(new Set()); setIsPlaying(false); setMapInspection(null); }}
        />
      ) : null}
      <div className="map-column">
        <button
          type="button"
          className="show-layer-panel"
          aria-label="Show layer panel"
          hidden={isLayerRailOpen}
          onClick={() => setIsLayerRailOpen(true)}
        >
          Layers <span>{selectedSourceIds.size}/{sourceLayers.length}</span>
        </button>
        <div className="map-toolbar">
          <div>
            <p className="eyebrow">{replayLabel}</p>
            <h2 id="map-heading">Countline change field</h2>
          </div>
          <div className="filter-group" aria-label="Filter signals">
            {(["all", "people", "vehicles"] as Filter[]).map((value) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "active" : ""}
                aria-pressed={filter === value}
                onClick={() => { setFilter(value); setMapInspection(null); }}
              >
                {value === "all" ? "All" : value === "people" ? "People" : "Vehicles"}
              </button>
            ))}
          </div>
        </div>
        <section className="replay-console" aria-labelledby="replay-heading">
          <div className="replay-console-title">
            <div>
              <span id="replay-heading">History replay</span>
              <small>
                {replay
                  ? `${formatReplayTime(replay.available_from)} — ${formatReplayTime(replay.available_to)}`
                  : "Loading published history range…"}
              </small>
            </div>
            <output aria-live="polite">
              {!replaySourceSelected
                ? "No playable data selected"
                : currentSlot
                ? `${currentSlot.candidate_count} signals · ${currentSlot.data_gap_groups} data gaps`
                : "Published snapshot"}
            </output>
          </div>
          <div className="replay-inputs">
            <label>
              <span>Date</span>
              <input
                type="date"
                aria-label="Replay date"
                value={selectedDate}
                min={replayDates[0]}
                max={replayDates.at(-1)}
                disabled={!replayEnabled}
                onChange={(event) => selectDateAndHour(event.currentTarget.value, selectedHour)}
              />
            </label>
            <label>
              <span>Hour</span>
              <select
                aria-label="Replay hour"
                value={selectedHour}
                disabled={!replayEnabled}
                onChange={(event) => selectDateAndHour(selectedDate, event.currentTarget.value)}
              >
                {(availableHours.length > 0 ? availableHours : ["12"]).map((hour) => (
                  <option key={hour} value={hour}>{hour}:00</option>
                ))}
              </select>
            </label>
            <div className="replay-buttons">
              <button
                type="button"
                aria-label="Previous replay hour"
                disabled={!replayEnabled || slotIndex === 0}
                onClick={() => { setSlotIndex((value) => Math.max(0, value - 1)); setIsPlaying(false); setMapInspection(null); }}
              >←</button>
              <button
                type="button"
                className="play-button"
                aria-label={isPlaying ? "Pause replay" : "Play replay"}
                aria-pressed={isPlaying}
                disabled={!replayEnabled || (replay?.slots.length ?? 0) < 2}
                onClick={() => {
                  if (!isPlaying) setMapInspection(null);
                  setIsPlaying(!isPlaying);
                }}
              >{isPlaying ? "Pause" : "Play"}</button>
              <button
                type="button"
                aria-label="Next replay hour"
                disabled={!replayEnabled || slotIndex >= (replay?.slots.length ?? 1) - 1}
                onClick={() => { setSlotIndex((value) => Math.min((replay?.slots.length ?? 1) - 1, value + 1)); setIsPlaying(false); setMapInspection(null); }}
              >→</button>
            </div>
          </div>
          <input
            className="replay-scrubber"
            type="range"
            aria-label="Replay timeline"
            min={0}
            max={Math.max(0, (replay?.slots.length ?? 1) - 1)}
            value={slotIndex}
            disabled={!replayEnabled}
            onChange={(event) => { setSlotIndex(Number(event.currentTarget.value)); setIsPlaying(false); setMapInspection(null); }}
          />
          {replayWarning ? <p className="replay-warning" role="status">{replayWarning}</p> : null}
        </section>
        <div className="map-stage">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${filteredSignals.length} unusual movement changes across 414 WCC countlines ${showBasemap ? "on a real Wellington street basemap" : "with the basemap hidden"}. Direction arrows show travel direction.`}
          />
          <div
            className="map-inspection-layer"
            aria-label="Paused map inspection layer"
            data-active={inspectionEnabled}
            onMouseMove={inspectMap}
            onMouseLeave={() => setMapInspection(null)}
          />
          <div className={`map-inspection-status ${inspectionEnabled ? "is-ready" : "is-off"}`}>
            <strong>{inspectionEnabled ? "Paused · hover markers" : isPlaying ? "Playing · inspection off" : "Paused · select real replay layer"}</strong>
            <span>Inspection is off during playback. The signal list remains available for keyboard inspection.</span>
          </div>
          {mapInspection ? (
            <aside
              className="map-hover-card"
              role="status"
              style={{ left: mapInspection.left, top: mapInspection.top }}
            >
              <div>
                <span>Paused inspection</span>
                <em className={String(mapInspection.feature.properties.change_direction)}>
                  {String(mapInspection.feature.properties.change_direction)}
                </em>
              </div>
              <strong>{String(mapInspection.feature.properties.name)}</strong>
              <p>
                {String(mapInspection.feature.properties.transport_class)} · {String(mapInspection.feature.properties.direction)} travel
              </p>
              <dl>
                <div><dt>Observed</dt><dd>{Number(mapInspection.feature.properties.observed_count).toLocaleString("en-NZ")}</dd></div>
                <div><dt>Expected</dt><dd>{Number(mapInspection.feature.properties.expected_count).toLocaleString("en-NZ", { maximumFractionDigits: 1 })}</dd></div>
              </dl>
              <time>{formatReplayTime(String(mapInspection.feature.properties.observed_at))}</time>
              <small>WCC Transport Sensors · real replay · no cause inferred</small>
            </aside>
          ) : null}
          <div className="map-controls" aria-label="Map zoom controls">
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoom >= 4}
              onClick={() => { setZoom((value) => Math.min(4, value + 0.5)); setMapInspection(null); }}
            >+</button>
            <output aria-live="polite">{Math.round(zoom * 100)}% zoom</output>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoom <= 1}
              onClick={() => { setZoom((value) => Math.max(1, value - 0.5)); setMapInspection(null); }}
            >−</button>
            <button
              type="button"
              aria-label="Reset map view"
              disabled={zoom === 1}
              onClick={() => { setZoom(1); setMapInspection(null); }}
            >Reset</button>
          </div>
          <div className="map-key">
            <span><i className="increase" />Increase</span>
            <span><i className="decrease" />Decrease</span>
            <span aria-label="Travel direction"><b className="direction-arrow-key" aria-hidden="true">↗</b>Arrow shows travel direction</span>
            {showCoverage ? <span><i className="coverage" />Sensor coverage</span> : null}
          </div>
          {showBasemap ? (
            <div className="map-attribution">
              <span>Real Wellington street basemap</span>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                © OpenStreetMap contributors
              </a>
            </div>
          ) : <div className="map-attribution"><span>Basemap hidden</span></div>}
          {coverage.length === 0 && !error ? <p className="map-message">Loading countlines…</p> : null}
          {error ? <p className="map-message error" role="alert">{error}</p> : null}
        </div>
        <p className="map-caption">
          Geometry is the WCC sensor countline itself. It does not imply the whole
          surrounding street or suburb changed. Sensor overlay remains available if
          map tiles cannot load. Only selected real-replay source layers animate;
          contract-only layers never create markers.
        </p>
      </div>

      <aside className="evidence-column" aria-label="Signal evidence">
        {selected ? (
          <div className="selected-evidence">
            <div className="evidence-heading">
              <span className={`direction-chip ${selected.properties.change_direction}`}>
                {String(selected.properties.change_direction)}
              </span>
              <span>Investigate</span>
            </div>
            <h3>{String(selected.properties.name)}</h3>
            <p>{String(selected.properties.transport_class)} · {String(selected.properties.direction)}</p>
            <div className="count-comparison">
              <div><span>Observed</span><strong>{Number(selected.properties.observed_count).toLocaleString("en-NZ")}</strong></div>
              <div><span>Expected</span><strong>{Number(selected.properties.expected_count).toLocaleString("en-NZ")}</strong></div>
            </div>
            <dl className="evidence-metrics">
              <div><dt>Robust score</dt><dd>{Number(selected.properties.robust_z).toFixed(1)} z</dd></div>
              <div><dt>History</dt><dd>{confidence?.history_samples ?? 0} matched hours</dd></div>
              <div><dt>Baseline strength</dt><dd>{confidence?.level ?? "unknown"}</dd></div>
            </dl>
            <p className="evidence-note">No cause inferred. Check operational context before acting.</p>
          </div>
        ) : (
          <p className="empty-evidence">
            {replaySourceSelected
              ? "Select a signal to inspect its evidence."
              : "Select WCC Transport Sensors in the layer workspace to replay movement."}
          </p>
        )}

        <TrendView signal={selected} />

        <div className="signal-list" aria-label={`${filteredSignals.length} filtered signals`}>
          {filteredSignals.map((feature) => (
            <button
              type="button"
              key={feature.id}
              className={feature.id === selected?.id ? "selected" : ""}
              onClick={() => setSelectedSignalKey(signalKey(feature))}
            >
              <span>
                <strong>{String(feature.properties.name)}</strong>
                <small>{String(feature.properties.transport_class)} · {String(feature.properties.direction)}</small>
              </span>
              <em className={String(feature.properties.change_direction)}>
                {Number(feature.properties.robust_z) > 0 ? "+" : ""}{Number(feature.properties.robust_z).toFixed(1)}
              </em>
            </button>
          ))}
          {filteredSignals.length === 0 ? (
            <p className="empty-slot">
              {replaySourceSelected
                ? "No investigation signals in this hour and filter."
                : "No playable movement source is selected."}
            </p>
          ) : null}
        </div>
      </aside>
    </section>
  );
}
