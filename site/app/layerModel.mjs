import { operationsTargetLabel } from "../lib/sourceOperations.mjs";

export const MOVEMENT_REPLAY_SOURCE_ID = "wcc-transport-sensors";
const DEFAULT_REPLAY_INTERVAL_MS = 900;
const REPLAY_SPEEDS = new Set([0.5, 1, 2, 4]);

const ACCESS_LABELS = {
  public_free: "Public / free",
  permission_required: "Needs permission",
  council_input_required: "Council input",
  publisher_clearance_required: "Needs clearance",
  key_required: "API key",
  paid_key_required: "Paid API",
};

const TRUTH_LABELS = {
  real_replay: "Real replay",
  mock_preview: "Mock preview",
  registered_only: "Registered only",
};

const YEAR_2026_LABELS = {
  real_records: "2026 real records",
  available_not_ingested: "2026 feed available",
  available_context: "2026 context",
  planned_context: "2026 planned",
  static_context: "Static context",
  empty_activation: "Empty activation feed",
  credentials_required: "Credentials required",
  input_required: "Council input required",
  terms_review: "Terms review",
  restricted_not_ingested: "2026 restricted",
  paid_mock_only: "2026 paid / mock",
  stale_excluded: "Stale · excluded",
};

export function sourceLayerState(source) {
  const playable = source.id === MOVEMENT_REPLAY_SOURCE_ID
    && source.demo_data_status === "real_replay";
  return {
    truth_label: TRUTH_LABELS[source.demo_data_status] ?? "Unknown",
    access_label: ACCESS_LABELS[source.access_status] ?? "Access unknown",
    playable,
    operations_label: operationsTargetLabel(source.operations_target),
    record_label: playable ? "Playable history" : "0 playable records",
    year_label: YEAR_2026_LABELS[source.data_2026?.status] ?? "2026 state unknown",
  };
}

export function filterSourcesByOperationsTarget(sources, target, query) {
  const normalizedQuery = query.trim().toLowerCase();
  return sources.filter((source) => {
    const matchesTarget = target === "all" || source.operations_target === target;
    const haystack = `${source.name ?? ""} ${source.role ?? ""} ${source.id}`.toLowerCase();
    return matchesTarget && haystack.includes(normalizedQuery);
  });
}

export function canReplaySelectedSources(selectedSourceIds, sources) {
  return sources.some(
    (source) => selectedSourceIds.has(source.id) && sourceLayerState(source).playable,
  );
}

export function canInspectSelectedSources(isPlaying, selectedSourceIds, sources) {
  return !isPlaying && canReplaySelectedSources(selectedSourceIds, sources);
}

export function replayIntervalMs(speed) {
  const safeSpeed = REPLAY_SPEEDS.has(speed) ? speed : 1;
  return DEFAULT_REPLAY_INTERVAL_MS / safeSpeed;
}

export function findNearestMapMarker(markers, point, maxDistance) {
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const marker of markers) {
    const distance = Math.hypot(marker.x - point.x, marker.y - point.y);
    if (distance <= nearestDistance) {
      nearest = marker;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function clampMapZoom(value) {
  return Math.min(8, Math.max(0.5, value));
}

export function zoomFromWheel(currentZoom, deltaY) {
  if (deltaY === 0) return currentZoom;
  const direction = deltaY < 0 ? 1 : -1;
  const adjustment = Math.max(0.05, Math.min(0.5, Math.abs(deltaY) / 480));
  return clampMapZoom(Math.round((currentZoom + direction * adjustment) * 100) / 100);
}

export function zoomPanOffsetAtPoint(
  currentOffset,
  currentZoom,
  nextZoom,
  anchor,
  viewportSize,
) {
  const safeCurrentZoom = currentZoom > 0 ? currentZoom : 1;
  const ratio = nextZoom / safeCurrentZoom;
  const centerX = viewportSize[0] / 2;
  const centerY = viewportSize[1] / 2;
  return [
    ratio * currentOffset[0] + (1 - ratio) * (anchor[0] - centerX),
    ratio * currentOffset[1] + (1 - ratio) * (anchor[1] - centerY),
  ];
}

export function playableSignalsForSources(signals, selectedSourceIds, sources) {
  return canReplaySelectedSources(selectedSourceIds, sources) ? signals : [];
}

export function sourceSelectionSummary(selectedSourceIds, sources) {
  return {
    selected_count: sources.filter((source) => selectedSourceIds.has(source.id)).length,
    playable_source_count: sources.filter(
      (source) => selectedSourceIds.has(source.id) && sourceLayerState(source).playable,
    ).length,
  };
}
