"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import registryData from "../public/cop/v2/source-registry.json";
import { SOURCE_MANIFEST } from "../lib/sourceManifest.mjs";
import { operationsTargetForConnectorMode } from "../lib/sourceOperations.mjs";
import {
  INVESTIGATION_MODULES,
  mergeInvestigationSources,
  persistableInvestigationSources,
  upsertInvestigationSource,
} from "../lib/replaySourceWorkspace.mjs";
import {
  MOVEMENT_REPLAY_SOURCE_ID,
  canInspectSelectedSources,
  canReplaySelectedSources,
  clampMapZoom,
  findNearestMapMarker,
  filterSourcesByOperationsTarget,
  playableSignalsForSources,
  replayIntervalMs,
  sourceLayerState,
  sourceSelectionSummary,
  zoomFromWheel,
  zoomPanOffsetAtPoint,
} from "./layerModel.mjs";

type Coordinate = [number, number];
type LineFeature = {
  id: string;
  geometry: { type: "LineString"; coordinates: Coordinate[] };
  properties: Record<string, unknown>;
};
type FeatureCollection = { type: "FeatureCollection"; features: LineFeature[] };
type Filter = "all" | "people" | "vehicles";
type ReplaySpeed = 0.5 | 1 | 2 | 4;
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
  operations_target: string;
  endpoint?: string | null;
  alert_eligible?: boolean;
  assigned_modules?: string[];
  record_origin?: "canonical" | "local_draft" | "local_override";
  canonical_name?: string;
  data_2026?: {
    status: string;
    active: boolean;
    record_state: string;
    verified_at: string;
  };
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
type MapDragState = {
  pointerId: number;
  last: Coordinate;
  distance: number;
  moved: boolean;
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
const canonicalSourceLayers = registryData.sources.map((source) => ({
  ...source,
  operations_target: operationsTargetForConnectorMode(
    SOURCE_MANIFEST[source.id as keyof typeof SOURCE_MANIFEST]?.connector_mode,
  ),
  alert_eligible: SOURCE_MANIFEST[source.id as keyof typeof SOURCE_MANIFEST]?.alert_eligible === true,
})) as SourceLayer[];
const SOURCE_WORKSPACE_STORAGE_KEY = "poneke-replay-source-workspace-v1";
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

type InvestigationSourceDraft = {
  id: string;
  name: string;
  endpoint: string;
  demo_data_status: string;
  access_status: string;
  assigned_modules: string[];
};

const EMPTY_SOURCE_DRAFT: InvestigationSourceDraft = {
  id: "",
  name: "",
  endpoint: "",
  demo_data_status: "registered_only",
  access_status: "public_free",
  assigned_modules: ["replay_analyzer"],
};

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
  panOffset: Coordinate,
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
    width / 2 + panOffset[0] + (worldX - center[0]) * worldScale,
    height / 2 + panOffset[1] + (worldY - center[1]) * worldScale,
  ];

  return {
    center,
    panOffset,
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
  const left = viewport.center[0]
    + (-width / 2 - viewport.panOffset[0]) / viewport.worldScale;
  const right = viewport.center[0]
    + (width / 2 - viewport.panOffset[0]) / viewport.worldScale;
  const top = viewport.center[1]
    + (-height / 2 - viewport.panOffset[1]) / viewport.worldScale;
  const bottom = viewport.center[1]
    + (height / 2 - viewport.panOffset[1]) / viewport.worldScale;
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
  panOffset: Coordinate,
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
  const viewport = createViewport(coordinates, width, height, zoom, panOffset);
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
          <h4 id="trend-heading">Matched-hour trend</h4>
          <span>12 weeks</span>
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
        </>
      ) : (
        <p className="trend-empty">Select a signal</p>
      )}
    </section>
  );
}

type LayerWorkspaceProps = {
  sources: SourceLayer[];
  showBasemap: boolean;
  showCoverage: boolean;
  symbolSize: number;
  selectedSourceIds: Set<string>;
  sourceStorageNotice: string;
  onClose: () => void;
  onSetBasemap: (value: boolean) => void;
  onSetCoverage: (value: boolean) => void;
  onSetSymbolSize: (value: number) => void;
  onToggleSource: (sourceId: string) => void;
  onSelectAllSources: () => void;
  onReplayOnly: () => void;
  onClearSources: () => void;
  onSaveSource: (draft: InvestigationSourceDraft) => { ok: boolean; errors: string[] };
};

function LayerWorkspace({
  sources,
  showBasemap,
  showCoverage,
  symbolSize,
  selectedSourceIds,
  sourceStorageNotice,
  onClose,
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
    <aside className="layer-workspace" aria-labelledby="layer-workspace-heading">
      <header className="layer-workspace-header">
        <h3 id="layer-workspace-heading">Layer workspace</h3>
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
          <h4 id="source-layers-heading">Investigation sources</h4>
          <span>{sourceStorageNotice}</span>
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
            return (
              <div
                className={`source-layer-row ${state.playable ? "is-playable" : "is-contract"}`}
                data-source-layer={source.id}
                data-playable={String(state.playable)}
                key={source.id}
              >
                <label htmlFor={`source-layer-${source.id}`}>
                  <input
                    id={`source-layer-${source.id}`}
                    aria-label={source.name}
                    type="checkbox"
                    checked={selectedSourceIds.has(source.id)}
                    onChange={() => onToggleSource(source.id)}
                  />
                  <span
                    className="layer-mini-symbol source-symbol"
                    style={{ width: symbolSize, height: symbolSize }}
                    aria-hidden="true"
                  />
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
                </label>
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
    </aside>
  );
}

export default function MovementCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const mapInteractionRef = useRef<HTMLDivElement>(null);
  const hitTargetsRef = useRef<MapHitTarget[]>([]);
  const panOffsetRef = useRef<Coordinate>([0, 0]);
  const mapDragRef = useRef<MapDragState | null>(null);
  const redrawMapRef = useRef<() => void>(() => undefined);
  const [coverage, setCoverage] = useState<LineFeature[]>([]);
  const [snapshotSignals, setSnapshotSignals] = useState<LineFeature[]>([]);
  const [replay, setReplay] = useState<ReplayPayload | null>(null);
  const [slotIndex, setSlotIndex] = useState(0);
  const [selectedSignalKey, setSelectedSignalKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [zoom, setZoom] = useState(1);
  const [hasPanned, setHasPanned] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [tileRevision, setTileRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [replayWarning, setReplayWarning] = useState<string | null>(null);
  const [isLayerRailOpen, setIsLayerRailOpen] = useState(true);
  const [showBasemap, setShowBasemap] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [symbolSize, setSymbolSize] = useState(10);
  const [sourceLayers, setSourceLayers] = useState<SourceLayer[]>(
    () => mergeInvestigationSources(canonicalSourceLayers) as SourceLayer[],
  );
  const [selectedSourceIds, setSelectedSourceIds] = useState(
    () => new Set([MOVEMENT_REPLAY_SOURCE_ID]),
  );
  const [sourceStorageReady, setSourceStorageReady] = useState(false);
  const [sourceStorageNotice, setSourceStorageNotice] = useState("This browser only");
  const [mapInspection, setMapInspection] = useState<MapInspection | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(SOURCE_WORKSPACE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const merged = mergeInvestigationSources(
            canonicalSourceLayers,
            parsed.sources,
          ) as SourceLayer[];
          setSourceLayers(merged);
          if (Array.isArray(parsed.selected_source_ids)) {
            const knownIds = new Set(merged.map((source) => source.id));
            setSelectedSourceIds(new Set(
              parsed.selected_source_ids.filter((id: unknown) => (
                typeof id === "string" && knownIds.has(id)
              )),
            ));
          }
          setSourceStorageNotice("Saved on this browser");
        }
      } catch {
        setSourceStorageNotice("Browser storage unavailable");
      }
      setSourceStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sourceStorageReady) return;
    try {
      window.localStorage.setItem(SOURCE_WORKSPACE_STORAGE_KEY, JSON.stringify({
        sources: persistableInvestigationSources(sourceLayers),
        selected_source_ids: [...selectedSourceIds],
      }));
    } catch {
      window.setTimeout(() => setSourceStorageNotice("Could not save"), 0);
    }
  }, [selectedSourceIds, sourceLayers, sourceStorageReady]);

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
    [selectedSourceIds, signals, sourceLayers],
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
    }, replayIntervalMs(replaySpeed));
    return () => window.clearInterval(timer);
  }, [isPlaying, replay, replaySourceSelected, replaySpeed]);

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
  const saveInvestigationSource = (draft: InvestigationSourceDraft) => {
    const result = upsertInvestigationSource(sourceLayers, draft);
    if (!result.ok) return { ok: false, errors: result.errors };
    setSourceLayers(result.sources as SourceLayer[]);
    setSelectedSourceIds((current) => new Set([...current, result.saved.id]));
    setSourceStorageNotice("Saved on this browser");
    return { ok: true, errors: [] };
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
          panOffsetRef.current,
          showBasemap,
          showCoverage,
          symbolSize,
          () => setTileRevision((value) => value + 1),
        );
      });
    };
    redrawMapRef.current = render;
    window.addEventListener("resize", render);
    render();
    return () => {
      cancelAnimationFrame(animationFrame);
      redrawMapRef.current = () => undefined;
      window.removeEventListener("resize", render);
    };
  }, [coverage, filteredSignals, selected, showBasemap, showCoverage, symbolSize, tileRevision, zoom]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === mapStageRef.current);
      setMapInspection(null);
      setFullscreenMessage(null);
      setTileRevision((value) => value + 1);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const mapInteraction = mapInteractionRef.current;
    if (!mapInteraction) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const nextZoom = zoomFromWheel(zoom, event.deltaY);
      if (nextZoom === zoom) return;
      const rect = mapInteraction.getBoundingClientRect();
      panOffsetRef.current = zoomPanOffsetAtPoint(
        panOffsetRef.current,
        zoom,
        nextZoom,
        [event.clientX - rect.left, event.clientY - rect.top],
        [rect.width, rect.height],
      );
      setHasPanned(
        Math.abs(panOffsetRef.current[0]) > 0.5
          || Math.abs(panOffsetRef.current[1]) > 0.5,
      );
      setZoom(nextZoom);
      setMapInspection(null);
    };
    mapInteraction.addEventListener("wheel", handleWheel, { passive: false });
    return () => mapInteraction.removeEventListener("wheel", handleWheel);
  }, [zoom]);

  const mapTargetAtPoint = (
    element: HTMLDivElement,
    clientX: number,
    clientY: number,
  ) => {
    const rect = element.getBoundingClientRect();
    const target = findNearestMapMarker(
      hitTargetsRef.current,
      { x: clientX - rect.left, y: clientY - rect.top },
      symbolSize + 9,
    ) as MapHitTarget | null;
    return { rect, target };
  };

  const inspectionForTarget = (target: MapHitTarget, rect: DOMRect): MapInspection => ({
    feature: target.feature,
    left: Math.min(Math.max(12, target.x + target.radius + 12), Math.max(12, rect.width - 272)),
    top: Math.min(Math.max(12, target.y - 34), Math.max(12, rect.height - 190)),
  });

  const inspectMap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!inspectionEnabled || mapDragRef.current) {
      setMapInspection(null);
      return;
    }
    const { rect, target } = mapTargetAtPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    if (!target) {
      setMapInspection(null);
      return;
    }
    setMapInspection(inspectionForTarget(target, rect));
  };

  const startMapPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    mapDragRef.current = {
      pointerId: event.pointerId,
      last: [event.clientX, event.clientY],
      distance: 0,
      moved: false,
    };
    setIsPanning(true);
  };

  const moveMapPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.last[0];
    const deltaY = event.clientY - drag.last[1];
    drag.last = [event.clientX, event.clientY];
    drag.distance += Math.hypot(deltaX, deltaY);
    drag.moved = drag.moved || drag.distance > 3;
    if (!drag.moved) return;
    panOffsetRef.current = [
      panOffsetRef.current[0] + deltaX,
      panOffsetRef.current[1] + deltaY,
    ];
    setMapInspection(null);
    redrawMapRef.current();
  };

  const finishMapPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      setHasPanned(true);
    } else if (inspectionEnabled) {
      const { rect, target } = mapTargetAtPoint(
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
      if (target) {
        setSelectedSignalKey(signalKey(target.feature));
        setMapInspection(inspectionForTarget(target, rect));
      }
    }
    mapDragRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const adjustZoom = (nextZoom: number) => {
    const clampedZoom = clampMapZoom(nextZoom);
    const rect = mapInteractionRef.current?.getBoundingClientRect();
    if (rect) {
      panOffsetRef.current = zoomPanOffsetAtPoint(
        panOffsetRef.current,
        zoom,
        clampedZoom,
        [rect.width / 2, rect.height / 2],
        [rect.width, rect.height],
      );
      setHasPanned(
        Math.abs(panOffsetRef.current[0]) > 0.5
          || Math.abs(panOffsetRef.current[1]) > 0.5,
      );
    }
    setZoom(clampedZoom);
    setMapInspection(null);
  };

  const resetMapView = () => {
    panOffsetRef.current = [0, 0];
    setHasPanned(false);
    setZoom(1);
    setMapInspection(null);
    redrawMapRef.current();
  };

  const toggleMapFullscreen = async () => {
    const mapStage = mapStageRef.current;
    if (!mapStage || !document.fullscreenEnabled) {
      setFullscreenMessage("Fullscreen is unavailable in this browser view.");
      return;
    }
    try {
      if (document.fullscreenElement === mapStage) await document.exitFullscreen();
      else await mapStage.requestFullscreen();
    } catch {
      setFullscreenMessage("Fullscreen was blocked. Use the browser's fullscreen control instead.");
    }
  };

  return (
    <section
      className={`investigation-frame ${isLayerRailOpen ? "has-layer-rail" : ""}`}
      aria-labelledby="map-heading"
    >
      {isLayerRailOpen ? (
        <LayerWorkspace
          sources={sourceLayers}
          showBasemap={showBasemap}
          showCoverage={showCoverage}
          symbolSize={symbolSize}
          selectedSourceIds={selectedSourceIds}
          sourceStorageNotice={sourceStorageNotice}
          onClose={() => setIsLayerRailOpen(false)}
          onSetBasemap={setShowBasemap}
          onSetCoverage={setShowCoverage}
          onSetSymbolSize={setSymbolSize}
          onToggleSource={toggleSource}
          onSelectAllSources={() => { setSelectedSourceIds(new Set(sourceLayers.map((source) => source.id))); setMapInspection(null); }}
          onReplayOnly={() => { setSelectedSourceIds(new Set([MOVEMENT_REPLAY_SOURCE_ID])); setMapInspection(null); }}
          onClearSources={() => { setSelectedSourceIds(new Set()); setIsPlaying(false); setMapInspection(null); }}
          onSaveSource={saveInvestigationSource}
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
            <h2 id="map-heading">Movement changes</h2>
            <span>{replayLabel}</span>
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
                  ? `${formatReplayTime(replay.available_from)} to ${formatReplayTime(replay.available_to)}`
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
            <label className="replay-speed-control">
              <span>Speed</span>
              <select
                aria-label="Replay speed"
                value={replaySpeed}
                disabled={!replayEnabled}
                onChange={(event) => setReplaySpeed(Number(event.currentTarget.value) as ReplaySpeed)}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={4}>4×</option>
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
        <div className="map-stage" ref={mapStageRef}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${filteredSignals.length} unusual movement changes across 414 WCC countlines ${showBasemap ? "on the Wellington basemap" : "with the basemap hidden"}.`}
          />
          <div
            ref={mapInteractionRef}
            className="map-inspection-layer"
            aria-label="Paused map inspection layer"
            data-active={inspectionEnabled}
            data-map-selectable={inspectionEnabled}
            data-panning={isPanning}
            onMouseMove={inspectMap}
            onMouseLeave={() => {
              if (!mapDragRef.current) setMapInspection(null);
            }}
            onPointerDown={startMapPan}
            onPointerMove={moveMapPan}
            onPointerUp={finishMapPan}
            onPointerCancel={finishMapPan}
          />
          <div className={`map-inspection-status ${inspectionEnabled ? "is-ready" : "is-off"}`}>
            <strong>
              {isPanning
                ? "Moving map"
                : inspectionEnabled
                ? "Paused · hover markers"
                : isPlaying
                ? "Playing · inspection off"
                : "Paused · select real replay layer"}
            </strong>
            <span>{inspectionEnabled ? `${filteredSignals.length} signals` : ""}</span>
            <span className="sr-only">
              Inspection is off during playback. The signal list remains available for keyboard inspection.
            </span>
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
              <small>WCC Transport Sensors · real replay</small>
            </aside>
          ) : null}
          <div className="map-controls" aria-label="Map zoom controls">
            <div className="map-zoom-buttons">
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= 0.5}
                onClick={() => adjustZoom(zoom - 0.25)}
              >−</button>
              <output aria-live="polite">{Math.round(zoom * 100)}% zoom</output>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= 8}
                onClick={() => adjustZoom(zoom + 0.25)}
              >+</button>
            </div>
            <div className="map-zoom-range">
              <input
                type="range"
                aria-label="Map zoom level"
                min="0.5"
                max="8"
                step="0.1"
                value={zoom}
                onChange={(event) => adjustZoom(Number(event.currentTarget.value))}
              />
            </div>
            <div className="map-view-actions">
              <button
                type="button"
                aria-label="Reset map view"
                disabled={zoom === 1 && !hasPanned}
                onClick={resetMapView}
              >Reset</button>
              <button
                type="button"
                aria-label={isMapFullscreen ? "Exit map fullscreen" : "Show map fullscreen"}
                aria-pressed={isMapFullscreen}
                onClick={toggleMapFullscreen}
              >{isMapFullscreen ? "Exit full screen" : "Full screen"}</button>
            </div>
          </div>
          {fullscreenMessage ? (
            <p className="map-fullscreen-message" role="status">{fullscreenMessage}</p>
          ) : null}
          <div className="map-key">
            <span><i className="increase" />Increase</span>
            <span><i className="decrease" />Decrease</span>
            <span aria-label="Travel direction"><b className="direction-arrow-key" aria-hidden="true">↗</b>Direction</span>
            {showCoverage ? <span><i className="coverage" />Sensor coverage</span> : null}
          </div>
          {showBasemap ? (
            <div className="map-attribution">
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                © OpenStreetMap contributors
              </a>
            </div>
          ) : <div className="map-attribution"><span>Basemap hidden</span></div>}
          {coverage.length === 0 && !error ? <p className="map-message">Loading countlines…</p> : null}
          {error ? <p className="map-message error" role="alert">{error}</p> : null}
        </div>
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
          </div>
        ) : (
          <p className="empty-evidence">
            {replaySourceSelected
              ? "Select a signal"
              : "Select a movement source"}
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
