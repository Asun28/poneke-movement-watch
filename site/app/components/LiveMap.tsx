"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clusterMapPoints } from "../../lib/liveMapWorkspace.mjs";

type Coordinate = [number, number];
type Observation = {
  id: string;
  source_id: string;
  kind: string;
  observed_at: string | null;
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown>;
};
type Hit = { observation: Observation; x: number; y: number; radius: number; count: number };
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
  context.globalAlpha = 0.8;
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
        pending.src = `https://tile.openstreetmap.org/${key}.png`;
      }
    }
  }
  context.restore();
  context.fillStyle = "rgba(232,240,241,.13)";
  context.fillRect(0, 0, width, height);
}

function markerStyle(kind: string) {
  if (kind.includes("alert")) return { colour: "#c75845", shape: "triangle" };
  if (kind.includes("earthquake")) return { colour: "#8c3f67", shape: "circle" };
  if (kind.includes("access") || kind.includes("road")) return { colour: "#d78916", shape: "square" };
  if (kind.includes("sea_level")) return { colour: "#1e6a8d", shape: "wave" };
  return { colour: "#2d7a68", shape: "diamond" };
}

function drawMarker(context: CanvasRenderingContext2D, point: Coordinate, kind: string, selected: boolean, highlighted: boolean) {
  const { colour, shape } = markerStyle(kind);
  const radius = selected ? 11 : 8;
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
  context.strokeStyle = colour;
  context.lineWidth = 2;
  context.beginPath();
  if (shape === "wave") {
    context.moveTo(-5, -2); context.quadraticCurveTo(-2, -6, 1, -2); context.quadraticCurveTo(4, 2, 6, -2);
    context.moveTo(-5, 4); context.quadraticCurveTo(-2, 0, 1, 4); context.quadraticCurveTo(4, 8, 6, 4);
  } else {
    context.moveTo(-3, 0); context.lineTo(3, 0);
  }
  context.stroke();
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

function observationLabel(observation: Observation) {
  return String(
    observation.properties.headline
      ?? observation.properties.name
      ?? observation.properties.site_id
      ?? observation.properties.locality
      ?? observation.kind.replaceAll("_", " "),
  );
}

export default function LiveMap({
  observations,
  selectedId,
  highlightedIds = EMPTY_IDS,
  onSelect,
}: {
  observations: Observation[];
  selectedId: string | null;
  highlightedIds?: Set<string>;
  onSelect: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hitsRef = useRef<Hit[]>([]);
  const dragRef = useRef<{ pointerId: number; last: Coordinate; moved: boolean } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Coordinate>([0, 0]);
  const [revision, setRevision] = useState(0);
  const [hovered, setHovered] = useState<Hit | null>(null);
  const [fullscreenError, setFullscreenError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const plottable = useMemo(() => observations.filter(observationAnchor), [observations]);

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
      drawTiles(context, rect.width, rect.height, viewport, () => setRevision((value) => value + 1));
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
          : drawMarker(context, [cluster.x, cluster.y], observation.kind, selected, highlighted);
        return { observation, x: cluster.x, y: cluster.y, radius: radius + 7, count: cluster.count };
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [highlightedIds, pan, plottable, revision, selectedId, zoom]);

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
      setPan(([x, y]) => [x + dx, y + dy]);
      return;
    }
    setHovered(nearest(point));
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
        className="ops-map-interaction"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { pointerId: event.pointerId, last: localPoint(event), moved: false };
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          dragRef.current = null;
          if (!drag?.moved) {
            const hit = nearest(localPoint(event));
            if (hit?.count > 1) setZoom((value) => Math.min(10, value * 1.8));
            else if (hit) onSelect(hit.observation.id);
          }
        }}
        onPointerCancel={() => { dragRef.current = null; }}
        onPointerLeave={() => setHovered(null)}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((value) => Math.max(0.7, Math.min(10, value + (event.deltaY < 0 ? 0.25 : -0.25))));
        }}
      />
      <div className="ops-map-controls" aria-label="Map controls" data-max-zoom="1000%" data-density="compact" data-corner="bottom-right">
        <button type="button" aria-label="Zoom out" disabled={zoom <= 0.7} onClick={() => setZoom((value) => Math.max(0.7, value - 0.5))}>−</button>
        <output>{Math.round(zoom * 100)}%</output>
        <button type="button" aria-label="Zoom in" disabled={zoom >= 10} onClick={() => setZoom((value) => Math.min(10, value + 0.5))}>+</button>
        <label><span className="sr-only">Map zoom level</span><input type="range" aria-label="Map zoom level" min="0.7" max="10" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.currentTarget.value))} /></label>
        <button type="button" aria-label="Reset map view" onClick={() => { setZoom(1); setPan([0, 0]); }}>Reset</button>
        <button type="button" aria-label={isFullscreen ? "Exit map fullscreen" : "Show map fullscreen"} onClick={toggleFullscreen}>{isFullscreen ? "Exit full screen" : "Full screen"}</button>
      </div>
      <div className="ops-map-status">
        <strong>Wellington</strong>
        <span>{plottable.length} records · Street labels · OpenStreetMap</span>
      </div>
      {hovered && (
        <div className="ops-map-hover" style={{ left: Math.min(hovered.x + 14, 520), top: Math.max(16, hovered.y - 32) }}>
          <strong>{hovered.count > 1 ? `${hovered.count} nearby records` : observationLabel(hovered.observation)}</strong>
          <span>{hovered.count > 1 ? "Select to zoom in" : hovered.observation.source_id.replaceAll("-", " ")}</span>
        </div>
      )}
      <div className="ops-map-legend" aria-label="Map symbol legend">
        <span><i className="alert" /> Alert</span>
        <span><i className="access" /> Access</span>
        <span><i className="hazard" /> Hazard</span>
        <span><i className="context" /> Context</span>
      </div>
      <a className="ops-map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
      {fullscreenError && <p className="ops-map-error" role="status">{fullscreenError}</p>}
    </div>
  );
}
