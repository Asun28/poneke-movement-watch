# Findings — Phase 2 ontology and sources

## Ontology requirements extracted from the supplied brief

- Preserve the full chain: raw observation → resolved entity → evidence role → hypothesis → human decision → confirmed fact.
- The critical safety separation is `observation ≠ inference ≠ decision ≠ confirmed fact`.
- Evidence must support contradiction, neutrality, missing expected evidence, sensor reliability, temporal context, and downstream access consequences.
- Entity resolution must reconcile names, coordinates, source IDs, road segments, sensors, routes, communities, hubs, and infrastructure dependencies.
- Consequence and urgency matter independently from hypothesis support, but uncalibrated values must not be labelled probabilities.

## Current implementation baseline

- The repository currently publishes robust WCC Transport Sensor movement anomalies as WGS84 countline GeoJSON plus health/coverage feeds.
- The detector already distinguishes observed zero, missing rows, insufficient baseline, and investigation candidates.
- The UI correctly labels the source as a batch replay and does not infer an incident cause.
- The v1 builder emits only movement signals, health, and countline coverage. The clean extension point is a parallel `/cop/v2/` artifact set; changing v1 would break the existing shared-COP contract.
- The current site server-renders summary and endpoint links, while the map/evidence list hydrates from static GeoJSON. The ontology panel can remain server-rendered from a compact graph JSON and avoid new runtime state.
- Existing tests already execute the real CLI and rendered worker. New tests should extend these boundaries rather than assert source text or use mocks.
- Site copy currently describes only anonymous fixed sensors. The revised first viewport must describe a multi-source evidence graph while retaining `Batch replay` and the emergency-information disclaimer.
- The strongest existing corridor replay anchor is `Centennial Hwy road Northbound` (`countline_id=48038`, `viewpoint_id=7332`, approximately 174.81325/-41.24720): 502 cars observed versus 873.5 expected, robust-z -5.33. It aligns spatially with the ontology brief's northern-access scenario without renaming the real sensor.
- The ontology replay can add a clearly synthetic-format WCC slip ticket and archived/context observations around that real countline. Every fixture must be labelled replay/synthetic; no invented record can be presented as a live WCC ticket.

## External-source findings

- The supplied catalogue already contains the strongest ontology roles; expanding to unrelated commercial/social data is unnecessary.
- Candidate direct observations: WCC Transport Sensors movement counts; GWRC Hilltop rainfall/river telemetry; NZTA road events/warnings; MetService CAP warnings; GeoNet quakes/shaking.
- Candidate consequence/context entities: WCC emergency road-reopening segments, WREMO community emergency hubs, static landslide/flood layers, Wellington Electricity outages, and Wellington Water fault jobs.
- Metlink realtime would add stopped-bus evidence but requires a key. Treat it as a declared unavailable source, not fabricated evidence.
- The direct Wellington Water feed represents open work jobs rather than drainage level telemetry; it must not be relabelled as a high-water sensor.
- Static hazard layers and emergency routes describe susceptibility/impact context, not observations that an incident occurred.
- The smallest honest implementation is three adapters: WCC movement as weighted measurement, WCC `TICKET_DETAIL` as an unverified report, and NZTA TMS as unresolved non-spatial context. Hilltop, road events, CAP, GeoNet and static layers belong in the registry until a record is time-aligned to a case.
- All live/replay observations need temporal-alignment checks. Current feeds cannot silently corroborate the existing 6 August movement replay if their observation windows differ.
- Agent Reach/Exa verified the primary contracts: Hilltop supports WGS84 site lists and bounded time intervals; MetService and GeoNet expose CAP feeds; GWRC publishes live six-hour rainfall layers; the GW Emergencies service exposes hubs and slope-failure context.
- CAP is a recognised NZ all-hazards interchange format. CAP alerts can be authoritative observations of an alert being issued, but the alert still must not be rewritten as a confirmed local incident beyond its stated scope.

## Required hackathon input format

- The new format explicitly names two inputs: NZTA `TMS_Telemetry_Sites/FeatureServer/0/query` and WCC `TICKET_DETAIL` records.
- `TICKET_DETAIL` must be accepted with the supplied uppercase fields: IDs, address/location, WGS84 longitude/latitude, created/triaged/due/closed timestamps, status, service taxonomy, description, priority, group, requester, source, and tags.
- Allowed status vocabulary is `CLOSED`, `OPEN`, `PENDING`, `ENHANCEMENT`, `ACTIVE`, `UNKNOWN`; source channels are `Phone`, `FIXiT`, `Website`, and `Email`; priority is 1–4.
- High-value disruption categories include `Slips`, `Flooding`, `A landslip in a park`, `Road condition`, `Urgent road crew attendance`, `Detour of footpath or road`, `Report a fallen or dangerous tree`, stormwater/drainage/sewer faults, traffic-signal outages, and road/footpath obstructions.
- `REQUESTER_NAME` is present in the source format but is personal information. The public prototype must never serialize, log, display, hash, or place it in the evidence graph.
- Ticket rows are public reports/workflow observations, not confirmed incident facts. `CURRENT_STATUS=CLOSED` means the ticket workflow closed, not that the described event was verified or resolved.
- NZTA TMS is a source observation table with no trustworthy spatial join to WCC countlines in the current data. Preserve it as unresolved/corridor-text evidence unless an explicit crosswalk is supplied; do not invent coordinates.

## Model and UI decisions

- Do not train Logistic Regression, SVM or XGBoost classifiers without verified disruption labels. The prior chronological forecasting benchmark remains the detector selection evidence.
- Review units are deterministic and source-capped: measured movement can rank a hypothesis, an unverified real ticket can add limited weight, and a synthetic fixture always adds zero.
- The deployed case ledger retains the original civic map and adds four explicit states plus Supporting, Contradicting, Missing and Context/Excluded buckets.
- The real replay contains no contradictory observation. The UI says so directly instead of inventing a road-open record.
