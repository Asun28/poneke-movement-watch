"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Coordinate = [number, number];
type LineFeature = {
  id: string;
  geometry: { type: "LineString"; coordinates: Coordinate[] };
  properties: Record<string, string | number | Record<string, string | number>>;
};
type FeatureCollection = { type: "FeatureCollection"; features: LineFeature[] };
type Filter = "all" | "people" | "vehicles";

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
const tileCache = new Map<string, HTMLImageElement>();
const failedTiles = new Set<string>();

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
  onTileSettled: () => void,
) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const context = canvas.getContext("2d");
  if (!context || coverage.length === 0) return;
  context.scale(ratio, ratio);
  const width = rect.width;
  const height = rect.height;
  context.clearRect(0, 0, width, height);

  const coordinates = coverage.flatMap((feature) => feature.geometry.coordinates);
  const viewport = createViewport(coordinates, width, height, zoom);
  const project = viewport.project;
  drawStreetTiles(context, width, height, viewport, onTileSettled);

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
    context.lineWidth = isSelected ? 6 : 3.5;
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
    );
  }
}

function drawMovementMarker(
  context: CanvasRenderingContext2D,
  [x, y]: Coordinate,
  direction: string,
  isSelected: boolean,
  colour: string,
) {
  const radius = isSelected ? 13 : 10;
  context.fillStyle = "#F8FBFB";
  context.strokeStyle = isSelected ? "#102A33" : colour;
  context.lineWidth = isSelected ? 3 : 2;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  const normalisedDirection = direction.toUpperCase();
  const [vectorX, vectorY] = DIRECTION_VECTORS[normalisedDirection] ?? [1, 0];
  const arrowHalfLength = isSelected ? 7 : 5.5;
  const headX = x + vectorX * arrowHalfLength;
  const headY = y + vectorY * arrowHalfLength;
  const perpendicularX = -vectorY;
  const perpendicularY = vectorX;
  const headLength = isSelected ? 4 : 3.3;
  const headWidth = isSelected ? 3.3 : 2.7;

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

export default function MovementCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coverage, setCoverage] = useState<LineFeature[]>([]);
  const [signals, setSignals] = useState<LineFeature[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [zoom, setZoom] = useState(1);
  const [tileRevision, setTileRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/cop/v1/countline-coverage.geojson").then((response) => response.json()),
      fetch("/cop/v1/movement-signals.geojson").then((response) => response.json()),
    ])
      .then(([coverageData, signalData]: FeatureCollection[]) => {
        setCoverage(coverageData.features);
        setSignals(signalData.features);
        setSelectedId(signalData.features[0]?.id ?? null);
      })
      .catch(() => setError("The replay files could not be loaded. Check the COP feed."));
  }, []);

  const filteredSignals = useMemo(() => signals.filter((feature) => {
    const mode = String(feature.properties.transport_class);
    if (filter === "people") return PEOPLE.has(mode);
    if (filter === "vehicles") return !PEOPLE.has(mode);
    return true;
  }), [signals, filter]);

  const selected = signals.find((feature) => feature.id === selectedId) ?? filteredSignals[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animationFrame = 0;
    const render = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        drawMap(
          canvas,
          coverage,
          filteredSignals,
          selected?.id ?? null,
          zoom,
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
  }, [coverage, filteredSignals, selected, tileRevision, zoom]);

  return (
    <section className="investigation-frame" aria-labelledby="map-heading">
      <div className="map-column">
        <div className="map-toolbar">
          <div>
            <p className="eyebrow">12:00 · Thursday 6 August 2026</p>
            <h2 id="map-heading">Countline change field</h2>
          </div>
          <div className="filter-group" aria-label="Filter signals">
            {(["all", "people", "vehicles"] as Filter[]).map((value) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "active" : ""}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All" : value === "people" ? "People" : "Vehicles"}
              </button>
            ))}
          </div>
        </div>
        <div className="map-stage">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${filteredSignals.length} unusual movement changes across 414 WCC countlines on a real Wellington street basemap. Direction arrows show travel direction.`}
          />
          <div className="map-controls" aria-label="Map zoom controls">
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoom >= 4}
              onClick={() => setZoom((value) => Math.min(4, value + 0.5))}
            >+</button>
            <output aria-live="polite">{Math.round(zoom * 100)}% zoom</output>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoom <= 1}
              onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
            >−</button>
            <button
              type="button"
              aria-label="Reset map view"
              disabled={zoom === 1}
              onClick={() => setZoom(1)}
            >Reset</button>
          </div>
          <div className="map-key">
            <span><i className="increase" />Increase</span>
            <span><i className="decrease" />Decrease</span>
            <span aria-label="Travel direction"><b className="direction-arrow-key" aria-hidden="true">↗</b>Arrow shows travel direction</span>
            <span><i className="coverage" />Sensor coverage</span>
          </div>
          <div className="map-attribution">
            <span>Real Wellington street basemap</span>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              © OpenStreetMap contributors
            </a>
          </div>
          {coverage.length === 0 && !error ? <p className="map-message">Loading countlines…</p> : null}
          {error ? <p className="map-message error" role="alert">{error}</p> : null}
        </div>
        <p className="map-caption">
          Geometry is the WCC sensor countline itself. It does not imply the whole
          surrounding street or suburb changed. Sensor overlay remains available if
          map tiles cannot load.
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
              <div><dt>History</dt><dd>{Number((selected.properties.signal_confidence as Record<string, number>).history_samples)} matched hours</dd></div>
              <div><dt>Baseline strength</dt><dd>{String((selected.properties.signal_confidence as Record<string, string>).level)}</dd></div>
            </dl>
            <p className="evidence-note">No cause inferred. Check operational context before acting.</p>
          </div>
        ) : <p className="empty-evidence">Select a signal to inspect its evidence.</p>}

        <div className="signal-list" aria-label={`${filteredSignals.length} filtered signals`}>
          {filteredSignals.map((feature) => (
            <button
              type="button"
              key={feature.id}
              className={feature.id === selected?.id ? "selected" : ""}
              onClick={() => setSelectedId(feature.id)}
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
        </div>
      </aside>
    </section>
  );
}
