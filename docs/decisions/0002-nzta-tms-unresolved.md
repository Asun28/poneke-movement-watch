# 0002 — Keep NZTA TMS spatially unresolved

**Status:** Accepted
**Scope:** Source integration and map evidence

## Decision

Register NZTA TMS as movement context, but do not place its count rows on the
Wellington map or join them to WCC countlines without an explicit maintained
crosswalk.

## Why

- The inspected TMS telemetry table has no geometry.
- Its `siteID` values have no verified exact match to WCC `COUNTLINE_ID`.
- Similar site names or proximity guesses would fabricate provenance and could
  attach a state-highway count to the wrong street or direction.

## Consequences

NZTA TMS remains visible as an unresolved registered source and contributes no
mapped evidence. It may be activated only after NZTA/WCC provide geometry or a
versioned identifier crosswalk with reviewable provenance.
