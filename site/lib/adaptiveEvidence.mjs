const NUMBER_FORMAT = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 1 });

const ENTITY_LABELS = {
  movement: "Movement",
  rainfall: "Rain",
  river_flow: "River flow",
  observation: "Other",
};

function propertiesOf(record) {
  return record?.properties && typeof record.properties === "object" ? record.properties : record ?? {};
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value) {
  const number = finiteNumber(value);
  return number === null ? "—" : NUMBER_FORMAT.format(number);
}

function formatSigned(value, unit = "") {
  const number = finiteNumber(value);
  if (number === null) return "—";
  const sign = number > 0 ? "+" : number < 0 ? "−" : "±";
  return `${sign}${formatNumber(Math.abs(number))}${unit ? ` ${unit}` : ""}`;
}

function formatReplayTime(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Pacific/Auckland",
  }).format(date);
}

export function adaptiveEvidenceEntityType(record) {
  const properties = propertiesOf(record);
  const kind = String(record?.kind ?? "").toLowerCase();
  const measurement = String(properties.measurement ?? "").toLowerCase();
  if (kind.includes("movement") || properties.observed_count !== undefined || properties.expected_count !== undefined) {
    return "movement";
  }
  if (kind.includes("rain") || measurement.includes("rain")) return "rainfall";
  if (kind.includes("flow") || measurement.includes("flow") || measurement.includes("river")) return "river_flow";
  return "observation";
}

function movementModel(record, context) {
  const properties = propertiesOf(record);
  const observed = finiteNumber(properties.observed_count) ?? 0;
  const expected = finiteNumber(properties.expected_count) ?? 0;
  const change = observed - expected;
  const direction = String(properties.change_direction || (change > 0 ? "increase" : change < 0 ? "decrease" : "stable"));
  const history = finiteNumber(properties.signal_confidence?.history_samples)
    ?? finiteNumber(properties.history_samples)
    ?? 0;
  const confidence = String(properties.signal_confidence?.level ?? properties.baseline_confidence ?? "unknown");
  const previewFields = [
    { label: "Observed", value: formatNumber(observed) },
    { label: "Expected", value: formatNumber(expected) },
    { label: "Change", value: formatSigned(change) },
  ];
  return {
    record_id: String(record?.id ?? ""),
    case_id: context.case_id ?? null,
    entity_type: "movement",
    title: String(properties.name ?? "Movement sensor"),
    subtitle: [properties.transport_class, properties.direction].filter(Boolean).join(" · ") || "Movement",
    badge: { label: direction.charAt(0).toUpperCase() + direction.slice(1), tone: direction },
    preview_fields: previewFields,
    drawer_fields: [
      ...previewFields,
      { label: "Robust score", value: `${finiteNumber(properties.robust_z) === null ? "—" : Number(properties.robust_z).toFixed(1)} z` },
      { label: "History", value: `${formatNumber(history)} matched hours` },
      { label: "Baseline", value: confidence },
    ],
    source_label: context.source_label ?? String(record?.source_id ?? "Unknown source"),
    observed_at: formatReplayTime(record?.observed_at ?? properties.observed_at),
    available_at: formatReplayTime(properties.available_at),
    truth_label: context.truth_label ?? String(record?.freshness_state ?? "Replay record"),
    boundary: "No cause inferred. Check operational context before acting.",
  };
}

function sensorModel(record, context, entityType) {
  const properties = propertiesOf(record);
  const unit = String(properties.unit ?? "").trim();
  const detectorCandidate = Boolean(properties.detector_candidate);
  const reading = `${formatNumber(properties.value)}${unit ? ` ${unit}` : ""}`;
  const previewFields = [
    { label: "Reading", value: reading },
    { label: "Change", value: formatSigned(properties.change, unit) },
    { label: "Detector", value: detectorCandidate ? "Candidate" : "Reading" },
  ];
  return {
    record_id: String(record?.id ?? ""),
    case_id: context.case_id ?? null,
    entity_type: entityType,
    title: String(properties.name ?? (entityType === "rainfall" ? "Rain gauge" : "River gauge")),
    subtitle: entityType === "rainfall" ? "Rainfall" : "River flow",
    badge: {
      label: detectorCandidate ? "Candidate" : "Reading",
      tone: detectorCandidate ? "candidate" : entityType,
    },
    preview_fields: previewFields,
    drawer_fields: [
      ...previewFields,
      { label: "Observed", value: formatReplayTime(record?.observed_at ?? properties.observed_at) },
      { label: "Threshold", value: properties.detector_threshold == null ? "—" : `${formatNumber(properties.detector_threshold)}${unit ? ` ${unit}` : ""}` },
      { label: "Available", value: formatReplayTime(properties.available_at) },
    ],
    source_label: context.source_label ?? String(record?.source_id ?? "Unknown source"),
    observed_at: formatReplayTime(record?.observed_at ?? properties.observed_at),
    available_at: formatReplayTime(properties.available_at),
    truth_label: context.truth_label ?? String(record?.freshness_state ?? "Replay record"),
    boundary: detectorCandidate
      ? "Detector candidate for investigation; not a confirmed incident."
      : "Historical sensor reading; no incident inferred.",
  };
}

function observationModel(record, context) {
  const properties = propertiesOf(record);
  return {
    record_id: String(record?.id ?? ""),
    case_id: context.case_id ?? null,
    entity_type: "observation",
    title: String(properties.name ?? properties.title ?? "Evidence record"),
    subtitle: String(properties.category ?? record?.kind ?? "Observation"),
    badge: { label: "Evidence", tone: "observation" },
    preview_fields: [{ label: "Value", value: String(properties.value ?? properties.status ?? "Available") }],
    drawer_fields: [{ label: "Observed", value: formatReplayTime(record?.observed_at ?? properties.observed_at) }],
    source_label: context.source_label ?? String(record?.source_id ?? "Unknown source"),
    observed_at: formatReplayTime(record?.observed_at ?? properties.observed_at),
    available_at: formatReplayTime(properties.available_at),
    truth_label: context.truth_label ?? String(record?.freshness_state ?? "Replay record"),
    boundary: "Review the source record before using it in a case.",
  };
}

export function buildAdaptiveEvidenceModel(record, context = {}) {
  const entityType = adaptiveEvidenceEntityType(record);
  if (entityType === "movement") return movementModel(record, context);
  if (entityType === "rainfall" || entityType === "river_flow") return sensorModel(record, context, entityType);
  return observationModel(record, context);
}

export function buildAdaptiveEvidenceClusterModel(records, context = {}) {
  const counts = new Map();
  for (const record of records ?? []) {
    const entityType = adaptiveEvidenceEntityType(record);
    counts.set(entityType, (counts.get(entityType) ?? 0) + 1);
  }
  const order = ["movement", "rainfall", "river_flow", "observation"];
  const groups = order
    .filter((entityType) => counts.has(entityType))
    .map((entityType) => ({ entity_type: entityType, label: ENTITY_LABELS[entityType], count: counts.get(entityType) }));
  return {
    case_id: context.case_id ?? null,
    title: `${records?.length ?? 0} evidence records`,
    groups,
    action: "Zoom in to inspect",
  };
}
