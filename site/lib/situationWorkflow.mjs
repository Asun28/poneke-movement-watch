const PRIORITY_ORDER = Object.freeze({ P1: 0, P2: 1, P3: 2 });
const CLUSTER_WINDOW_MINUTES = 90;
const CLUSTER_DISTANCE_KM = 3;

function cleanText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 4000) : fallback;
}

function shortCode(value) {
  let hash = 2166136261;
  for (const character of cleanText(value, "unknown")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return String((hash >>> 0) % 10_000).padStart(4, "0");
}

function compactDate(value) {
  const direct = cleanText(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (direct) return `${direct[1]}${direct[2]}${direct[3]}`;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString().slice(0, 10).replaceAll("-", "")
    : "00000000";
}

function signalFamily(signal) {
  const reason = signal?.triage?.promotion_reason;
  if (["report_and_sensor", "sensor_anomaly"].includes(reason)) return "local_impact_change";
  if (reason === "natural_hazard_signal") return "natural_hazard";
  if (reason === "official_hazard_warning") return "official_hazard";
  return cleanText(signal?.rule_id, "other").split("-")[0];
}

function geometryAnchor(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates;
  if (geometry.type === "LineString") {
    return geometry.coordinates?.[Math.floor((geometry.coordinates?.length ?? 1) / 2)] ?? null;
  }
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates?.[0] ?? [];
    if (!ring.length) return null;
    return [
      ring.reduce((sum, coordinate) => sum + coordinate[0], 0) / ring.length,
      ring.reduce((sum, coordinate) => sum + coordinate[1], 0) / ring.length,
    ];
  }
  return null;
}

function distanceKm(first, second) {
  const a = geometryAnchor(first?.geometry);
  const b = geometryAnchor(second?.geometry);
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b[1] - a[1]);
  const longitudeDelta = radians(b[0] - a[0]);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function minutesApart(first, second) {
  const a = new Date(first?.observed_at).getTime();
  const b = new Date(second?.observed_at).getTime();
  return Number.isFinite(a) && Number.isFinite(b)
    ? Math.abs(a - b) / 60_000
    : Number.POSITIVE_INFINITY;
}

function compatible(first, second) {
  return signalFamily(first) === signalFamily(second)
    && minutesApart(first, second) <= CLUSTER_WINDOW_MINUTES
    && distanceKm(first, second) <= CLUSTER_DISTANCE_KM;
}

function situationGeometry(signals) {
  const anchors = signals.map((signal) => geometryAnchor(signal.geometry)).filter(Boolean);
  if (!anchors.length) return null;
  return {
    type: "Point",
    coordinates: [
      anchors.reduce((sum, coordinate) => sum + coordinate[0], 0) / anchors.length,
      anchors.reduce((sum, coordinate) => sum + coordinate[1], 0) / anchors.length,
    ],
  };
}

function evidenceLinks(situationId, signals) {
  const relationBuckets = [
    ["supporting", "supports"],
    ["contradicting", "contradicts"],
    ["missing", "missing"],
    ["context", "context"],
  ];
  const seen = new Set();
  return signals.flatMap((signal) => relationBuckets.flatMap(([bucket, relation]) => (
    Array.isArray(signal?.evidence?.[bucket]) ? signal.evidence[bucket].flatMap((evidenceId) => {
      const key = `${relation}:${evidenceId}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{
        schema: "wellington-evidence-link/v1",
        link_id: `evidence-link:${shortCode(`${situationId}:${key}`)}`,
        subject_id: situationId,
        evidence_id: cleanText(evidenceId),
        relation,
        source_signal_id: signal.id,
        epistemic_state: relation === "context" ? "context_only" : "unreviewed",
        reviewer_state: "unreviewed",
        causality: "not_inferred",
      }];
    }) : []
  )));
}

function gateFor(signals) {
  const reasonCodes = [];
  if (signals.some((signal) => signal?.triage?.priority === "P1")) reasonCodes.push("priority_p1");
  if (signals.some((signal) => signal?.authority_class === "emergency_service")) reasonCodes.push("authoritative_field_report");
  if (signals.some((signal) => signal?.life_safety === true)) reasonCodes.push("life_safety_risk");
  if (reasonCodes.length) {
    return { type: "hard", outcome: "urgent_human_review", reason_codes: reasonCodes, authority: "human_only" };
  }

  const hasReportSensor = signals.some((signal) => signal?.triage?.promotion_reason === "report_and_sensor");
  const independentSources = new Set(signals.map((signal) => signal.source_id).filter(Boolean)).size;
  if (hasReportSensor) reasonCodes.push("report_sensor_corroboration");
  if (independentSources >= 2) reasonCodes.push("multiple_independent_sources");
  if (reasonCodes.length) {
    return { type: "soft", outcome: "investigate", reason_codes: reasonCodes, authority: "human_only" };
  }
  return {
    type: "monitor",
    outcome: "continue_monitoring",
    reason_codes: ["insufficient_independent_evidence"],
    authority: "human_only",
  };
}

function buildSituation(signals) {
  const ordered = [...signals].sort((first, second) => (
    String(first.observed_at).localeCompare(String(second.observed_at))
    || String(first.id).localeCompare(String(second.id))
  ));
  const signalIds = ordered.map((signal) => signal.id);
  const canonicalId = `situation:${shortCode([...signalIds].sort().join("|"))}`;
  const gate = gateFor(ordered);
  const priority = [...ordered]
    .map((signal) => signal?.triage?.priority ?? "P3")
    .sort((first, second) => (PRIORITY_ORDER[first] ?? 9) - (PRIORITY_ORDER[second] ?? 9))[0] ?? "P3";
  const severity = [...ordered]
    .map((signal) => cleanText(signal.severity, "unassigned"))
    .sort((first, second) => {
      const rank = { extreme: 0, severe: 1, critical: 1, high: 2, moderate: 3, low: 4, unassigned: 9 };
      return (rank[first] ?? 8) - (rank[second] ?? 8);
    })[0];
  return {
    schema: "wellington-situation/v1",
    id: canonicalId,
    canonical_id: canonicalId,
    situation_ref: `SIT-${compactDate(ordered[0]?.observed_at)}-${shortCode(canonicalId)}`,
    title: cleanText(ordered[0]?.title, "Potential city disruption"),
    opened_at: ordered[0]?.observed_at ?? null,
    last_observed_at: ordered.at(-1)?.observed_at ?? null,
    created_at: ordered.at(-1)?.created_at ?? null,
    priority,
    severity,
    review_state: "unreviewed",
    decision_authority: "human",
    causality: "not_inferred",
    family: signalFamily(ordered[0]),
    geometry: situationGeometry(ordered),
    source_ids: [...new Set(ordered.map((signal) => signal.source_id).filter(Boolean))],
    signal_count: ordered.length,
    signal_ids: signalIds,
    signals: ordered,
    gate,
    non_escalation: gate.type === "monitor" ? {
      reason_code: "insufficient_independent_evidence",
      rationale: "One non-authoritative signal has no independent corroboration.",
    } : null,
    evidence_links: evidenceLinks(canonicalId, ordered),
    authority: {
      investigation: "human_only",
      incident_confirmation: "human_only",
      external_action: "not_authorised",
    },
  };
}

export function buildSituationClusters(candidatePack = {}) {
  const candidates = Array.isArray(candidatePack?.candidates)
    ? candidatePack.candidates.filter((candidate) => candidate?.id)
    : [];
  const clusters = [];
  for (const candidate of candidates) {
    const cluster = clusters.find((items) => items.some((member) => compatible(member, candidate)));
    if (cluster) cluster.push(candidate);
    else clusters.push([candidate]);
  }
  const situations = clusters.map(buildSituation).sort((first, second) => (
    (PRIORITY_ORDER[first.priority] ?? 9) - (PRIORITY_ORDER[second.priority] ?? 9)
    || String(second.last_observed_at).localeCompare(String(first.last_observed_at))
  ));
  return {
    schema: "wellington-situations/v1",
    generated_at: candidatePack?.generated_at ?? null,
    signal_count: candidates.length,
    situation_count: situations.length,
    grouping: {
      method: "deterministic_time_place_family",
      window_minutes: CLUSTER_WINDOW_MINUTES,
      distance_km: CLUSTER_DISTANCE_KM,
      causality: "not_inferred",
    },
    situations,
  };
}
