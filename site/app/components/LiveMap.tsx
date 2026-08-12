"use client";
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The named WAI-ARIA application surface owns keyboard map navigation. */

import { useEffect, useMemo, useRef, useState } from "react";
import { buildAdaptiveEvidenceClusterModel, buildAdaptiveEvidenceModel } from "../../lib/adaptiveEvidence.mjs";
import { buildLiveMapCard, buildLiveMapClusterCard, clusterMapPoints, eventSymbolFor, liveMapHitRadius } from "../../lib/liveMapWorkspace.mjs";
import { OPERATIONAL_BASEMAP, operationalBasemapTileUrl } from "../../lib/operationalBasemap.mjs";
import { AdaptiveEvidencePreview } from "./AdaptiveEvidence";
import EventSymbolBadge from "./EventSymbolBadge";

type Coordinate = [number, number];
type Observation = {
  id: string;
  source_id: string;
  kind: string;
  observed_at: string | null;
  freshness_state?: string;
  evidence_weight?: number;
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown>;
};
type MapSource = { source_id: string; name: string };
type Hit = { observation: Observation; observations: Observation[]; x: number; y: number; radius: number; count: number };
type HoveredHit = Hit & { horizontal: "left" | "right"; vertical: "above" | "below" };
const EMPTY_IDS = new Set<string>();

const TILE_SIZE = 256;
const tileCache = new Map<string, HTMLImageElement>();
const failedTiles = new Set<string>();
const CITY_CORNERS: Coordinate[] = [[174.62, -41.39], [174.97, -41.16]];

function lonLatToWorld([longitude, latitude]: Coordinate): Coordinate {
  const limited = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const sine = Math.sin((limited * Math.PI) / 180);
  return [(longitude + 180) / 360, 0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)];
}

function observationAnchor(observation: Observation): Coordinate | null {
  const geometry = observation.geometry;
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates as Coordinate;
  if (geometry.type === "LineString") {
    const line = geometry.coordinates as Coordinate[];
    return line[Math.floor(line.length / 2)] ?? null;
  }
  if (geometry.type === "Polygon") {
    const ring = (geometry.coordinates as Coordinate[][])[0] ?? [];
    if (!ring.length) return null;
    return [
      ring.reduce((sum, [longitude]) => sum + longitude, 0) / ring.length,
      ring.reduce((sum, [, latitude]) => sum + latitude, 0) / ring.length,
    ];
  }
  return null;
}

function createViewport(width: number, height: number, zoom: number, pan: Coordinate) {
  const worlds = CITY_CORNERS.map(lonLatToWorld);
  const west = Math.min(...worlds.map(([x]) => x));
  const east = Math.max(...worlds.map(([x]) => x));
  const north = Math.min(...worlds.map(([, y]) => y));
  const south = Math.max(...worlds.map(([, y]) => y));
  const baseScale = Math.min((width - 56) / (east - west), (height - 56) / (south - north));
  const worldScale = baseScale * zoom;
  const center: Coordinate = [(west + east) / 2, (north + south) / 2];
  const projectWorld = ([x, y]: Coordinate): Coordinate => [
    width / 2 + pan[0] + (x - center[0]) * worldScale,
    height / 2 + pan[1] + (y - center[1]) * worldScale,
  ];
  return {
    center,
    worldScale,
    pan,
    tileZoom: Math.max(0, Math.min(19, Math.round(Math.log2(worldScale / TILE_SIZE)))),
    project: (coordinate: Coordinate) => projectWorld(lonLatToWorld(coordinate)),
    projectWorld,
  };
}

function drawTiles(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: ReturnType<typeof createViewport>,
  redraw: () => void,
) {
  const tileCount = 2 ** viewport.tileZoom;
  const left = viewport.center[0] + (-width / 2 - viewport.pan[0]) / viewport.worldScale;
  const right = viewport.center[0] + (width / 2 - viewport.pan[0]) / viewport.worldScale;
  const top = viewport.center[1] + (-height / 2 - viewport.pan[1]) / viewport.worldScale;
  const bottom = viewport.center[1] + (height / 2 - viewport.pan[1]) / viewport.worldScale;
  const tileSize = viewport.worldScale / tileCount;
  context.save();
  context.globalAlpha = 0.7;
  for (let y = Math.max(0, Math.floor(top * tileCount)); y <= Math.min(tileCount - 1, Math.floor(bottom * tileCount)); y += 1) {
    for (let x = Math.floor(left * tileCount); x <= Math.floor(right * tileCount); x += 1) {
      const wrappedX = ((x % tileCount) + tileCount) % tileCount;
      const key = `${viewport.tileZoom}/${wrappedX}/${y}`;
      const [screenX, screenY] = viewport.projectWorld([x / tileCount, y / tileCount]);
      const image = tileCache.get(key);
      if (image?.complete && image.naturalWidth > 0) {
        context.drawImage(image, screenX, screenY, tileSize + 1, tileSize + 1);
      } else if (!image && !failedTiles.has(key)) {
        const pending = new Image();
        pending.decoding = "async";
        pending.onload = redraw;
        pending.onerror = () => {
          tileCache.delete(key);
          failedTiles.add(key);
          redraw();
        };
        tileCache.set(key, pending);
        pending.src = operationalBasemapTileUrl({
          zoom: viewport.tileZoom,
          x: wrappedX,
          y,
          pixelRatio: window.devicePixelRatio || 1,
        });
      }
    }
  }
  context.restore();
  context.fillStyle = "rgba(246,249,250,.22)";
  context.fillRect(0, 0, width, height);
}

function drawMarker(context: CanvasRenderingContext2D, point: Coordinate, observation: Observation, selected: boolean, highlighted: boolean, markerScale: number) {
  const { colour, shape, glyph } = eventSymbolFor(observation);
  const radius = (selected ? 11 : 8) * markerScale;
  context.save();
  context.translate(point[0], point[1]);
  if (highlighted) {
    context.strokeStyle = "rgba(199,88,69,.92)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, radius + 7, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = "#f8fbfb";
  context.strokeStyle = selected ? "#102a33" : colour;
  context.lineWidth = selected ? 4 : 3;
  context.beginPath();
  if (shape === "triangle") {
    context.moveTo(0, -radius); context.lineTo(radius, radius); context.lineTo(-radius, radius); context.closePath();
  } else if (shape === "square") {
    context.rect(-radius, -radius, radius * 2, radius * 2);
  } else if (shape === "diamond") {
    context.moveTo(0, -radius); context.lineTo(radius, 0); context.lineTo(0, radius); context.lineTo(-radius, 0); context.closePath();
  } else {
    context.arc(0, 0, radius, 0, Math.PI * 2);
  }
  context.fill();
  context.stroke();
  context.fillStyle = colour;
  context.font = `800 ${Math.max(10, radius + 2)}px "Segoe UI Symbol", system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(glyph, 0, shape === "triangle" ? 2 : 0);
  context.restore();
  return radius;
}

function drawCluster(context: CanvasRenderingContext2D, point: Coordinate, count: number, highlighted: boolean) {
  const radius = Math.min(22, 13 + Math.log2(count) * 3);
  context.save();
  context.translate(point[0], point[1]);
  context.fillStyle = "#173f4b";
  context.strokeStyle = "rgba(255,255,255,.95)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  if (highlighted) {
    context.strokeStyle = "rgba(199,88,69,.92)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, radius + 5, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = "#fff";
  context.font = "700 12px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(count), 0, 0);
  context.restore();
  return radius;
}

function compactTimeLabel(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Pacific/Auckland",
  }).format(date);
}

export default function LiveMap({
  observations,
  sources = [],
  selectedId,
  highlightedIds = EMPTY_IDS,
  showBasemap = true,
  markerScale = 1,
  onSelect,
  adaptiveEvidenceContext,
}: {
  observations: Observation[];
  sources?: MapSource[];
  selectedId: string | null;
  highlightedIds?: Set<string>;
  showBasemap?: boolean;
  markerScale?: number;
  onSelect: (id: string) => void;
  adaptiveEvidenceContext?: { case_id: string; truth_label?: string };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<HTMLDivElement>(null);
  const markerButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const hitsRef = useRef<Hit[]>([]);
  const dragRef = useRef<{ pointerId: number; last: Coordinate; moved: boolean } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Coordinate>([0, 0]);
  const [revision, setRevision] = useState(0);
  const [hovered, setHovered] = useState<HoveredHit | null>(null);
  const [fullscreenError, setFullscreenError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keyboardIndex, setKeyboardIndex] = useState(0);
  const plottable = useMemo(() => observations.filter(observationAnchor), [observations]);
  const sourceById = useMemo(() => new Map(sources.map((source) => [source.source_id, source])), [sources]);
  const keyboardObservations = useMemo(() => [...plottable].sort((left, right) => {
    const [leftLongitude, leftLatitude] = observationAnchor(left) ?? [0, 0];
    const [rightLongitude, rightLatitude] = observationAnchor(right) ?? [0, 0];
    return rightLatitude - leftLatitude || leftLongitude - rightLongitude || left.id.localeCompare(right.id);
  }), [plottable]);
  const hoverCard = hovered
    ? hovered.count > 1
      ? buildLiveMapClusterCard(hovered.observations, sources)
      : buildLiveMapCard(hovered.observation, sourceById.get(hovered.observation.source_id))
    : null;
  const adaptiveHoverModel = hovered && adaptiveEvidenceContext && hovered.count === 1
    ? buildAdaptiveEvidenceModel(hovered.observation, {
      ...adaptiveEvidenceContext,
      source_label: sourceById.get(hovered.observation.source_id)?.name,
    })
    : null;
  const adaptiveHoverCluster = hovered && adaptiveEvidenceContext && hovered.count > 1
    ? buildAdaptiveEvidenceClusterModel(hovered.observations, adaptiveEvidenceContext)
    : null;
  const visibleSymbols = useMemo(() => {
    const symbols = new Map<string, ReturnType<typeof eventSymbolFor>>();
    for (const observation of plottable) {
      const symbol = eventSymbolFor(observation, sourceById.get(observation.source_id));
      symbols.set(symbol.id, symbol);
    }
    return [...symbols.values()];
  }, [plottable, sourceById]);

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, rect.width, rect.height);
      const viewport = createViewport(rect.width, rect.height, zoom, pan);
      if (showBasemap) drawTiles(context, rect.width, rect.height, viewport, () => setRevision((value) => value + 1));
      else {
        context.fillStyle = "#dce9eb";
        context.fillRect(0, 0, rect.width, rect.height);
      }
      const mapPoints = plottable.flatMap((observation) => {
        const anchor = observationAnchor(observation);
        if (!anchor) return [];
        const point = viewport.project(anchor);
        return [{ id: observation.id, x: point[0], y: point[1], observation }];
      });
      hitsRef.current = clusterMapPoints(mapPoints, zoom).map((cluster) => {
        const observation = cluster.points[0].observation;
        const selected = cluster.points.some((point) => point.observation.id === selectedId);
        const highlighted = cluster.points.some((point) => highlightedIds.has(point.observation.id));
        const radius = cluster.count > 1
          ? drawCluster(context, [cluster.x, cluster.y], cluster.count, highlighted)
          : drawMarker(context, [cluster.x, cluster.y], observation, selected, highlighted, markerScale);
        return {
          observation,
          observations: cluster.points.map((point) => point.observation),
          x: cluster.x,
          y: cluster.y,
          radius: liveMapHitRadius(radius),
          count: cluster.count,
        };
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [highlightedIds, markerScale, pan, plottable, revision, selectedId, showBasemap, zoom]);

  function localPoint(event: React.PointerEvent): Coordinate {
    const rect = event.currentTarget.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function nearest(point: Coordinate) {
    return hitsRef.current
      .map((hit) => ({ hit, distance: Math.hypot(hit.x - point[0], hit.y - point[1]) }))
      .filter(({ hit, distance }) => distance <= hit.radius)
      .sort((a, b) => a.distance - b.distance)[0]?.hit ?? null;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const point = localPoint(event);
    if (drag && drag.pointerId === event.pointerId) {
      const dx = point[0] - drag.last[0];
      const dy = point[1] - drag.last[1];
      drag.last = point;
      drag.moved ||= Math.hypot(dx, dy) > 2;
      setHovered(null);
      setPan(([x, y]) => [x + dx, y + dy]);
      return;
    }
    const hit = nearest(point);
    if (!hit) {
      setHovered((current) => current ? null : current);
      return;
    }
    const next: HoveredHit = {
      ...hit,
      horizontal: point[0] > event.currentTarget.clientWidth / 2 ? "left" : "right",
      vertical: point[1] > event.currentTarget.clientHeight / 2 ? "above" : "below",
    };
    setHovered((current) => (
      current?.observation.id === next.observation.id
      && current.count === next.count
      && current.horizontal === next.horizontal
      && current.vertical === next.vertical
        ? current
        : next
    ));
  }

  function focusKeyboardMarker(index: number) {
    if (!keyboardObservations.length) return;
    const nextIndex = (index + keyboardObservations.length) % keyboardObservations.length;
    const next = keyboardObservations[nextIndex];
    setKeyboardIndex(nextIndex);
    markerButtonRefs.current.get(next.id)?.focus();
  }

  function handleMapKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (["ArrowDown", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      focusKeyboardMarker(keyboardIndex + 1);
    } else if (["ArrowUp", "ArrowLeft"].includes(event.key)) {
      event.preventDefault();
      focusKeyboardMarker(keyboardIndex - 1);
    } else if (event.key === "Enter") {
      const current = keyboardObservations[keyboardIndex];
      if (current) {
        event.preventDefault();
        onSelect(current.id);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setHovered(null);
      interactionRef.current?.focus();
    }
  }

  async function toggleFullscreen() {
    try {
      setFullscreenError("");
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        const target = stageRef.current?.closest(".live-map-workspace") ?? stageRef.current;
        await target?.requestFullscreen();
      }
    } catch {
      setFullscreenError("Fullscreen is unavailable in this browser context.");
    }
  }

  return (
    <div className="ops-map-stage" ref={stageRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div
        ref={interactionRef}
        className="ops-map-interaction"
        role="application"
        tabIndex={0}
        aria-label="Interactive evidence map"
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter Escape"
        data-wheel-zoom="modifier-required"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setHovered(null);
          dragRef.current = { pointerId: event.pointerId, last: localPoint(event), moved: false };
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          dragRef.current = null;
          if (!drag?.moved) {
            const hit = nearest(localPoint(event));
            if (hit?.count > 1) setZoom((value) => Math.min(20, value * 1.8));
            else if (hit) onSelect(hit.observation.id);
          }
        }}
        onPointerCancel={() => { dragRef.current = null; }}
        onPointerLeave={() => setHovered(null)}
        onKeyDown={handleMapKeyDown}
        onWheel={(event) => {
          if (!event.ctrlKey && !event.metaKey) return;
          event.preventDefault();
          setZoom((value) => Math.max(0.7, Math.min(20, value + (event.deltaY < 0 ? 0.25 : -0.25))));
        }}
      />
      <ul className="ops-map-marker-list" aria-label="Map evidence markers">
        {keyboardObservations.map((observation, index) => {
          const card = adaptiveEvidenceContext
            ? buildAdaptiveEvidenceModel(observation, {
              ...adaptiveEvidenceContext,
              source_label: sourceById.get(observation.source_id)?.name,
            })
            : buildLiveMapCard(observation, sourceById.get(observation.source_id));
          const markerLabel = adaptiveEvidenceContext
            ? `${card.title}. ${card.preview_fields.map((field: { label: string; value: string }) => `${field.label} ${field.value}`).join(". ")}. ${card.source_label}.`
            : `${card.title}. ${card.value}. ${card.source}.`;
          return (
            <li key={observation.id}>
              <button
                ref={(element) => {
                  if (element) markerButtonRefs.current.set(observation.id, element);
                  else markerButtonRefs.current.delete(observation.id);
                }}
                type="button"
                data-map-marker-id={observation.id}
                tabIndex={index === keyboardIndex ? 0 : -1}
                aria-current={selectedId === observation.id ? "true" : undefined}
                aria-label={markerLabel}
                onFocus={() => setKeyboardIndex(index)}
                onKeyDown={handleMapKeyDown}
                onClick={() => onSelect(observation.id)}
              >{card.title}<span>{adaptiveEvidenceContext ? card.preview_fields[0]?.value : card.value}</span></button>
            </li>
          );
        })}
      </ul>
      <div className="ops-map-controls" aria-label="Map controls" data-max-zoom="2000%" data-style="google-vertical" data-corner="bottom-right">
        <div className="ops-map-zoom-controls" role="group" aria-label="Map zoom controls">
          <button type="button" aria-label="Zoom in" disabled={zoom >= 20} onClick={() => setZoom((value) => Math.min(20, value + 0.5))}>+</button>
          <button type="button" aria-label="Zoom out" disabled={zoom <= 0.7} onClick={() => setZoom((value) => Math.max(0.7, value - 0.5))}>−</button>
        </div>
        <button className="ops-map-fullscreen" type="button" aria-label={isFullscreen ? "Exit map fullscreen" : "Show map fullscreen"} aria-pressed={isFullscreen} title={isFullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
          <span className="ops-map-fullscreen-glyph" aria-hidden="true" />
        </button>
      </div>
      {hovered && adaptiveEvidenceContext ? (
        <AdaptiveEvidencePreview
          model={adaptiveHoverModel}
          cluster={adaptiveHoverCluster}
          className={`ops-map-hover is-${hovered.horizontal} is-${hovered.vertical} ${hovered.count > 1 ? "is-cluster" : "is-record"}`}
          style={{ left: hovered.x, top: hovered.y }}
        />
      ) : hovered && hoverCard ? (
        <div
          className={`ops-map-hover is-${hovered.horizontal} is-${hovered.vertical} ${hovered.count > 1 ? "is-cluster" : "is-record"}`}
          data-live-hover-card="compact-values"
          aria-hidden="true"
          style={{ left: hovered.x, top: hovered.y }}
        >
          {hovered.count > 1 ? (
            <>
              <header><strong>{hoverCard.title}</strong><span>{hovered.count}</span></header>
              <ul>
                {hoverCard.items.map((item: { title: string; value: string; source: string }, index: number) => (
                  <li key={`${index}:${item.source}:${item.title}`}>
                    <span><strong>{item.title}</strong><small>{item.source}</small></span>
                    <b>{item.value}</b>
                  </li>
                ))}
              </ul>
              {hoverCard.remaining > 0 && <footer>+{hoverCard.remaining}</footer>}
            </>
          ) : (
            <>
              <header><span className={`state-${hoverCard.state.toLowerCase().replaceAll(" ", "-")}`}>{hoverCard.state}</span><small>{hoverCard.evidence}</small></header>
              <strong className="ops-map-hover-title">{hoverCard.title}</strong>
              <dl>
                <div><dt>Value</dt><dd>{hoverCard.value}</dd></div>
                <div><dt>Source</dt><dd>{hoverCard.source}</dd></div>
                <div><dt>Observed</dt><dd>{compactTimeLabel(hoverCard.observed_at)}</dd></div>
              </dl>
            </>
          )}
        </div>
      ) : null}
      <div className="ops-map-legend" aria-label="Map symbol legend">
        {visibleSymbols.map((symbol) => <span key={symbol.id}><EventSymbolBadge symbolId={symbol.id} decorative />{symbol.label}</span>)}
      </div>
      <div className="ops-map-attribution" data-corner={adaptiveEvidenceContext ? "bottom-right-before-controls" : "bottom-left"}>
        {OPERATIONAL_BASEMAP.attribution.map((item) => (
          <a key={item.href} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
        ))}
      </div>
      {fullscreenError && <p className="ops-map-error" role="status">{fullscreenError}</p>}
    </div>
  );
}
