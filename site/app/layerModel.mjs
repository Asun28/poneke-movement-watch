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
