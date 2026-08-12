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
   mapped with WCC countline coordinates. August and April movement outputs are
   batch/retrospective data, not live telemetry.
2. **GWRC Hilltop historical observations** — 10,098 official April case records
   across rainfall and river-flow series. They are bounded Replay evidence, not a
   claim that the same records were available to operators at event time.
3. **WCC `TICKET_DETAIL` simulator** — a strict mock adapter for the supplied
   field names, statuses, priorities, channels and taxonomy. It has no WCC
   connection, never sends and keeps tickets as unverified reports.
4. **NZTA TMS** — a strict adapter that preserves the provider site and start
   date but emits no geometry or corridor link without an explicit crosswalk.

The deployed replay uses a real WCC countline observation and a clearly marked
synthetic ticket-format fixture. The fixture has zero evidence weight.

## Source truth labels

All 33 registry entries describe real source products. Their demo records are
separately labelled:

| Label | Meaning in this build |
|---|---|
| `real_replay` | Official WCC Transport Sensor records are used in the replay |
| `mock_preview` | Synthetic capability example, always zero evidence weight |
| `registered_only` | Contract is documented but no record is used |

Live Simulation adds one runtime-only `mock_simulation` source. It is not a real
provider product, does not enter the 33-source registry and never becomes a COP
feed. Its deterministic frames carry evidence weight `0`, `alert_eligible: false`,
`training_use: excluded` and `external_write: false`.

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
- **Storm/flood Simulation** — browser-local exercise records for rain, surface
  water, movement, transit delay and reports. Its April percentage is reference
  similarity only, never incident likelihood, causal evidence or escalation.

### Registered only

The **live GWRC Hilltop contract**, NZTA road events/TMS, MetService CAP, GeoNet quake/Tilde/Shaking,
WREMO hubs, WCC emergency routes/water tanks, Metlink realtime/static GTFS and
NEMA CDEM boundaries remain uncounted. They may affect a future case only when
time alignment, entity resolution, licensing and quality gates all pass.

This live-contract state is distinct from the packaged April Replay files, which
contain official historical Hilltop observations with conservative cadence-derived
availability bounds.

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
- no Simulation frame, similarity score or mock report used as training,
  calibration, alert or confirmed-incident evidence.

## 2026 source-layer contract

The v3 ontology includes 33 `DataLayer` nodes. A layer node records publisher
role, access, current 2026 state and zero-safe evidence weight; it is not an
incident observation. Only the WCC movement replay currently contributes an
evidence weight inside this registry contract. Empty activation, credentials-required, restricted, paid,
terms-review, static/planned and stale-excluded states all remain explicit.

Eventfinda events are planned-demand context and require HTTP Basic credentials
issued for this application. No HTML scraping fallback is used. Metlink static
GTFS provides real network and schedule context; realtime bus service alerts,
trip updates, vehicle positions and stop predictions require an `x-api-key`.
Without keys, both contracts publish zero records and zero evidence.

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
