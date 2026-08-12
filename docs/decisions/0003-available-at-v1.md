# 0003 — Treat v1 `available_at` as unverifiable

**Status:** Accepted
**Scope:** Historical replay and leakage control

## Decision

The v1 WCC batch artifacts expose observation time, dataset `data_as_of` and
publisher cadence, but do not claim a record-level `available_at` time. They
must not be treated as proof that a record was available to operators at the
historical event time.

## Why

The public batch files provide hourly observation timestamps and a mutable
publisher refresh, not a durable per-record publication timestamp. Inventing
`available_at = observed_at` would create time leakage in backtests.

## Consequences

August is a batch replay. April movement outputs are retrospective context with
event-time evidence weight zero. A future operational ingestion service must
store publisher time when supplied, first-seen fetch time, source revision and
raw-object checksum before the records can pass `available_at <= as_of`.
