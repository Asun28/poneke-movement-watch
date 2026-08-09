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

## Source truth labels

All 24 registry entries describe real source products. Their demo records are
separately labelled:

| Label | Meaning in this build |
|---|---|
| `real_replay` | Official WCC Transport Sensor records are used in the replay |
| `mock_preview` | Synthetic capability example, always zero evidence weight |
| `registered_only` | Contract is documented but no record is used |

Access is independently labelled `public_free`, `key_required`,
`permission_required`, `publisher_clearance_required`,
`council_input_required`, or `paid_key_required`.

### Mock capability previews

- **NEMA EMA** — mock polygon overlap only. The public build omits the restricted
  endpoint and all alert data. Explicit NEMA/WCC permission is required.
- **Road closures, water jobs and electricity outages** — mock operational links;
  they do not confirm loss of access or service.
- **City events, airport flights and cruise calls** — mock demand context;
  a timetable is not evidence that an event or arrival occurred.
- **Google Routes and Places APIs** — mock traffic-aware duration and place
  accessibility only. The real services require an API key and billing. They
  have monthly free-usage caps, then usage pricing. Google map, attribution and
  caching rules apply; only `place_id` is treated as durable.

### Registered only

GWRC Hilltop, NZTA road events/TMS, MetService CAP, GeoNet quake/Tilde/Shaking,
WREMO hubs, WCC emergency routes/water tanks, Metlink realtime/static GTFS and
NEMA CDEM boundaries remain uncounted. They may affect a future case only when
time alignment, entity resolution, licensing and quality gates all pass.

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
- no social-media or unlicensed private traffic-provider records;
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
