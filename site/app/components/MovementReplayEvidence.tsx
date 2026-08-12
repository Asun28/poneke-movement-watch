"use client";

import { AdaptiveEvidenceDrawer, type AdaptiveEvidenceModel } from "./AdaptiveEvidence";
import MovementDelta from "./MovementDelta";
import MovementTrendView from "./MovementTrendView";
import { signalKey } from "../movementCanvasModel";
import type { LineFeature } from "../movementCanvasTypes";

type MovementReplayEvidenceProps = {
  filteredSignals: LineFeature[];
  isOpen: boolean;
  onClose: () => void;
  onSelectSignal: (signalKey: string) => void;
  replaySourceSelected: boolean;
  selected: LineFeature | undefined;
  selectedEvidence: AdaptiveEvidenceModel | null;
};

export default function MovementReplayEvidence({
  filteredSignals,
  isOpen,
  onClose,
  onSelectSignal,
  replaySourceSelected,
  selected,
  selectedEvidence,
}: MovementReplayEvidenceProps) {
  return (
    <AdaptiveEvidenceDrawer
      model={selectedEvidence}
      open={isOpen}
      onClose={onClose}
      title="Signal evidence"
      className="evidence-column"
    >
      <MovementTrendView signal={selected} visible={isOpen} />

      <div className="signal-list" aria-label={`${filteredSignals.length} filtered signals`}>
        {filteredSignals.map((feature) => (
          <button
            type="button"
            key={feature.id}
            className={feature.id === selected?.id ? "selected" : ""}
            onClick={() => onSelectSignal(signalKey(feature))}
          >
            <span>
              <strong>{String(feature.properties.name)}</strong>
              <small>{String(feature.properties.transport_class)} · {String(feature.properties.direction)}</small>
            </span>
            <span className="signal-list-delta">
              <MovementDelta observed={Number(feature.properties.observed_count)} expected={Number(feature.properties.expected_count)} compact />
              <small>{Number(feature.properties.robust_z).toFixed(1)} z</small>
            </span>
          </button>
        ))}
        {filteredSignals.length === 0 ? (
          <p className="empty-slot">
            {replaySourceSelected
              ? "No investigation signals in this hour and filter."
              : "No playable movement source is selected."}
          </p>
        ) : null}
      </div>
    </AdaptiveEvidenceDrawer>
  );
}
