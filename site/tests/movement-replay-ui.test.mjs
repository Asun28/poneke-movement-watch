import assert from "node:assert/strict";
import test from "node:test";

const ui = await import("../app/movementReplayUi.ts").catch(() => ({}));

const activeState = {
  filter: "all",
  isPlaying: true,
  selectedSignalKey: "signal:1",
  isEvidenceOpen: true,
  mapInspection: { id: "inspection:1" },
};

test("clears transient evidence and stops playback when the replay time changes", () => {
  assert.equal(typeof ui.replayUiReducer, "function");
  assert.deepEqual(ui.replayUiReducer(activeState, { type: "timeline_changed" }), {
    filter: "all",
    isPlaying: false,
    selectedSignalKey: null,
    isEvidenceOpen: false,
    mapInspection: null,
  });
});

test("changes a movement filter without silently stopping playback", () => {
  assert.deepEqual(ui.replayUiReducer(activeState, {
    type: "filter_changed",
    filter: "people",
  }), {
    filter: "people",
    isPlaying: true,
    selectedSignalKey: null,
    isEvidenceOpen: false,
    mapInspection: null,
  });
});

test("keeps source-change playback policy explicit while clearing stale evidence", () => {
  assert.deepEqual(ui.replayUiReducer(activeState, {
    type: "sources_changed",
    stopPlayback: false,
  }), {
    filter: "all",
    isPlaying: true,
    selectedSignalKey: null,
    isEvidenceOpen: false,
    mapInspection: null,
  });
  assert.equal(ui.replayUiReducer(activeState, {
    type: "sources_changed",
    stopPlayback: true,
  }).isPlaying, false);
});

test("opens evidence only for an explicit signal selection", () => {
  const selected = ui.replayUiReducer(ui.INITIAL_REPLAY_UI_STATE, {
    type: "signal_selected",
    signalKey: "signal:2",
    openEvidence: true,
  });
  assert.equal(selected.selectedSignalKey, "signal:2");
  assert.equal(selected.isEvidenceOpen, true);
});
