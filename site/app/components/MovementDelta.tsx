import { CSSProperties } from "react";
import { movementDifference } from "../layerModel.mjs";

export default function MovementDelta({
  observed,
  expected,
  compact = false,
}: {
  observed: number;
  expected: number;
  compact?: boolean;
}) {
  const difference = movementDifference(observed, expected);
  const label = `Difference from expected: ${difference.signed_label}; observed ${observed.toLocaleString("en-NZ")}; expected ${expected.toLocaleString("en-NZ", { maximumFractionDigits: 1 })}`;

  return (
    <div
      className={`movement-delta is-${difference.direction}${compact ? " is-compact" : ""}`}
      data-delta-direction={difference.direction}
      aria-label={label}
    >
      <strong>{difference.signed_label}</strong>
      <span
        className="movement-delta-track"
        style={{ "--delta-fill": `${difference.bar_percent}%` } as CSSProperties}
        aria-hidden="true"
      ><i /></span>
    </div>
  );
}
