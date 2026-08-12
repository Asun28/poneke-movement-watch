# 0001 — Robust seasonal baseline before learned classifiers

**Status:** Accepted
**Scope:** Movement-candidate generation

## Decision

Compare each countline, transport class and direction with the median and MAD
of prior observations at the same weekday and hour. Require at least eight
matched observations and conservative absolute, relative and robust-score gates.

Do not use XGBoost, SVM or a learned fusion weight until multiple independent,
human-reviewed disruption and normal-control windows exist.

## Why

- The available observations are abundant, but verified incident labels are not.
- A chronological seasonal baseline is inspectable by an operator and resists
  single extreme historical counts.
- Random row splits would leak adjacent observations from the same event.
- The detector produces investigation candidates, not incident probabilities.

## Consequences

The model can miss non-seasonal structure and does not infer causes. Future
classifiers must beat this baseline on event-blocked held-out windows, publish
calibration evidence and retain the same human-decision boundary.
