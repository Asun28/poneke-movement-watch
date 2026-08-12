# 0004 — Keep operational Simulation deterministic and zero-authority

**Status:** Accepted
**Scope:** Live Operations demonstration, saved-case comparison and model governance

## Decision

When real-time WCC movement telemetry is unavailable, demonstrate the temporal
workflow with a deterministic browser-local storm/flood scenario. Mark its source
and every record as Mock with evidence weight `0`, no alert eligibility, no
training use and no external write.

Compare a scenario stage with the saved April Storm only as missing-aware pattern
similarity over the domains present at that stage. Always expose comparison
coverage and link to Replay for human inspection. Do not present the result as a
forecast, incident probability, cause, classifier output or escalation decision.

## Why

Static mock markers cannot demonstrate how an operator follows changing evidence.
Relabelling monthly WCC movement batches as live would be false. A fixed scenario
provides a repeatable demo without contaminating live source health, historical
evidence or model evaluation.

## Consequences

- Simulation is a runtime-only source and not one of the 33 provider contracts.
- No Simulation record is published as a COP evidence feed or persisted as a case.
- The same scenario stage always produces the same values and map records.
- Similarity may help retrieve a saved investigation, but cannot create a Signal,
  Situation, Incident, ticket, warning or training label.
- Adding a real provider later requires a separate source contract and does not
  convert historical Simulation records into evidence.
