import { MOVEMENT_REPLAY_SOURCE_ID } from "./layerModel.mjs";
import type { LineFeature, ReplaySignal } from "./movementCanvasTypes";

export const PEOPLE = new Set(["Pedestrian", "Cyclist", "E-scooter"]);

export function signalKey(feature: LineFeature) {
  return [
    feature.properties.countline_id,
    feature.properties.transport_class,
    feature.properties.direction,
  ].join(":");
}

export function replaySignalFeature(
  signal: ReplaySignal,
  coverageByCountline: Map<string, LineFeature>,
): LineFeature | null {
  const coverageFeature = coverageByCountline.get(signal.countline_id);
  if (!coverageFeature) return null;
  return {
    type: "Feature",
    id: signal.id,
    geometry: coverageFeature.geometry,
    properties: signal,
  } as LineFeature & { type: "Feature" };
}

export function movementEvidenceRecord(feature: LineFeature) {
  return {
    id: String(feature.id),
    source_id: MOVEMENT_REPLAY_SOURCE_ID,
    kind: "movement_outcome",
    observed_at: String(feature.properties.observed_at ?? ""),
    freshness_state: "real replay",
    properties: feature.properties,
  };
}

export function formatTimelineTick(value: string | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));
}
