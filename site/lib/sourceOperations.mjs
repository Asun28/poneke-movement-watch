export const OPERATIONS_TARGET_LABELS = {
  live_operations: "Live Operations",
  replay_analyzer: "Replay Analyzer",
  integration_only: "Integration only",
};

export function operationsTargetForConnectorMode(connectorMode) {
  if (connectorMode === "live") return "live_operations";
  if (connectorMode === "batch") return "replay_analyzer";
  return "integration_only";
}

export function operationsTargetLabel(target) {
  return OPERATIONS_TARGET_LABELS[target] ?? OPERATIONS_TARGET_LABELS.integration_only;
}
