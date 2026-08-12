import type { MapInspection, MovementFilter } from "./movementCanvasTypes";

export type ReplayUiState = {
  filter: MovementFilter;
  isPlaying: boolean;
  selectedSignalKey: string | null;
  isEvidenceOpen: boolean;
  mapInspection: MapInspection | null;
};

export type ReplayUiAction =
  | { type: "timeline_changed" }
  | { type: "filter_changed"; filter: MovementFilter }
  | { type: "sources_changed"; stopPlayback: boolean }
  | { type: "playing_changed"; isPlaying: boolean; clearEvidence?: boolean }
  | { type: "signal_selected"; signalKey: string | null; openEvidence?: boolean }
  | { type: "evidence_visibility_changed"; isOpen: boolean }
  | { type: "inspection_changed"; inspection: MapInspection | null };

export const INITIAL_REPLAY_UI_STATE: ReplayUiState = {
  filter: "all",
  isPlaying: false,
  selectedSignalKey: null,
  isEvidenceOpen: false,
  mapInspection: null,
};

function clearTransientState(state: ReplayUiState, stopPlayback: boolean): ReplayUiState {
  return {
    ...state,
    isPlaying: stopPlayback ? false : state.isPlaying,
    selectedSignalKey: null,
    isEvidenceOpen: false,
    mapInspection: null,
  };
}

export function replayUiReducer(state: ReplayUiState, action: ReplayUiAction): ReplayUiState {
  switch (action.type) {
    case "timeline_changed":
      return clearTransientState(state, true);
    case "filter_changed":
      return {
        ...clearTransientState(state, false),
        filter: action.filter,
      };
    case "sources_changed":
      return clearTransientState(state, action.stopPlayback);
    case "playing_changed":
      return action.clearEvidence
        ? {
            ...clearTransientState(state, false),
            isPlaying: action.isPlaying,
          }
        : { ...state, isPlaying: action.isPlaying };
    case "signal_selected":
      return {
        ...state,
        selectedSignalKey: action.signalKey,
        isEvidenceOpen: action.openEvidence ?? state.isEvidenceOpen,
      };
    case "evidence_visibility_changed":
      return { ...state, isEvidenceOpen: action.isOpen };
    case "inspection_changed":
      return { ...state, mapInspection: action.inspection };
  }
}
