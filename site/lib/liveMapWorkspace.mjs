export const LIVE_MAP_LAYERS = Object.freeze([
  { id: "review-evidence", label: "Review evidence" },
  { id: "sensors-weather", label: "Sensors & weather" },
  { id: "warnings-hazards", label: "Warnings & hazards" },
  { id: "access-impacts", label: "Access impacts" },
  { id: "reports", label: "Reports" },
  { id: "other-live", label: "Other live" },
]);

function searchableObservation(observation, source) {
  return [
    observation.id,
    observation.kind,
    observation.source_id,
    source?.name,
    source?.role,
    observation.properties?.headline,
    observation.properties?.name,
    observation.properties?.site_id,
    observation.properties?.locality,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function classifyLiveObservationLayers(observation, source, candidateEvidenceIds = new Set()) {
  const layers = [];
  if (candidateEvidenceIds.has(observation.id)) layers.push("review-evidence");

  const signal = `${observation.kind ?? ""} ${source?.role ?? ""}`.toLowerCase();
  const isReport = /(report|ticket|community)/.test(signal);
  const isAccess = /(access|road|closure|transport|outage|lifeline)/.test(signal);
  const isHazard = /(alert|warning|earthquake|quake|tsunami|shaking|official_hazard)/.test(signal);
  const isSensor = /(sensor|rain|river|sea_level|water.level|flow|weather|hazard_observation)/.test(signal);

  if (isReport) layers.push("reports");
  else if (isAccess) layers.push("access-impacts");
  else if (isHazard) layers.push("warnings-hazards");
  else if (isSensor) layers.push("sensors-weather");
  else layers.push("other-live");

  return layers;
}

export function filterLiveMapObservations({
  observations,
  sources,
  selectedSourceIds,
  activeLayerIds,
  candidateEvidenceIds,
  query = "",
}) {
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  const normalizedQuery = query.trim().toLowerCase();
  return observations.filter((observation) => {
    if (!selectedSourceIds.has(observation.source_id)) return false;
    const source = sourceById.get(observation.source_id);
    const layers = classifyLiveObservationLayers(observation, source, candidateEvidenceIds);
    if (!layers.some((layer) => activeLayerIds.has(layer))) return false;
    return !normalizedQuery || searchableObservation(observation, source).includes(normalizedQuery);
  });
}

export function clusterMapPoints(points, zoom, cellSize = 48) {
  if (zoom >= 3.5) {
    return points.map((point) => ({ id: point.id, x: point.x, y: point.y, count: 1, points: [point] }));
  }

  const buckets = new Map();
  for (const point of points) {
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(point);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()].map(([key, bucket]) => ({
    id: bucket.length === 1 ? bucket[0].id : `cluster:${key}`,
    x: bucket.reduce((sum, point) => sum + point.x, 0) / bucket.length,
    y: bucket.reduce((sum, point) => sum + point.y, 0) / bucket.length,
    count: bucket.length,
    points: bucket,
  }));
}
