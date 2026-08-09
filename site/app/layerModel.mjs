export const MOVEMENT_REPLAY_SOURCE_ID = "wcc-transport-sensors";

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

export function sourceLayerState(source) {
  const playable = source.id === MOVEMENT_REPLAY_SOURCE_ID
    && source.demo_data_status === "real_replay";
  return {
    truth_label: TRUTH_LABELS[source.demo_data_status] ?? "Unknown",
    access_label: ACCESS_LABELS[source.access_status] ?? "Access unknown",
    playable,
    record_label: playable ? "Playable history" : "0 playable records",
  };
}

export function canReplaySelectedSources(selectedSourceIds, sources) {
  return sources.some(
    (source) => selectedSourceIds.has(source.id) && sourceLayerState(source).playable,
  );
}

export function canInspectSelectedSources(isPlaying, selectedSourceIds, sources) {
  return !isPlaying && canReplaySelectedSources(selectedSourceIds, sources);
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
