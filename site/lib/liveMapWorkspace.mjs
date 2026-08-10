export const LIVE_MAP_LAYERS = Object.freeze([
  { id: "review-evidence", label: "Review evidence" },
  { id: "sensors-weather", label: "Sensors & weather" },
  { id: "warnings-hazards", label: "Warnings & hazards" },
  { id: "access-impacts", label: "Access impacts" },
  { id: "reports", label: "Reports" },
  { id: "other-live", label: "Other live" },
]);
const COMPACT_NUMBER_FORMAT = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 2 });

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

function humanise(value) {
  return String(value ?? "").replaceAll("-", " ").replaceAll("_", " ").trim();
}

function capitalise(value) {
  const label = humanise(value);
  return label ? `${label[0].toUpperCase()}${label.slice(1)}` : "Unknown";
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function compactNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? COMPACT_NUMBER_FORMAT.format(number) : String(value);
}

function liveObservationTitle(observation) {
  return String(
    observation.properties?.headline
      ?? observation.properties?.name
      ?? observation.properties?.site_id
      ?? observation.properties?.locality
      ?? humanise(observation.kind),
  );
}

function liveObservationValue(observation) {
  const properties = observation.properties ?? {};
  const unit = hasValue(properties.unit) ? ` ${properties.unit}` : "";
  if (hasValue(properties.latest_rainfall)) {
    const latest = `${compactNumber(properties.latest_rainfall)}${unit}`;
    return hasValue(properties.rainfall_6h)
      ? `${latest} now · ${compactNumber(properties.rainfall_6h)}${unit} / 6h`
      : latest;
  }
  if (hasValue(properties.value)) return `${compactNumber(properties.value)}${unit}`;
  if (hasValue(properties.magnitude)) {
    return hasValue(properties.depth_km)
      ? `M${compactNumber(properties.magnitude)} · ${compactNumber(properties.depth_km)} km deep`
      : `M${compactNumber(properties.magnitude)}`;
  }
  if (hasValue(properties.status) || hasValue(properties.impact)) {
    return [properties.status, properties.impact].filter(hasValue).map(capitalise).join(" · ");
  }
  if (hasValue(properties.severity) || hasValue(properties.urgency)) {
    return [properties.severity, properties.urgency].filter(hasValue).map(capitalise).join(" · ");
  }
  if (hasValue(properties.event_type)) return capitalise(properties.event_type);
  if (hasValue(properties.direction)) return capitalise(properties.direction);
  if (typeof properties.offline === "boolean") return properties.offline ? "Offline" : "Online";
  return capitalise(observation.kind);
}

export function buildLiveMapCard(observation, source) {
  return {
    title: liveObservationTitle(observation),
    state: capitalise(observation.freshness_state),
    value: liveObservationValue(observation),
    source: String(source?.name ?? humanise(observation.source_id)),
    observed_at: observation.observed_at ?? null,
    evidence: `Weight ${hasValue(observation.evidence_weight) ? observation.evidence_weight : "—"}`,
  };
}

export function buildLiveMapClusterCard(observations, sources = []) {
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  return {
    title: `${observations.length} nearby records`,
    items: observations.slice(0, 3).map((observation) => {
      const card = buildLiveMapCard(observation, sourceById.get(observation.source_id));
      return { title: card.title, value: card.value, source: card.source };
    }),
    remaining: Math.max(0, observations.length - 3),
  };
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
