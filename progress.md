# Progress — Phase 2 ontology and sources

## Phase 15 — concise day-to-day operator mode

- 2026-08-10: Started a cross-route copy and interaction audit. Locked the scope to visible prose reduction, direct click/select workflows and one optional Help surface while preserving all evidence and access safeguards.
- 2026-08-10: TDD RED is confirmed through the production build. Seven tests fail on the intended old behavior: repeated setup boundaries, long shared headings/footer, always-visible teaching copy, no closed Help, and no closed Advanced/Evidence menus; 28 unrelated tests remain green.
- 2026-08-10: GREEN passes 35/35 production-rendered, integration, replay and operator tests. All five daily modules now use closed Help, Integration/Replay technical content is closed by default, and Live/Alerts/Setup retain only actionable controls plus compact truth states.
- 2026-08-10: A focused RED test caught contradictory unsaved Setup copy. The static boundary now says “Browser draft”; only actual client state may say a draft was saved.
- 2026-08-10: Final local verification passes: 35/35 site tests with production build, ESLint, 22/22 Python tests and whitespace checks. Help/Advanced are closed by default, focus remains visible and all routine controls retain 44px touch targets.
- 2026-08-10: Published the verified concise operator interface to the existing owner-only Sites deployment. Phase 15 is complete.

---

- 2026-08-10: Phase 13 TDD RED confirmed in-process: the new integration-model
  test fails on the intentionally missing shared module after locking contracts
  for all 33 sources, partial failure, Mock zero-weight and review-only alerts.
- 2026-08-10: Completed WorldMonitor architecture audit at upstream commit
  `0fca203`; selected server-owned adapters/health/alerts, bounded concurrency,
  explicit freshness and versioned contracts while rejecting browser alert authority.
- 2026-08-10: Completed the literal 33-source adapter matrix. Selected 13
  connectable families, one empty activation feed and explicit Context, Key,
  Permission, Terms-review and Stale states with official-format fixture rules.
- 2026-08-10: Implemented the server-owned v1 Integration Contracts, Live
  Snapshot and Alert Candidates APIs. Ten permitted keyless adapters run with
  bounded timeouts; 14 gated products use official-shape zero-weight fixtures.
- 2026-08-10: Added Live Operations, Alert Centre, Replay Analyzer and Data
  Integration routes with shared responsive navigation. Live uses a real OSM
  canvas map with layer filters, pan, zoom, fullscreen and record inspection.
- 2026-08-10: Live verification at 11:48 NZST returned 61 normalized records and
  seven locally eligible review candidates (six NZTA road events, one approved
  WCC road closure). Non-local CAP, stale and Mock records were excluded.
- 2026-08-10: Phase 13 regression is green: 31 site/API/unit/rendered tests,
  22 Python tests, production build and ESLint. Next: save and deploy the exact
  verified source state to the existing owner-only Sites project.

- 2026-08-10: Started Phase 13 to separate a shared Data Integration Layer from
  the historical Replay Analyzer and add Live Operations plus an Alert Centre.
  Goal Graph authorises three parallel read-only audits; all source writes remain
  serialized in the main thread. Real/keyed/paid/restricted truth boundaries are
  explicit, and no deployment or credential activation is authorised.

- 2026-08-10: Started Phase 12 for zoomed-map selection and UI/UX polish.
  Audited the dirty worktree without changing prior Phase 11 files. Root cause:
  zoom is fixed-centre with no pan, while the map interaction layer is hover-only.
  Selected a redesign-preserve pass with no new dependency or data-semantic change.
- 2026-08-10: Phase 12 RED verified through the production build. Exactly two
  intended tests fail: anchored zoom math is absent and the rendered map has no
  hover/click/drag selection guidance. Eighteen unrelated site tests remain green.
- 2026-08-10: Phase 12 GREEN passes 20/20 through the production build. Added
  cursor-anchored wheel zoom, ref-driven drag pan, click-to-select, drag click
  suppression and reset of zoom plus position. UI polish tightens the intro and
  map hierarchy, enlarges the map work area, clarifies controls and extends
  focus-visible states without changing data or ontology behavior.
- 2026-08-10: Real in-app-browser verification has started against the local
  production-shaped page on port 3013. The accessible DOM confirms the new map
  guidance, selectable overlay, controls, evidence panel and 33-source truth
  labels are present without changing replay semantics.
- 2026-08-10: Desktop interaction check verified wheel zoom from 100% to 150%
  at the pointer location and confirmed Reset becomes available.
- 2026-08-10: Desktop drag check verified real map panning at 150%. Continuing
  with a precise marker-hit probe and mobile layout verification.
- 2026-08-10: The real zoomed selection path is now verified. At 150%, clicking
  a visible marker changed the selected evidence from Thorndon Quay road to Ara
  Moana left.
- 2026-08-10: Desktop console is clean. Responsive QA is using a temporary
  390×844 viewport override and will restore the normal viewport afterward.
- 2026-08-10: Mobile QA passed at 390×844 with the layer rail expanded and
  collapsed. No horizontal overflow or browser errors were observed; replay,
  map, zoom, inspection and fullscreen controls remain usable.
- 2026-08-10: Phase 12 verification is complete. Site production build and all
  20 site tests pass; site lint passes; all 22 Python tests pass; repository
  diff whitespace checks pass. The temporary browser viewport was restored,
  browser tabs were finalized and the local port 3013 preview was stopped.


- 2026-08-10: Started Phase 11 after the user requested all available 2026 data
  layers be fed into the ontology. The safe default is a source-layer ontology:
  permitted 2026 records may be real, activation feeds may be explicitly empty,
  static/planned layers remain context, and restricted/key/paid/terms-review
  capabilities remain zero-weight and unfetched.
- 2026-08-10: User added Eventfinda events and Metlink bus disruption/delay data.
  Added them to the Phase 11 contract: events are planned-demand context, static
  GTFS is real network/schedule context, and GTFS-RT service alerts/trip updates
  require the documented key and remain `not_configured` without one.
- 2026-08-10: Added Phase 11 RED tests for 33 source contracts, typed 2026
  `DataLayer` nodes, Eventfinda credentials, Metlink bus alert/trip-update/
  vehicle/stop-prediction endpoints, zero-weight access states and visible layer
  labels. Direct Node execution hit the known sandbox worker `EPERM`, so site
  RED verification will use the approved repository test command.
- 2026-08-10: Python RED verified the intended missing behavior: the city graph
  has 0 `DataLayer` nodes instead of 33 and the registry has 24 sources instead
  of 33. The CLI fixture also hit the known default-temp permission boundary;
  later runs will use an explicit writable base directory.
- 2026-08-10: Site RED verified all intended missing behavior through the real
  build: no 2026 year label, still 24 rather than 33 source layers, and no 2026
  ontology register/Eventfinda/Metlink bus-delay UI. Thirteen unrelated site
  tests remained green.
- 2026-08-10: Python GREEN for the core contract: registry expanded to 33,
  every source has an explicit 2026 state, the v3 graph adds 33 zero-safe
  `DataLayer` nodes plus typed `sourced_from`/`describes` relations, Eventfinda
  is credentials-gated, and Metlink bus alerts/trip updates/vehicles/predictions
  are declared without embedding a key. Seven focused ontology tests pass.
- 2026-08-10: Site GREEN passes 18/18 through the production build. The layer
  workspace now exposes 33 contracts with 2026 state labels, the v3 explorer
  renders all 33 typed data layers, Eventfinda and Metlink bus delay/disruption
  contracts are visible, and only WCC Transport Sensors remains playable.
- 2026-08-10: User added adjustable replay speed to Phase 11. Implemented
  `0.5×`, `1×`, `2×`, `4×` with `1×` as the 900 ms default. The timer is the
  only changed behavior; the current slot, source filters and evidence persist.
- 2026-08-10: Final verification passes: 22/22 Python tests, 19/19 site tests,
  production build, ESLint and `git diff --check`. Browser QA confirmed the
  control starts at `1×`, `4×` advanced 12:00→15:00, live switching from
  `0.5×` to `4×` preserved 15:00 before advancing to 16:00, and logged no
  runtime errors. Phase 11 is complete locally; no production deploy was made.

---

- 2026-08-10: Started Phase 10 to inventory official data sources not already
  present in the 24-source registry. Scope is research and ranking only; no
  records, layers or deployment changes are authorised.
- 2026-08-10: Agent Reach's main executable was unavailable, so research moved
  to its documented Exa/mcporter route plus official publisher verification.
- 2026-08-10: Completed the official WCC, GWRC, NZTA, NEMA, FENZ, LINZ,
  Transpower, KiwiRail and lifeline-source sweep. Direct checks captured counts,
  fields, dates, geometry, freshness and access limits for the priority feeds.
- 2026-08-10: Deduplicated 53 remaining source groups against the current 24 and
  documented eight connect-next candidates, permission/key/terms-review items,
  context layers, existing-source extensions, optional corroborators and hard
  exclusions in `docs/remaining-data-sources.md`. No registry, layer, app or
  deployment files were changed.

---

- 2026-08-10: Started Phase 9 for continuous map zoom and map-only fullscreen.
  Restored the clean deployed state and audited the existing projection,
  transparent inspection layer and fixed-step controls.
- 2026-08-10: TDD RED confirmed: two pure zoom tests fail because bounded
  continuous/wheel behavior is absent, and one rendered test fails because the
  slider, wheel guidance and fullscreen control are absent. All prior tests pass.
- 2026-08-10: TDD GREEN confirmed: all 18 site/layer tests pass with bounded
  50%–800% zoom, smooth wheel/trackpad changes, a continuous slider, retained
  step/reset controls and a map-only fullscreen toggle. ESLint is clean.
- 2026-08-10: Final local regression passes: 22 Python tests, 18 site/layer
  tests, production build, ESLint and whitespace checks. The verified pytest
  temporary directory was removed.
- 2026-08-10: Pushed the exact feature source, saved Sites version 11 and
  completed the owner-only production deployment at the existing live URL.
  Phase 9 is complete.

---

- 2026-08-10: Started Phase 8 for a paused map inspection overlay. Restored the
  clean Phase 7 deployment and audited the canvas draw/replay/layer state.
- 2026-08-10: TDD RED confirmed: the pure suite lacked paused-source eligibility
  and nearest-marker hit testing, while the rendered suite lacked the overlay
  and its pause/keyboard boundary copy.
- 2026-08-10: TDD GREEN confirmed: 15 site/layer tests pass after adding retained
  visible-marker coordinates, bounded nearest-marker inspection and a compact
  truthful summary. Playback, time, filter, zoom and source changes clear it.
- 2026-08-10: ESLint and whitespace checks pass; README now documents paused
  pointer inspection and the signal-list keyboard alternative.
- 2026-08-10: Final local regression passes: 22 Python tests, 15 site/layer
  tests, production build, ESLint and whitespace checks. The verified pytest
  temporary directory was removed.
- 2026-08-10: Pushed the exact feature source, saved Sites version 10 and
  completed the owner-only production deployment at the existing live URL.
  Phase 8 is complete.

---

- 2026-08-10: Started Phase 7 before publishing Phase 6 after the user added a
  collapsible left layer rail, per-source selection, selected-data-only replay
  and neutral symbol sizing. The existing registry remains the only source set.
- 2026-08-10: TDD RED confirmed. The new pure layer-policy test fails because
  `layerModel.mjs` is absent; the rendered suite has one expected failure for
  the missing left rail and per-source controls. Existing tests remain green.
- 2026-08-10: Implemented the pure layer policy, collapsible rail, 24 source
  layers, map/coverage toggles, selected-source replay gating and symbol sizing.
  The first GREEN run passed all new tests and found one copy regression in the
  existing tile-fallback contract; restored that sentence before rerunning.
- 2026-08-10: All 12 site tests passed. The first lint run then identified four
  accessibility/state-pattern errors; added explicit checkbox associations and
  moved playback stopping into the user actions that remove the real layer.
- 2026-08-10: ESLint is clean after adding explicit accessible names. Documented
  the source-layer boundary: selection represents integration intent, while
  only real adapter records can render or play.
- 2026-08-10: Final Phase 7 regression passes: 22 Python tests, 12 site/layer
  tests, production build and ESLint. The final pytest temporary directory was
  removed after verification.
- 2026-08-10: Pushed the exact verified source, saved Sites version 9 and
  completed the owner-only production deployment at the existing live URL.
  Phases 6 and 7 are complete.

- 2026-08-10: Started Phase 6 to add a Wellington city ontology explorer. The
  chosen boundary is a backward-compatible v3 semantic graph built only from
  the existing replay case: place, infrastructure, time, movement state,
  potential impact and explicitly unknown access state.
- 2026-08-10: Audited the generator, CLI, v2 artifact, case ledger, page and
  rendered tests. Confirmed the explicit countline crosswalk is the safe reuse
  point and a separate v3 projection will not break existing COP consumers.
- 2026-08-10: Added Phase 6 contract tests first. Corrected the first Python RED
  from collection-time import failure to an intentional missing-API failure.
- 2026-08-10: TDD RED confirmed. The focused Python test fails because
  `build_city_ontology` does not exist; the site suite has eight passes and one
  expected failure because the v3 artifact/explorer is not yet implemented.
- 2026-08-10: Python TDD GREEN confirmed outside the sandbox after Windows
  blocked pytest temporary-directory cleanup inside it: all eight focused
  ontology/CLI tests pass. Generated the real v3 graph with eight typed nodes.
- 2026-08-10: Implemented the server-rendered semantic rail, visible inference
  and unknown-access guardrails, v3 endpoint handoff and README examples. All
  nine rendered-site/artifact tests now pass with the production build.
- 2026-08-10: The first full Python regression command selected system Python
  and stopped at collection because pandas is absent there. Focused Phase 6
  tests remain green; next run uses the project's existing environment.
- 2026-08-10: Final local regression passes using the project environment: 22
  Python tests, nine rendered site/artifact tests, production build and ESLint.
  All temporary pytest directories were removed after verification.

- 2026-08-10: Started Phase 5 for historical date/hour replay and a trend data
  view. Restored the clean deployed state, loaded the Sites, TDD, test-quality,
  planning, frontend and Agent Reach instructions, and audited the single-slot
  map/data path.
- 2026-08-10: Reverified the official WCC Transport Sensors contract and public
  file listing. Chosen boundary: a bounded real replay artifact with matched
  historical observations, not a mock timeline or a new mobility source.
- 2026-08-10: TDD RED confirmed. The Python replay test fails because
  `analyze_replay` does not exist; the rendered-site suite has six passes and
  two expected failures for the absent history controls and replay artifact.
- 2026-08-10: Python TDD GREEN confirmed for no-future matched history and CLI
  artifact generation. Built the real 1–6 August WCC replay: 144 slots, 929
  signals and a 2.12 MB cacheable JSON feed.
- 2026-08-10: Implemented the shared time transport (date, hour, previous,
  next, scrub and play), coordinated map/list/evidence state and an accessible
  canvas trend with observed and expected series. All eight rendered-site tests
  now pass with the production build.
- 2026-08-10: Final local regression passes: 21 Python tests, eight rendered
  site/artifact tests, the production build and a clean ESLint run. The existing
  localhost:3013 tab is backed by the updated preview while publishing proceeds.
- 2026-08-10: Pushed the validated source, saved Sites version 8 and completed
  the owner-only production deployment at the existing live URL. Phase 5 is
  complete.

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
- 2026-08-10: Pushed commit `3e63b60`, saved Sites version 7 and completed the
  owner-only production deployment at the existing Pōneke Movement Watch URL.

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
# Phase 14 — easy setup

- Added `/setup` with compact Source, API/MCP/A2A and Operations Settings flows.
- Added browser-only safe drafts, explicit server-activation status, no secret
  value field, and zero-evidence/human-review boundaries.
- Added a Setup navigation destination and an Add or connect entry point from
  Data Integration.
- Verified the six-route production build, 32 site tests, lint and 22 Python
  regression tests.
