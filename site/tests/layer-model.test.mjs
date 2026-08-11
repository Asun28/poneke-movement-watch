import assert from "node:assert/strict";
import test from "node:test";
import * as viewportModel from "../app/layerModel.mjs";

import {
  canInspectSelectedSources,
  canReplaySelectedSources,
  clusterMovementMarkers,
  findNearestMapMarker,
  filterSourcesByOperationsTarget,
  playableSignalsForSources,
  sourceLayerState,
  sourceSelectionSummary,
  toggleSourceSelection,
} from "../app/layerModel.mjs";

const sources = [
  {
    id: "wcc-transport-sensors",
    demo_data_status: "real_replay",
    access_status: "public_free",
    operations_target: "replay_analyzer",
    data_2026: { status: "real_records" },
  },
  {
    id: "nema-cap-alerts",
    demo_data_status: "mock_preview",
    access_status: "permission_required",
    operations_target: "integration_only",
    data_2026: { status: "restricted_not_ingested" },
  },
  {
    id: "google-routes-api",
    demo_data_status: "mock_preview",
    access_status: "paid_key_required",
    operations_target: "integration_only",
    data_2026: { status: "paid_mock_only" },
  },
  {
    id: "geonet-quakes",
    name: "GeoNet earthquakes",
    role: "hazard_observation",
    demo_data_status: "registered_only",
    access_status: "public_free",
    operations_target: "live_operations",
    data_2026: { status: "available_not_ingested" },
  },
];
const signals = [{ id: "movement:1" }, { id: "movement:2" }];

test("toggles only the requested Replay source without mutating the current selection", () => {
  const current = new Set(["wcc-transport-sensors", "nema-cap-alerts"]);
  const removed = toggleSourceSelection(current, "wcc-transport-sensors");
  const restored = toggleSourceSelection(removed, "wcc-transport-sensors");

  assert.deepEqual([...current], ["wcc-transport-sensors", "nema-cap-alerts"]);
  assert.deepEqual([...removed], ["nema-cap-alerts"]);
  assert.deepEqual([...restored], ["nema-cap-alerts", "wcc-transport-sensors"]);
});

test("only a selected real-replay source can render and advance replay data", () => {
  assert.equal(canReplaySelectedSources(new Set(["nema-cap-alerts"]), sources), false);
  assert.deepEqual(
    playableSignalsForSources(signals, new Set(["nema-cap-alerts"]), sources),
    [],
  );

  const selected = new Set(["wcc-transport-sensors", "nema-cap-alerts"]);
  assert.equal(canReplaySelectedSources(selected, sources), true);
  assert.deepEqual(playableSignalsForSources(signals, selected, sources), signals);
  assert.deepEqual(sourceSelectionSummary(selected, sources), {
    selected_count: 2,
    playable_source_count: 1,
  });
});

test("mock permission and paid layers remain zero-record integration layers", () => {
  assert.deepEqual(sourceLayerState(sources[0]), {
    truth_label: "Real replay",
    access_label: "Public / free",
    playable: true,
    operations_label: "Replay Analyzer",
    record_label: "Playable history",
    year_label: "2026 real records",
  });
  assert.deepEqual(sourceLayerState(sources[1]), {
    truth_label: "Mock preview",
    access_label: "Needs permission",
    playable: false,
    operations_label: "Integration only",
    record_label: "0 playable records",
    year_label: "2026 restricted",
  });
  assert.deepEqual(sourceLayerState(sources[2]), {
    truth_label: "Mock preview",
    access_label: "Paid API",
    playable: false,
    operations_label: "Integration only",
    record_label: "0 playable records",
    year_label: "2026 paid / mock",
  });
});

test("separates replay, live and integration-only source labels before search", () => {
  assert.deepEqual(
    filterSourcesByOperationsTarget(sources, "replay_analyzer", "").map((source) => source.id),
    ["wcc-transport-sensors"],
  );
  assert.deepEqual(
    filterSourcesByOperationsTarget(sources, "live_operations", "geo").map((source) => source.id),
    ["geonet-quakes"],
  );
  assert.deepEqual(
    filterSourcesByOperationsTarget(sources, "integration_only", "google").map((source) => source.id),
    ["google-routes-api"],
  );
});

test("paused inspection is limited to a paused selected real-replay source", () => {
  assert.equal(
    canInspectSelectedSources(false, new Set(["wcc-transport-sensors"]), sources),
    true,
  );
  assert.equal(
    canInspectSelectedSources(true, new Set(["wcc-transport-sensors"]), sources),
    false,
  );
  assert.equal(
    canInspectSelectedSources(false, new Set(["nema-cap-alerts"]), sources),
    false,
  );
});

test("nearest visible marker wins only inside the bounded inspection radius", () => {
  const markers = [
    { id: "farther", x: 110, y: 105, radius: 8 },
    { id: "nearest", x: 103, y: 101, radius: 8 },
  ];

  assert.equal(findNearestMapMarker(markers, { x: 100, y: 100 }, 12)?.id, "nearest");
  assert.equal(findNearestMapMarker(markers, { x: 140, y: 140 }, 12), null);
  assert.equal(
    findNearestMapMarker([{ id: "cluster", x: 125, y: 100, radius: 28 }], { x: 100, y: 100 }, 12)?.id,
    "cluster",
  );
});

test("movement markers cluster at regional zoom and expand into individual signals", () => {
  const markers = [
    { id: "a", x: 100, y: 100, feature: { id: "a" } },
    { id: "b", x: 112, y: 108, feature: { id: "b" } },
    { id: "c", x: 250, y: 250, feature: { id: "c" } },
  ];

  const regional = clusterMovementMarkers(markers, 1, 48);
  const street = clusterMovementMarkers(markers, 4, 48);

  assert.deepEqual(regional.map((cluster) => cluster.count), [2, 1]);
  assert.deepEqual(regional[0].markers.map((marker) => marker.id), ["a", "b"]);
  assert.deepEqual(street.map((cluster) => cluster.count), [1, 1, 1]);
  assert.deepEqual(markers.map((marker) => [marker.x, marker.y]), [[100, 100], [112, 108], [250, 250]]);
});

test("continuous map zoom stays inside the 50 to 2000 percent operating range", () => {
  assert.equal(viewportModel.clampMapZoom?.(0.2), 0.5);
  assert.equal(viewportModel.clampMapZoom?.(3.37), 3.37);
  assert.equal(viewportModel.clampMapZoom?.(12), 12);
  assert.equal(viewportModel.clampMapZoom?.(25), 20);
});

test("movement difference indicator is signed and scales around a neutral centre", () => {
  assert.deepEqual(viewportModel.movementDifference?.(20, 0), {
    delta: 20,
    direction: "increase",
    signed_label: "+20",
    bar_percent: 50,
  });
  assert.deepEqual(viewportModel.movementDifference?.(15, 20), {
    delta: -5,
    direction: "decrease",
    signed_label: "−5",
    bar_percent: 12.5,
  });
  assert.deepEqual(viewportModel.movementDifference?.(20, 20), {
    delta: 0,
    direction: "steady",
    signed_label: "0",
    bar_percent: 0,
  });
});

test("map wheel input adjusts zoom in both directions without fixed button jumps", () => {
  assert.equal(viewportModel.zoomFromWheel?.(2, -120), 2.25);
  assert.equal(viewportModel.zoomFromWheel?.(2, 120), 1.75);
  assert.equal(viewportModel.zoomFromWheel?.(2, 0), 2);
});

test("anchored zoom keeps the pointed map region under the pointer", () => {
  assert.deepEqual(
    viewportModel.zoomPanOffsetAtPoint?.(
      [0, 0],
      1,
      2,
      [200, 150],
      [800, 600],
    ),
    [200, 150],
  );
  assert.deepEqual(
    viewportModel.zoomPanOffsetAtPoint?.(
      [30, -20],
      2,
      4,
      [300, 200],
      [800, 600],
    ),
    [160, 60],
  );
});

test("replay speed changes only the playback interval and fails closed to 1x", () => {
  assert.equal(viewportModel.replayIntervalMs?.(0.5), 1800);
  assert.equal(viewportModel.replayIntervalMs?.(1), 900);
  assert.equal(viewportModel.replayIntervalMs?.(2), 450);
  assert.equal(viewportModel.replayIntervalMs?.(4), 225);
  assert.equal(viewportModel.replayIntervalMs?.(99), 900);
});
