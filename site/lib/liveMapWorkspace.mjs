export const LIVE_MAP_LAYERS = Object.freeze([
  { id: "review-evidence", label: "Review evidence", compact_label: "Review" },
  { id: "sensors-weather", label: "Sensors & weather", compact_label: "Weather" },
  { id: "warnings-hazards", label: "Warnings & hazards", compact_label: "Warnings" },
  { id: "access-impacts", label: "Access impacts", compact_label: "Access" },
  { id: "reports", label: "Reports", compact_label: "Reports" },
  { id: "other-live", label: "Other live", compact_label: "Other" },
]);

export function toggleLiveMapPanel(currentPanel, requestedPanel) {
  return currentPanel === requestedPanel ? null : requestedPanel;
}

export function liveMapHitRadius(visualRadius) {
  return Math.max(22, visualRadius + 7);
}

export const EVENT_SYMBOLS = Object.freeze({
  rain: { id: "rain", label: "Rain & weather", glyph: "☔", colour: "#1e6a8d", shape: "circle" },
  water: { id: "water", label: "Flood & water", glyph: "≈", colour: "#0c66a1", shape: "circle" },
  earthquake: { id: "earthquake", label: "Earthquake", glyph: "⌁", colour: "#8c3f67", shape: "circle" },
  warning: { id: "warning", label: "Official warning", glyph: "!", colour: "#c75845", shape: "triangle" },
  road: { id: "road", label: "Road & access", glyph: "↕", colour: "#b66500", shape: "square" },
  lifeline: { id: "lifeline", label: "Lifeline outage", glyph: "+", colour: "#7c4c00", shape: "square" },
  transit: { id: "transit", label: "Public transport", glyph: "▣", colour: "#6554c0", shape: "square" },
  flight: { id: "flight", label: "Flight", glyph: "✈︎", colour: "#0052cc", shape: "diamond" },
  cruise: { id: "cruise", label: "Cruise & ferry", glyph: "⌒", colour: "#007a78", shape: "diamond" },
  "city-event": { id: "city-event", label: "City event", glyph: "▦", colour: "#7b4d12", shape: "diamond" },
  report: { id: "report", label: "Community report", glyph: "⚑", colour: "#7a3e65", shape: "diamond" },
  people: { id: "people", label: "People movement", glyph: "P", colour: "#2d7a68", shape: "circle" },
  vehicle: { id: "vehicle", label: "Vehicle movement", glyph: "V", colour: "#173f4b", shape: "square" },
  other: { id: "other", label: "Other observation", glyph: "·", colour: "#52636b", shape: "diamond" },
});
const COMPACT_NUMBER_FORMAT = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 2 });

export function eventSymbolFor(observation = {}, source = {}) {
  const properties = observation.properties ?? {};
  const signal = [
    observation.source_id,
    observation.kind,
    source?.role,
    properties.event_type,
    properties.measurement,
    properties.transport_class,
  ].filter(Boolean).join(" ").toLowerCase();
  if (/(flight|airport|aviation)/.test(signal)) return EVENT_SYMBOLS.flight;
  if (/(cruise|ship|ferry|marine)/.test(signal)) return EVENT_SYMBOLS.cruise;
  if (/(calendar|city.event|eventfinda|festival|concert)/.test(signal)) return EVENT_SYMBOLS["city-event"];
  if (/(report|ticket|community)/.test(signal)) return EVENT_SYMBOLS.report;
  if (/(bus|metlink|transit|train|rail|gtfs|public.transport)/.test(signal)) return EVENT_SYMBOLS.transit;
  if (/(earthquake|quake|shaking|seismic)/.test(signal)) return EVENT_SYMBOLS.earthquake;
  if (/(rain|weather|storm)/.test(signal)) return EVENT_SYMBOLS.rain;
  if (/(sea.level|river|flow|flood|tsunami|coastal|water.height)/.test(signal)) return EVENT_SYMBOLS.water;
  if (/(warning|alert|cap|official.hazard)/.test(signal)) return EVENT_SYMBOLS.warning;
  if (/(electric|outage|lifeline|water.fault|telecom|grid)/.test(signal)) return EVENT_SYMBOLS.lifeline;
  if (/(road|access|closure|traffic|camera|highway)/.test(signal)) return EVENT_SYMBOLS.road;
  if (/(pedestrian|people)/.test(signal)) return EVENT_SYMBOLS.people;
  if (/(vehicle|car|movement)/.test(signal)) return EVENT_SYMBOLS.vehicle;
  return EVENT_SYMBOLS.other;
}

export function eventSymbolById(symbolId) {
  return EVENT_SYMBOLS[symbolId] ?? EVENT_SYMBOLS.other;
}

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
    liveObservationValue(observation),
    searchablePropertyValues(observation.properties),
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchablePropertyValues(value, depth = 0) {
  if (!value || depth > 2) return "";
  if (Array.isArray(value)) {
    return value.map((item) => searchablePropertyValues(item, depth + 1)).join(" ");
  }
  if (typeof value !== "object") return String(value);
  return Object.entries(value).map(([key, item]) => [
    key,
    humanise(key),
    searchablePropertyValues(item, depth + 1),
  ].join(" ")).join(" ");
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

export function clusterMapPoints(points, zoom, cellSize = 48, clusterBelowZoom = 1) {
  if (clusterBelowZoom <= 0 || zoom >= clusterBelowZoom) {
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
