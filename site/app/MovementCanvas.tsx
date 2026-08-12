"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, Broadcast, CarProfile, CornersIn, CornersOut, PersonSimpleWalk, SidebarSimple, SquaresFour } from "@phosphor-icons/react";
import registryData from "../public/cop/v2/source-registry.json";
import { SOURCE_MANIFEST } from "../lib/sourceManifest.mjs";
import { operationsTargetForConnectorMode } from "../lib/sourceOperations.mjs";
import { buildAdaptiveEvidenceClusterModel, buildAdaptiveEvidenceModel } from "../lib/adaptiveEvidence.mjs";
import { OPERATIONAL_BASEMAP, operationalBasemapTileUrl } from "../lib/operationalBasemap.mjs";
import {
  INVESTIGATION_MODULES,
  mergeInvestigationSources,
  movementIconDescriptor,
  persistableInvestigationSources,
  upsertInvestigationSource,
} from "../lib/replaySourceWorkspace.mjs";
import {
  MOVEMENT_REPLAY_SOURCE_ID,
  canInspectSelectedSources,
  canReplaySelectedSources,
  clampMapZoom,
  clusterMovementMarkers,
  findNearestMapMarker,
  filterSourcesByOperationsTarget,
  playableSignalsForSources,
  replayIntervalMs,
  sourceLayerState,
  sourceSelectionSummary,
  toggleSourceSelection,
  zoomFromWheel,
  zoomPanOffsetAtPoint,
} from "./layerModel.mjs";
import InvestigationLayersPanel, { InvestigationLayersButton } from "./components/InvestigationLayersPanel";
import MovementDelta from "./components/MovementDelta";
import SourceIconPicker, { SourceIconMode, SourceIconPreview } from "./components/SourceIconPicker";
import { AdaptiveEvidenceDrawer, AdaptiveEvidencePreview } from "./components/AdaptiveEvidence";
import ReplayDensityTimeline from "./components/ReplayDensityTimeline";
import { movementReplayTimelinePoints } from "../lib/replayDataWorkspace.mjs";

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
  icon_mode?: SourceIconMode;
  custom_icon_data_url?: string | null;
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
  features: LineFeature[];
  count: number;
};
type MapInspection = {
  feature: LineFeature;
  features: LineFeature[];
  count: number;
  left: number;
  top: number;
};
type ProjectedMovementMarker = {
  id: string;
  x: number;
  y: number;
  feature: LineFeature;
  selected: boolean;
  colour: string;
  direction: string;
  icon: "people" | "vehicle" | "custom";
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
  icon_mode: SourceIconMode;
  custom_icon_data_url: string | null;
};

const EMPTY_SOURCE_DRAFT: InvestigationSourceDraft = {
  id: "",
  name: "",
  endpoint: "",
  demo_data_status: "registered_only",
  access_status: "public_free",
  assigned_modules: ["replay_analyzer"],
  icon_mode: "auto",
  custom_icon_data_url: null,
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

function movementEvidenceRecord(feature: LineFeature) {
  return {
    id: String(feature.id),
    source_id: MOVEMENT_REPLAY_SOURCE_ID,
    kind: "movement_outcome",
    observed_at: String(feature.properties.observed_at ?? ""),
    freshness_state: "real replay",
    properties: feature.properties,
  };
}

function formatTimelineTick(value: string | undefined) {
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
      pendingImage.src = operationalBasemapTileUrl({
        zoom: viewport.tileZoom,
        x: wrappedTileX,
        y: tileY,
        pixelRatio: window.devicePixelRatio || 1,
      });
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
  iconSource: SourceLayer | undefined,
  customMarkerImage: HTMLImageElement | null,
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

  const projectedMarkers: ProjectedMovementMarker[] = [];
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
    context.strokeStyle = decreasing ? "#C75845" : "#0C66E4";
    context.lineWidth = isSelected ? Math.max(5, symbolSize * 0.6) : Math.max(3, symbolSize * 0.35);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(...start);
    context.lineTo(...end);
    context.stroke();
    const descriptor = movementIconDescriptor(
      iconSource,
      String(feature.properties.transport_class),
      String(feature.properties.direction),
    );
    if (start[0] >= 0 && start[0] <= width && start[1] >= 0 && start[1] <= height) {
      projectedMarkers.push({
        id: feature.id,
        x: start[0],
        y: start[1],
        feature,
        selected: isSelected,
        colour: decreasing ? "#C75845" : "#0C66E4",
        direction: descriptor.direction,
        icon: descriptor.icon,
      });
    }
  }

  const hitTargets: MapHitTarget[] = [];
  const clusters = clusterMovementMarkers(projectedMarkers, zoom, Math.max(48, symbolSize * 4));
  for (const cluster of clusters) {
    const primary = cluster.markers[0] as ProjectedMovementMarker;
    const features = cluster.markers.map((marker: ProjectedMovementMarker) => marker.feature);
    const selectedInCluster = cluster.markers.some((marker: ProjectedMovementMarker) => marker.selected);
    const radius = cluster.count > 1
      ? drawMovementCluster(context, [cluster.x, cluster.y], cluster.count, selectedInCluster)
      : (() => {
          drawMovementMarker(
            context,
            [primary.x, primary.y],
            primary.direction,
            primary.selected,
            primary.colour,
            symbolSize,
            primary.icon,
            primary.icon === "custom" ? customMarkerImage : null,
          );
          return (primary.selected ? symbolSize + 3 : symbolSize) * 1.55;
        })();
    hitTargets.push({
      id: cluster.count > 1 ? `cluster:${cluster.markers.map((marker: ProjectedMovementMarker) => marker.id).join(":")}` : primary.id,
      x: cluster.x,
      y: cluster.y,
      radius,
      feature: primary.feature,
      features,
      count: cluster.count,
    });
  }
  return hitTargets;
}

function drawMovementCluster(
  context: CanvasRenderingContext2D,
  [x, y]: Coordinate,
  count: number,
  selected: boolean,
) {
  const radius = count > 99 ? 22 : 20;
  context.save();
  context.shadowColor = "rgba(9, 30, 66, 0.24)";
  context.shadowBlur = 7;
  context.fillStyle = selected ? "#102A33" : "#0C66E4";
  context.strokeStyle = "#FFFFFF";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowColor = "transparent";
  context.fillStyle = "#FFFFFF";
  context.font = `800 ${count > 99 ? 10 : 12}px "Segoe UI", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(count > 999 ? "999+" : String(count), x, y + 0.5);
  context.restore();
  return radius + 8;
}

function drawMovementMarker(
  context: CanvasRenderingContext2D,
  [x, y]: Coordinate,
  direction: string,
  isSelected: boolean,
  colour: string,
  symbolSize: number,
  icon: "people" | "vehicle" | "custom",
  customImage: HTMLImageElement | null,
) {
  const radius = isSelected ? symbolSize + 3 : symbolSize;
  context.fillStyle = "#F8FBFB";
  context.strokeStyle = isSelected ? "#102A33" : colour;
  context.lineWidth = isSelected ? 3 : 2;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.save();
  context.strokeStyle = "#102A33";
  context.fillStyle = "#102A33";
  context.lineWidth = Math.max(1.4, radius * 0.13);
  context.lineCap = "round";
  context.lineJoin = "round";
  if (icon === "custom" && customImage?.complete && customImage.naturalWidth > 0) {
    context.beginPath();
    context.arc(x, y, radius * 0.68, 0, Math.PI * 2);
    context.clip();
    context.drawImage(customImage, x - radius * 0.68, y - radius * 0.68, radius * 1.36, radius * 1.36);
  } else if (icon === "people") {
    context.beginPath();
    context.arc(x, y - radius * 0.35, radius * 0.16, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(x, y - radius * 0.13);
    context.lineTo(x, y + radius * 0.28);
    context.moveTo(x - radius * 0.32, y + radius * 0.02);
    context.lineTo(x, y - radius * 0.05);
    context.lineTo(x + radius * 0.3, y + radius * 0.12);
    context.moveTo(x, y + radius * 0.28);
    context.lineTo(x - radius * 0.27, y + radius * 0.58);
    context.moveTo(x, y + radius * 0.28);
    context.lineTo(x + radius * 0.3, y + radius * 0.55);
    context.stroke();
  } else {
    context.beginPath();
    context.moveTo(x - radius * 0.58, y - radius * 0.04);
    context.lineTo(x - radius * 0.34, y - radius * 0.34);
    context.lineTo(x + radius * 0.3, y - radius * 0.34);
    context.lineTo(x + radius * 0.56, y - radius * 0.04);
    context.lineTo(x + radius * 0.56, y + radius * 0.32);
    context.lineTo(x - radius * 0.58, y + radius * 0.32);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(x - radius * 0.32, y + radius * 0.36, radius * 0.12, 0, Math.PI * 2);
    context.arc(x + radius * 0.31, y + radius * 0.36, radius * 0.12, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  const normalisedDirection = direction.toUpperCase();
  const [vectorX, vectorY] = DIRECTION_VECTORS[normalisedDirection] ?? [1, 0];
  const arrowStart = radius * 0.82;
  const arrowEnd = radius * 1.45;
  const headX = x + vectorX * arrowEnd;
  const headY = y + vectorY * arrowEnd;
  const perpendicularX = -vectorY;
  const perpendicularY = vectorX;
  const headLength = radius * 0.3;
  const headWidth = radius * 0.22;

  const strokeDirectionArrow = () => {
    context.beginPath();
    context.moveTo(x + vectorX * arrowStart, y + vectorY * arrowStart);
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
  };
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#FFFFFF";
  context.lineWidth = isSelected ? 5 : 4.4;
  strokeDirectionArrow();
  context.strokeStyle = colour;
  context.lineWidth = isSelected ? 2.8 : 2.3;
  strokeDirectionArrow();
}

function TrendView({ signal, visible }: { signal?: LineFeature; visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = (signal?.properties.matched_history as HistoryPoint[] | undefined) ?? EMPTY_HISTORY;
  const observed = signal ? Number(signal.properties.observed_count) : 0;
  const expected = signal ? Number(signal.properties.expected_count) : 0;
  const points = useMemo(() => signal
    ? [...history, { observed_at: String(signal.properties.observed_at), observed_count: observed }]
    : [], [history, observed, signal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0 || !visible) return;
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

      const colour = signal?.properties.change_direction === "decrease" ? "#c75845" : "#0c66e4";
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
  }, [expected, points, signal, visible]);

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
      icon_mode: source.icon_mode ?? "auto",
      custom_icon_data_url: source.custom_icon_data_url ?? null,
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
    <>
      <section className="layer-group" aria-labelledby="base-layers-heading">
        <div className="layer-group-heading">
          <h4 id="base-layers-heading">Map layers</h4>
          <span>2 display layers</span>
        </div>
        <label className="core-layer-row" htmlFor="layer-basemap">
          <input
            id="layer-basemap"
            aria-label="Calm streets basemap"
            type="checkbox"
            checked={showBasemap}
            onChange={(event) => onSetBasemap(event.currentTarget.checked)}
          />
          <span className="sr-only">Calm streets basemap</span>
          <span className="layer-mini-symbol basemap-symbol" aria-hidden="true" />
          <span><strong>{OPERATIONAL_BASEMAP.label}</strong><small>Low-clutter · display only</small></span>
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
            <SourceIconPicker
              mode={sourceDraft.icon_mode}
              customIconDataUrl={sourceDraft.custom_icon_data_url}
              onChange={({ mode, customIconDataUrl }) => {
                setSourceDraft((current) => ({
                  ...current,
                  icon_mode: mode,
                  custom_icon_data_url: customIconDataUrl,
                }));
              }}
            />
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
            const isSelected = selectedSourceIds.has(source.id);
            return (
              <div
                className={`source-layer-row ${state.playable ? "is-playable" : "is-contract"}`}
                data-source-layer={source.id}
                data-playable={String(state.playable)}
                data-selected={String(isSelected)}
                key={source.id}
              >
                <button
                  className={`source-layer-toggle ${isSelected ? "is-selected" : ""}`}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? "Remove" : "Add"} ${source.name} source layer`}
                  onClick={() => onToggleSource(source.id)}
                >
                  <SourceIconPreview
                    mode={source.icon_mode ?? "auto"}
                    customIconDataUrl={source.custom_icon_data_url}
                    size={Math.max(18, symbolSize + 7)}
                  />
                  <span className="source-layer-toggle-mark" aria-hidden="true">
                    {isSelected ? "✓" : "+"}
                  </span>
                </button>
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
    </>
  );
}

export default function MovementCanvas({ investigation, investigationControl }: {
  investigation?: { id: string; title: string; starts_at: string; as_of: string; default_target_at?: string };
  investigationControl?: ReactNode;
}) {
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
  const [isLayerRailOpen, setIsLayerRailOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
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
  const [customMarkerAsset, setCustomMarkerAsset] = useState<{
    url: string;
    image: HTMLImageElement;
  } | null>(null);
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
        const startsAt = investigation?.starts_at ? new Date(investigation.starts_at).getTime() : null;
        const asOf = investigation?.as_of ? new Date(investigation.as_of).getTime() : null;
        const slots = payload.slots.filter((slot) => {
          const targetAt = new Date(slot.target_at).getTime();
          return (startsAt === null || targetAt >= startsAt) && (asOf === null || targetAt <= asOf);
        });
        if (slots.length === 0) throw new Error("no replay records in investigation window");
        const boundedPayload = {
          ...payload,
          available_from: slots[0].target_at,
          available_to: slots.at(-1)?.target_at ?? slots[0].target_at,
          default_target_at: investigation?.default_target_at ?? payload.default_target_at,
          slots,
        };
        setReplay(boundedPayload);
        const defaultIndex = slots.findIndex(
          (slot) => slot.target_at === boundedPayload.default_target_at,
        );
        setSlotIndex(defaultIndex >= 0 ? defaultIndex : slots.length - 1);
      })
      .catch(() => setReplayWarning("History replay is unavailable; showing the published snapshot."));
  }, [investigation?.as_of, investigation?.default_target_at, investigation?.starts_at]);

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

  const movementIconSource = useMemo(
    () => sourceLayers.find((source) => source.id === MOVEMENT_REPLAY_SOURCE_ID),
    [sourceLayers],
  );
  const movementCustomIconUrl = movementIconSource?.icon_mode === "custom"
    ? movementIconSource.custom_icon_data_url ?? null
    : null;
  const customMarkerImage = customMarkerAsset?.url === movementCustomIconUrl
    ? customMarkerAsset.image
    : null;

  useEffect(() => {
    if (!movementCustomIconUrl) return;
    let active = true;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => { if (active) setCustomMarkerAsset({ url: movementCustomIconUrl, image }); };
    image.src = movementCustomIconUrl;
    return () => { active = false; };
  }, [movementCustomIconUrl]);

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
  const selectedEvidence = selected
    ? buildAdaptiveEvidenceModel(movementEvidenceRecord(selected), {
      case_id: "august-movement-review-2026",
      source_label: "WCC Transport Sensors",
      truth_label: "Batch replay",
    })
    : null;
  const inspectionEvidence = mapInspection?.count === 1
    ? buildAdaptiveEvidenceModel(movementEvidenceRecord(mapInspection.feature), {
      case_id: "august-movement-review-2026",
      source_label: "WCC Transport Sensors",
      truth_label: "Batch replay",
    })
    : null;
  const inspectionCluster = mapInspection?.count && mapInspection.count > 1
    ? buildAdaptiveEvidenceClusterModel(mapInspection.features.map(movementEvidenceRecord), {
      case_id: "august-movement-review-2026",
    })
    : null;

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
    setSelectedSignalKey(null);
    setIsEvidenceOpen(false);
  };
  const replayEnabled = Boolean(replay && replaySourceSelected);
  const replayTimelinePoints = useMemo(
    () => movementReplayTimelinePoints(replay?.slots),
    [replay],
  );
  const toggleSource = (sourceId: string) => {
    if (sourceId === MOVEMENT_REPLAY_SOURCE_ID && selectedSourceIds.has(sourceId)) {
      setIsPlaying(false);
    }
    setMapInspection(null);
    setSelectedSignalKey(null);
    setIsEvidenceOpen(false);
    setSelectedSourceIds((current) => toggleSourceSelection(current, sourceId));
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
          movementIconSource,
          customMarkerImage,
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
  }, [coverage, customMarkerImage, filteredSignals, movementIconSource, selected, showBasemap, showCoverage, symbolSize, tileRevision, zoom]);

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
    features: target.features,
    count: target.count,
    left: Math.min(Math.max(12, target.x + target.radius + 12), Math.max(12, rect.width - 272)),
    top: Math.min(Math.max(12, target.y - 34), Math.max(12, rect.height - 190)),
  });

  const zoomToCluster = (target: MapHitTarget, element: HTMLDivElement) => {
    const nextZoom = clampMapZoom(Math.max(zoom + 0.75, zoom * 1.8));
    const rect = element.getBoundingClientRect();
    panOffsetRef.current = zoomPanOffsetAtPoint(
      panOffsetRef.current,
      zoom,
      nextZoom,
      [target.x, target.y],
      [rect.width, rect.height],
    );
    setHasPanned(true);
    setZoom(nextZoom);
    setMapInspection(null);
  };

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
        if (target.count > 1) zoomToCluster(target, event.currentTarget);
        else {
          setSelectedSignalKey(signalKey(target.feature));
          setMapInspection(inspectionForTarget(target, rect));
        }
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
      id="replay-map"
      ref={mapStageRef}
      className="investigation-frame replay-map-workspace"
      aria-label={`${investigation?.title ?? "Movement changes"} replay map`}
      data-replay-map-first="true"
      data-replay-dataset="movement"
      data-delta-encoding="signed-centre-bar"
      data-marker-direction="icon-arrow"
    >
      <InvestigationLayersPanel open={isLayerRailOpen} onClose={() => setIsLayerRailOpen(false)}>
        <LayerWorkspace
          sources={sourceLayers}
          showBasemap={showBasemap}
          showCoverage={showCoverage}
          symbolSize={symbolSize}
          selectedSourceIds={selectedSourceIds}
          sourceStorageNotice={sourceStorageNotice}
          onSetBasemap={setShowBasemap}
          onSetCoverage={setShowCoverage}
          onSetSymbolSize={setSymbolSize}
          onToggleSource={toggleSource}
          onSelectAllSources={() => { setSelectedSourceIds(new Set(sourceLayers.map((source) => source.id))); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          onReplayOnly={() => { setSelectedSourceIds(new Set([MOVEMENT_REPLAY_SOURCE_ID])); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          onClearSources={() => { setSelectedSourceIds(new Set()); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          onSaveSource={saveInvestigationSource}
        />
      </InvestigationLayersPanel>
      <div className="map-column">
        <div className="replay-compact-bar movement-replay-compact" aria-label="Replay controls" data-replay-command-bar="unified" data-replay-toolbar-layout="two-tier" data-replay-density="compact">
          <div className="replay-playback-header" aria-label="Playback header">
            {investigationControl}
            <div className="replay-compact-inputs">
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
                  onClick={() => { setSlotIndex((value) => Math.max(0, value - 1)); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
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
                    setSelectedSignalKey(null);
                    setIsEvidenceOpen(false);
                  }}
                >{isPlaying ? "Pause" : "Play"}</button>
                <button
                  type="button"
                  aria-label="Next replay hour"
                  disabled={!replayEnabled || slotIndex >= (replay?.slots.length ?? 1) - 1}
                  onClick={() => { setSlotIndex((value) => Math.min((replay?.slots.length ?? 1) - 1, value + 1)); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
                >→</button>
              </div>
            </div>
            <output className="replay-compact-count" aria-live="polite">
              {!replaySourceSelected
                ? "No playable data"
                : currentSlot
                ? `${currentSlot.candidate_count} signals · ${currentSlot.data_gap_groups} gaps`
                : "Loading…"}
            </output>
          </div>
          <ReplayDensityTimeline
            points={replayTimelinePoints}
            currentIndex={slotIndex}
            disabled={!replayEnabled}
            densityMeasure="movement-candidates"
            densityLabel="model candidates"
            formatTick={formatTimelineTick}
            onChange={(index) => { setSlotIndex(index); setIsPlaying(false); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
          />
          <nav className="replay-filter-subbar replay-compact-actions" aria-label="Replay filters and layers">
            <div className="replay-primary-filters" data-replay-filter-zone="primary">
              <div className="filter-group" data-replay-filter-kind="movement-mode" aria-label="Filter movement mode">
                {(["all", "people", "vehicles"] as Filter[]).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={filter === value ? "active" : ""}
                    aria-pressed={filter === value}
                    onClick={() => { setFilter(value); setMapInspection(null); setSelectedSignalKey(null); setIsEvidenceOpen(false); }}
                  >
                    {value === "all" ? (
                      <span className="movement-filter-icon" data-movement-icon="all" aria-hidden="true">
                        <SquaresFour size={17} weight="bold" />
                      </span>
                    ) : null}
                    {value === "people" ? (
                      <span className="movement-filter-icon" data-movement-icon="people" aria-hidden="true">
                        <PersonSimpleWalk size={17} weight="bold" />
                      </span>
                    ) : null}
                    {value === "vehicles" ? (
                      <span className="movement-filter-icon" data-movement-icon="vehicle" aria-hidden="true">
                        <CarProfile size={17} weight="bold" />
                      </span>
                    ) : null}
                    {value === "all" ? "All" : value === "people" ? "People" : "Vehicles"}
                  </button>
                ))}
              </div>
              <div className="replay-map-overlays" aria-label="Map overlays">
                <button type="button" data-replay-overlay="sensor-coverage" aria-pressed={showCoverage} aria-label="Sensor coverage" onClick={() => setShowCoverage((value) => !value)}>
                  <span className="movement-filter-icon" data-movement-icon="sensor" aria-hidden="true">
                    <Broadcast size={17} weight="bold" />
                  </span>
                  Coverage
                </button>
              </div>
            </div>
            <div className="replay-primary-actions" data-replay-action-zone="always-visible">
              <InvestigationLayersButton
                open={isLayerRailOpen}
                selectedCount={selectedSourceIds.size + Number(showBasemap) + Number(showCoverage)}
                totalCount={sourceLayers.length + 2}
                onToggle={() => setIsLayerRailOpen((value) => !value)}
              />
              <button
                type="button"
                data-replay-action="evidence"
                data-icon-only="true"
                aria-expanded={isEvidenceOpen}
                aria-label={isEvidenceOpen ? "Hide signal evidence" : "Show signal evidence"}
                title={`Evidence · ${filteredSignals.length}`}
                onClick={() => setIsEvidenceOpen((value) => !value)}
              >
                <SidebarSimple size={20} weight="regular" aria-hidden="true" />
                <span className="sr-only">{filteredSignals.length} signals</span>
              </button>
            </div>
          </nav>
          {replayWarning ? <p className="replay-warning" role="status">{replayWarning}</p> : null}
        </div>
        <div className="map-stage replay-map-stage">
          <canvas
            ref={canvasRef}
            role="img"
            data-replay-clustering="screen-space"
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
          <span className="sr-only" aria-live="polite">
            {isPanning
              ? "Moving map."
              : inspectionEnabled
              ? `Paused. ${filteredSignals.length} markers can be inspected.`
              : "Inspection is off during playback. The signal list remains available for keyboard inspection."}
          </span>
          <span className="sr-only">Inspection is off during playback. The signal list remains available for keyboard inspection.</span>
          {mapInspection ? (
            <AdaptiveEvidencePreview
              model={inspectionEvidence}
              cluster={inspectionCluster}
              className="map-hover-card"
              style={{ left: mapInspection.left, top: mapInspection.top }}
            />
          ) : null}
          <div className="map-controls replay-google-map-controls" aria-label="Map controls" data-max-zoom="2000%" data-style="google-vertical">
            <div className="map-zoom-buttons" role="group" aria-label="Map zoom controls">
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= 20}
                onClick={() => adjustZoom(zoom + 0.5)}
              >+</button>
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= 0.5}
                onClick={() => adjustZoom(zoom - 0.5)}
              >−</button>
            </div>
            <div className="map-view-actions">
              <button
                type="button"
                aria-label="Reset map view"
                title="Reset map view"
                disabled={zoom === 1 && !hasPanned}
                onClick={resetMapView}
              ><ArrowCounterClockwise size={18} aria-hidden="true" /></button>
              <button
                type="button"
                aria-label={isMapFullscreen ? "Exit map fullscreen" : "Show map fullscreen"}
                title={isMapFullscreen ? "Exit map fullscreen" : "Show map fullscreen"}
                aria-pressed={isMapFullscreen}
                onClick={toggleMapFullscreen}
              >{isMapFullscreen ? <CornersIn size={18} aria-hidden="true" /> : <CornersOut size={18} aria-hidden="true" />}</button>
            </div>
          </div>
          {fullscreenMessage ? (
            <p className="map-fullscreen-message" role="status">{fullscreenMessage}</p>
          ) : null}
          <div className="map-key" data-map-legend="floating-card" aria-label="Movement map legend">
            <div className="map-key-grid">
              <span><i className="increase" />Increase</span>
              <span><i className="decrease" />Decrease</span>
              <span aria-label="Travel direction"><b className="direction-arrow-key" aria-hidden="true">↗</b>Direction</span>
              {showCoverage ? <span><i className="coverage" />Sensor coverage</span> : null}
            </div>
            <div className="map-cluster-key">
              <span data-cluster-state="grouped"><i>2</i>Grouped records</span>
              <span data-cluster-state="selected"><i>2</i>Selected group</span>
            </div>
          </div>
          {showBasemap ? (
            <div className="map-attribution" data-corner="bottom-right-before-controls">
              {OPERATIONAL_BASEMAP.attribution.map((item) => (
                <a key={item.href} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
              ))}
            </div>
          ) : <div className="map-attribution"><span>Basemap hidden</span></div>}
          {coverage.length === 0 && !error ? <p className="map-message">Loading countlines…</p> : null}
          {error ? <p className="map-message error" role="alert">{error}</p> : null}
        </div>
      </div>

      <AdaptiveEvidenceDrawer
        model={selectedEvidence}
        open={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        title="Signal evidence"
        className="evidence-column"
      >
        <TrendView signal={selected} visible={isEvidenceOpen} />

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
              <span className="signal-list-delta">
                <MovementDelta observed={Number(feature.properties.observed_count)} expected={Number(feature.properties.expected_count)} compact />
                <small>{Number(feature.properties.robust_z).toFixed(1)} z</small>
              </span>
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
      </AdaptiveEvidenceDrawer>
    </section>
  );
}
