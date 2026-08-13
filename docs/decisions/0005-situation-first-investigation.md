# 0005 — Review Situations instead of raw Signals

**Status:** Accepted
**Scope:** Signal Review, WCC Ticket simulation, investigations and COP records

## Decision

Insert a deterministic `SituationCluster` between raw Signals and the human review queue. One queue row represents one Situation. Raw Signals remain available through progressive disclosure.

Every Situation carries an explicit hard, soft or monitor gate and a reason when it does not escalate. An Investigation Case may add typed `EvidenceLink`, `FieldTask`, `Decision` and append-only `COPVersion` records without changing the original source observations.

Keep WCC Ticket records separate from internal Situation and Case records. In the public demo, inbound/outbound WCC-shaped changes are simulator events only, carry zero evidence weight and are always labelled as no external write.

## Why

- A thousand sensor or provider records cannot become a thousand operator tickets.
- Nearby/time-aligned Signals may describe one review problem without proving one cause.
- Operators need a stable place to record missing evidence, field verification, decisions and changing COP state.
- WCC service records and emergency investigation records have different authority, lifecycle and data ownership.
- A visible “do not escalate” rationale is safer than silently dropping weak Signals.

## Consequences

- Situation grouping is deterministic, provenance-preserving and non-causal.
- Queue counts refer to Situations, while expanded counts refer to raw Signals.
- Closing a ticket or Case does not turn a hypothesis into a confirmed fact.
- Browser-local Case/COP records remain demo state, not a shared Council audit log or model-training label.
- Production integration requires authenticated server storage, roles, immutable history and authorised WCC interfaces.
- Any future clustering model must preserve original membership, expose uncertainty and pass the same human gate; it cannot autonomously merge incidents or dispatch work.
