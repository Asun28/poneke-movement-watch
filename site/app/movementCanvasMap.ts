import { operationalBasemapTileUrl } from "../lib/operationalBasemap.mjs";
import { movementIconDescriptor } from "../lib/replaySourceWorkspace.mjs";
import { clusterMovementMarkers } from "./layerModel.mjs";
import type {
  Coordinate,
  LineFeature,
  MapHitTarget,
  ProjectedMovementMarker,
  SourceLayer,
} from "./movementCanvasTypes";

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

export function drawMap(
  canvas: HTMLCanvasElement,
  coverage: LineFeature[],
  signals: LineFeature[],
  selectedId: string | null,
  zoom: number,
  clusterBelowZoom: number,
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
    context.strokeStyle = "rgba(35, 72, 83, 0.28)";
    context.fillStyle = "rgba(35, 72, 83, 0.42)";
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
  const clusters = clusterMovementMarkers(projectedMarkers, zoom, Math.max(48, symbolSize * 4), clusterBelowZoom);
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
