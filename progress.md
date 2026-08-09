# Progress — Phase 2 ontology and sources

- 2026-08-10: Started Phase 4 after the user requested a real map view. Selected
  an attributed OpenStreetMap basemap as the no-key default, with the existing
  grid retained only as a network-failure fallback. Evidence sources and weights
  remain unchanged.
- 2026-08-10: TDD RED confirmed: the rendered-site suite fails only because the
  real Wellington basemap label, OpenStreetMap attribution and tile-fallback
  explanation are not yet present (6 pass, 1 expected failure).
- 2026-08-10: TDD GREEN confirmed: the dependency-free Web Mercator tile layer,
  real-map label, attribution and fallback contract pass all seven rendered-site
  tests. Desktop browser verification shows loaded Wellington tiles with aligned
  WCC overlays and no runtime errors.
- 2026-08-10: Browser interaction check confirms Zoom in changes the real map
  view from 100% to 150% and correctly enables Zoom out and Reset.
- 2026-08-10: Mobile browser verification at 390 × 844 confirms the street map,
  anomaly overlay, legend and attribution remain legible. Reset restores 100%
  zoom and disables itself at the default view.
- 2026-08-10: Final local regression passes: 20 Python tests, seven rendered-site
  tests, production build and ESLint. The temporary preview and QA artifacts were
  removed after verification.

- 2026-08-09: Started Phase 3 to verify additional official open-source evidence
  feeds for the Wellington ontology, prioritising keyless, spatial and
  time-aligned contracts.
- 2026-08-09: Located the deterministic source-registry generator/tests and the
  local `wcc-emergency-gis-data` additional-source catalogue; launched parallel
  official-source research for mobility, lifelines and hazard/impact roles.
- 2026-08-09: Agent Reach/Exa confirmed the relevant official publisher surfaces;
  switched ArcGIS verification to direct JSON endpoints after the generic web
  extractor returned no page content.
- 2026-08-09: Directly verified NEMA CAP alerts and electricity outages,
  Wellington Water jobs, WCC road events/closures, and GeoNet Tilde WLGT sea
  level; recorded live counts, temporal fields, geometry and evidence limits.
- 2026-08-09: Verified Wellington Electricity's direct provider feed, NEMA CDEM
  authority polygons, WCC emergency water tanks and building footprints; added
  deduplication and privacy requirements for provider-level outage detail.
- 2026-08-09: Parallel research completed. Selected nine new registry contracts
  plus one GWRC enhancement; excluded publicly reachable NEMA EMA records after
  its official item licence proved restricted, and deferred weaker/fragile feeds.
- 2026-08-09: User expanded Phase 3 to include city events, plane timetables and
  cruise schedules; reopened source verification and assigned them planned-demand
  context rather than automatic disruption evidence.
- 2026-08-09: Agent Reach and direct checks verified the WCC Eventfinda-backed
  calendar, Wellington Airport JSON flight board and official CentrePort
  cruise/live-shipping pages; recorded licensing and schedule-vs-observation limits.
- 2026-08-09: User requested NEMA EMA in the WCC demo. Chosen safe contract:
  register its capability and restriction state, but omit its endpoint and data
  from the public site until explicit NEMA/WCC permission is confirmed.
- 2026-08-09: User authorised mock capability data and Google APIs provided every
  item is visibly classified. Added 24 official source contracts with independent
  `real_replay`/`mock_preview`/`registered_only` and access/cost labels. NEMA EMA,
  Google Routes and Google Places examples are synthetic and carry zero evidence weight.
- 2026-08-09: Added a responsive source-capability ledger to the demo. Focused
  ontology/CLI tests pass 7/7 and rendered-site tests pass 6/6.
- 2026-08-09: Final regression passes: Python 20/20, rendered site 6/6 and
  ESLint clean. Desktop and 390px mobile visual checks show legible truth labels,
  preserved map zoom controls and unchanged movement-direction arrows.

- 2026-08-09: Read the supplied ontology brief and extracted its epistemic-state, evidence, entity-resolution, and human-confirmation requirements.
- 2026-08-09: Loaded Agent Reach, planning-with-files, and TDD instructions. Created project-local planning files before source research or implementation.
- 2026-08-09: Confirmed the current branch is `codex/movement-anomaly-prototype` at commit `e84d08a`; the worktree was clean before this phase.
- 2026-08-09: Audited the current GeoJSON contract and the supplied live/additional-source catalogue. Shortlisted source roles and rejected mislabelling Wellington Water jobs as drainage telemetry or static hazard layers as incident observations.
- 2026-08-09: Agent Reach/Exa verified official Hilltop, CAP, GWRC rainfall, emergency-hub, and slope-failure interfaces.
- 2026-08-09: Parsed `hackathon_data_format.txt`. Added its NZTA TMS and exact WCC `TICKET_DETAIL` schema to scope, with a hard PII boundary excluding `REQUESTER_NAME` from every output.
- 2026-08-09: Inspected the real CLI, GeoJSON contract, Python integration tests, page, and rendered-worker tests. Chose a backward-compatible `/cop/v2/` ontology surface and real CLI/worker tests as the implementation boundary.
- 2026-08-09: Selected the real Centennial Highway movement anomaly as the ontology replay anchor; recorded its exact IDs, location, observed/expected counts, and truth-label requirements for any supplementary fixture.
- 2026-08-09: TDD RED verified. Five ontology/CLI tests fail for the intended missing behavior: ticket normalization/privacy, enum fail-closed behavior, missing-vs-contradicting evidence, source registry, and `/cop/v2/` artifact generation.
- 2026-08-09: TDD GREEN verified: seven focused Python tests pass for ticket/TMS normalisation, privacy, synthetic-fixture zero weight, missing evidence and v2 build artifacts.
- 2026-08-09: Added the server-rendered case ledger with four epistemic states and Supporting, Contradicting, Missing and Context/Excluded evidence buckets.
- 2026-08-09: Site build and four rendered-output/artifact tests pass. Existing v1 COP endpoints remain linked; v2 observations, graph and registry are published alongside them.
- 2026-08-09: Generated one project-bound ontology replay social card and added it as `site/public/og-ontology-v2.png`.
- 2026-08-09: Full verification passed: 20 Python tests, four rendered-site/artifact tests and ESLint.
- 2026-08-09: Rebuilt the downloadable whole-source ZIP, saved Sites version 2 from commit `238feaa`, and completed an owner-only production deployment at the existing live URL.
