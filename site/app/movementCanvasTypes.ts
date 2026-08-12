import type { SourceIconMode } from "./components/SourceIconPicker";

export type Coordinate = [number, number];
export type LineFeature = {
  id: string;
  geometry: { type: "LineString"; coordinates: Coordinate[] };
  properties: Record<string, unknown>;
};
export type FeatureCollection = { type: "FeatureCollection"; features: LineFeature[] };
export type MovementFilter = "all" | "people" | "vehicles";
export type ReplaySpeed = 0.5 | 1 | 2 | 4;
export type HistoryPoint = { observed_at: string; observed_count: number };
export type SignalConfidence = { level: string; history_samples: number; basis: string };
export type ReplaySignal = {
  id: string;
  countline_id: string;
  viewpoint_id: string;
  name: string;
  transport_class: string;
  direction: string;
  change_direction: "increase" | "decrease";
  observed_count: number;
  expected_count: number;
  robust_z: number;
  observed_at: string;
  matched_history: HistoryPoint[];
  signal_confidence: SignalConfidence;
};
export type ReplaySlot = {
  target_at: string;
  observed_groups: number;
  expected_groups: number;
  data_gap_groups: number;
  candidate_count: number;
  signals: ReplaySignal[];
};
export type ReplayPayload = {
  schema: "movement-replay/v1";
  available_from: string;
  available_to: string;
  default_target_at: string;
  data_as_of: string;
  publisher_cadence: string;
  slots: ReplaySlot[];
};
export type SourceLayer = {
  id: string;
  name: string;
  role: string;
  demo_data_status: string;
  access_status: string;
  operations_target: string;
  endpoint?: string | null;
  icon_mode?: SourceIconMode;
  custom_icon_data_url?: string | null;
  alert_eligible?: boolean;
  assigned_modules?: string[];
  record_origin?: "canonical" | "local_draft" | "local_override";
  canonical_name?: string;
  data_2026?: {
    status: string;
    active: boolean;
    record_state: string;
    verified_at: string;
  };
};
export type MapHitTarget = {
  id: string;
  x: number;
  y: number;
  radius: number;
  feature: LineFeature;
  features: LineFeature[];
  count: number;
};
export type MapInspection = {
  feature: LineFeature;
  features: LineFeature[];
  count: number;
  left: number;
  top: number;
};
export type ProjectedMovementMarker = {
  id: string;
  x: number;
  y: number;
  feature: LineFeature;
  selected: boolean;
  colour: string;
  direction: string;
  icon: "people" | "vehicle" | "custom";
};
export type MapDragState = {
  pointerId: number;
  last: Coordinate;
  distance: number;
  moved: boolean;
};
