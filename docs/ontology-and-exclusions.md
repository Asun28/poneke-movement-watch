# Evidence ontology and exclusions

## Truth model

The v2 contract keeps four states separate:

| State | Meaning | May create the next state? |
|---|---|---|
| Observation | A measurement, report, warning or provider record | No |
| Inference | A review-ranked hypothesis supported by linked observations | No |
| Human decision | An authorised action recorded by a named role | Yes, by a person |
| Confirmed fact | A reviewed assertion with provenance | Becomes new evidence |

Missing evidence is uncertainty. It is never converted into contradicting
evidence. A closed ticket is workflow state, not proof that an incident was
confirmed or resolved.

## Implemented evidence inputs

1. **WCC Transport Sensors** — direct hourly pedestrian and vehicle counts,
   mapped with WCC countline coordinates. This replay is batch data, not live.
2. **WCC `TICKET_DETAIL`** — a strict adapter for the supplied field names,
   statuses, priorities, channels and taxonomy. Tickets remain unverified reports.
3. **NZTA TMS** — a strict adapter that preserves the provider site and start
   date but emits no geometry or corridor link without an explicit crosswalk.

The deployed replay uses a real WCC countline observation and a clearly marked
synthetic ticket-format fixture. The fixture has zero evidence weight.

## Registered but not counted in this replay

- Greater Wellington Hilltop observations;
- NZTA road events;
- MetService CAP warnings;
- GeoNet earthquakes;
- WREMO emergency hubs and WCC emergency routes as static context;
- Metlink realtime, which requires a key.

These sources may affect a case only when time alignment and entity resolution
are explicit. The source registry records their current availability and limits.

## Entity-resolution rules

Accepted links are exact identifiers, an explicit maintained crosswalk or a
documented spatial-near rule with distance and time bounds. Similar names do not
create a link. NZTA TMS remains unresolved because the table has no geometry and
no verified crosswalk to WCC countline IDs.

## Privacy boundary

At ticket ingestion, personal identity, street address, raw free text and
internal assignment are discarded from public outputs. They are not logged,
hashed, displayed or used by the evidence rank. Public output retains only the
ticket ID, coarse place label, source coordinates, taxonomy, channel, time and
workflow fields needed for review.

## Explicit exclusions

- no 111-call or private emergency data;
- no social-media or private traffic-provider inference;
- no invented coordinates or joins;
- no static hazard layer presented as an active incident;
- no automated dispatch, route closure, public warning or confirmation;
- no trained classifier until verified disruption labels exist;
- no uncalibrated score presented as incident likelihood.

## Build the v2 replay

```powershell
.\.venv\Scripts\python scripts\build_ontology_demo.py `
  --tickets artifacts\ontology-replay-ticket.json `
  --movement-signals site\public\cop\v1\movement-signals.geojson `
  --output-dir site\public\cop\v2 `
  --corridor-countline-id 48038
```

Outputs:

- `observations.geojson` — privacy-safe typed observations;
- `evidence-graph.json` — entity, evidence roles, hypothesis and decision state;
- `source-registry.json` — source access, role and time/entity limitations.
