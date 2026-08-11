# Progress — Phase 2 ontology and sources

## Phase 53 — Operator readability and first-viewport controls

- Reproduced all five reported defects in the deployed site and fixed scope at presentation,
  discoverability and deferred rendering only.
- Acceptance, exclusions and file-level implementation are recorded. TDD RED is next.
- Component inspection confirms one shared root cause for both Replay variants and isolated seams
  for Live filters, Live empty truth and conditional Ontology graph mounting.
- Reconciled two attached audits against local evidence: the current cold clone/build is healthy,
  while map keyboard access and sub-13px operator text remain valid UX blockers.
- TDD RED is confirmed: the production build succeeds and 97/102 contracts pass; only the five new
  Replay, Live, Ontology and readable-type behavior contracts fail.
- TDD GREEN is complete. Replay keeps Layers and Evidence in a fixed first-viewport action zone;
  Live wraps every desktop filter and visibly states that zero candidates is not an all-clear;
  operator text has a scoped 13px floor; Ontology mounts advanced graph/path content only on demand.
- Live map access now has a named keyboard surface, geographic arrow navigation, 46 focusable marker
  alternatives, Enter selection, Escape return and modifier-only wheel capture.
- Final validation passes: production build, 103/103 behavior/render tests, ESLint and whitespace.
  Browser checks at 1440px, 375×812 and 812×375 found no clipped core controls or page overflow;
  Ontology's default DOM fell from about 1,600 nodes to 627.
- Published the validated UX source to the existing owner-only Sites deployment. GitHub `origin`
  and remote `main` remain unchanged.
- Post-deployment self-review caught one misleading edge state: positive queues would still say
  `Zero candidates`. The status now distinguishes checking, zero and positive candidate counts;
  the full 103-test, build, lint and whitespace gate passes again before the corrected release.

## Phase 52 — Production operator workflow refactor

- Audited the four deployed operator pages, shared shell, CSS overrides, behavior tests and current
  data/authority boundaries. Scope is fixed to information architecture and interaction polish.
- UI guidance confirms a low-variance, low-motion, high-density public-sector workspace. The
  implementation will reuse the existing civic tokens and Phosphor icons rather than add a library.
- Acceptance and file scope are recorded. TDD RED is next; no data, model, ontology or API mutation
  is authorised.
- TDD RED is verified: the production build succeeds and 100/102 existing behaviors remain green;
  only the two new workflow contracts fail because the old table/document layouts lack the new
  master-detail, step-inspector and guided-setup surfaces.
- A direct focused Node rerun hit the known sandbox child-process `EPERM`; the authoritative full
  `npm test` run already produced the expected RED result, so implementation proceeds from that
  evidence rather than retrying the same blocked invocation.
- TDD GREEN is complete. Signal Review now uses an evidence-first queue/ticket workspace; Data
  Integration uses a searchable 33-source list and selected contract; Ontology uses a six-step
  inspector while preserving its advanced graph; Setup uses a guided three-step draft flow.
- The final production build and all 102 tests pass. ESLint passes. Browser checks at 1440×900,
  375×812 and 812×375 found no page-level overflow or clipped controls on any of the four pages.
- Interaction checks passed for source selection/search, ontology step selection, Setup
  Save-and-continue and Signal Review tab state. A temporary Setup QA draft was cleared afterward.
- Published the exact validated feature commit as private Sites version 61 and verified all four
  workflows on the production URL. GitHub origin and remote `main` remain unchanged.

## Phase 51 — April movement evidence detail and history

- Audited the packaged April movement outcome file: all 2,903 candidates contain real
  `matched_history` and `signal_confidence` fields, with up to 12 prior matched weekday/hour values.
- Found the display defect: `SensorReplayCanvas` keeps only observed/expected/z when projecting the
  pack into map observations, so the selected generic card cannot render history or confidence.
- Scope is fixed at a movement-only detail overlay and real matched-hour chart; no retraining,
  causal inference, new source, evidence weight or GitHub-origin change.
- TDD RED confirmed the missing detail projector and absent April evidence panel. GREEN now retains
  the packaged confidence/history fields and renders observed, expected, signed change, robust z,
  matched-hour count, confidence, an explicit no-cause boundary and a real history/baseline chart.
- Browser verification selected a real 20 April vehicle record and confirmed 23 observed, 84
  expected, −61 change, −6.6 z, 12 matched hours and high confidence. Closing the panel and changing
  replay time both remove stale evidence; no browser errors were reported.
- Final production build, 101/101 site tests, ESLint and `git diff --check` pass.
- Published exact validated commit `9e82cbe` only to the private Sites source, saved version 60 and
  completed the owner-only deployment at the existing production URL. The temporary archive and
  preview logs were removed; GitHub `origin/main` remains unchanged at `cb9d15b`.

## Phase 50 — Replay control hierarchy and map clustering

- Audited both Replay datasets, navigation, map controls and the existing LiveMap clustering seam.
  Fixed scope at a two-tier Replay control surface, usable timeline, display-only movement clusters,
  compact map actions and an icon-only desktop navigation collapse control.
- TDD RED confirmed the missing movement cluster projection and the old one-row/slider contracts.
  TDD GREEN now clusters regional movement signals without mutation, expands them on selection and
  retains individual People/Vehicle/direction inspection at street zoom.
- Both August movement and April storm now separate playback/time from filters/layers. The scrubber
  has an 8px track with visible start/current/end ticks; Replay map actions use vertical plus/minus,
  reset and fullscreen icons, and the legend has a translucent contrast card.
- Verification passes: production build and 99/99 site tests, ESLint and `git diff --check`.
  Independent review found no evidence or authority regression.
- Independent review found no truth/authority regression and identified two UI defects before
  release. Mobile legend clearance now reserves the control column, small-screen panels use one
  shared toolbar-clearance variable, and cluster hit testing covers the full visible badge.
- Published exact verified commit `491625c` only to the private Sites source, saved version 59 and
  completed the owner-only production deployment at the existing URL. Temporary packaging files
  were removed; GitHub origin/main remains untouched.


## Phase 49 — configurable movement icons

- Started the icon-onboarding change. Scope is fixed at clear People/Vehicle map symbols, retained
  direction, a shared Auto/People/Vehicle/Custom picker and browser-only PNG/WebP persistence.
- Audited the two onboarding paths and current canvas. Replay source overrides already provide the
  correct local persistence boundary; Setup drafts remain separate and will reuse the same picker.
- Confirmed implementation seam: one source-level icon preference feeds source-row preview and the
  canvas; Auto resolves each signal to People/Vehicle and a separate outer arrow preserves direction.
- TDD RED is verified: canonical sources lack an Auto icon default, custom upload helpers are absent,
  and unsafe SVG data is currently accepted. The other 36 focused model tests remain green.
- Pure validation and persistence are now GREEN at 39/39. Rendered RED confirms the remaining UI
  gaps: Setup and Replay lack the Map icon picker/upload, and Replay filters lack People/Vehicle icons.
  The independent direction legend already passes.
- TDD GREEN is complete: both onboarding surfaces share the picker, source rows preview the current
  choice, Auto draws distinct person/car pictograms, and the direction arrow stays outside the icon.
- Verification passes: production build and 96/96 site tests, ESLint, 27/27 Python tests and
  `git diff --check`. The exact temporary Python test directory was removed after verification.
- Published exact validated feature commit `3e49b27` only to the private Sites source, saved version
  58 and completed the owner-only production deployment at the existing URL. The temporary archive
  was removed; GitHub `origin/main` remains unchanged at `cb9d15b`.

## Phase 48 — unified Investigation Layers container

- Reproduced the deployed 20 April Weather issue: click produced no pressed-state change and
  left 18 sensor values visible.
- Audited both Replay paths. August owns the full source workspace; April owns a separate sensor
  overlay and treats Weather as a radio-style filter. The fix will share one container contract
  and make evidence-family visibility independent from Weather subfilters.
- TDD RED confirmed the exact missing transition: `toggleSensorEvidenceFilter` does not exist, so
  the active Weather state cannot become off while preserving its selected series.
- TDD GREEN now covers the shared Investigation Layers shell, independent Weather deselection and
  a five-location Wellington City Weather overview. The Weather strip uses the same rain symbol as
  the map; detailed Rain/Flow/Hydro selections still expose the full packaged investigation data.
- Production build and all 95 site tests pass; ESLint, 27/27 Python tests and `git diff --check`
  also pass. One obsolete rendered title assertion was updated from the retired per-dataset shell
  to the shared Investigation Layers contract.
- Published exact validated feature commit `9d3b070` only to the private Sites source, saved version
  57 and completed the owner-only production deployment. Deployed checks confirm Weather 5 → 0 → 5,
  Movement stays enabled, all five summary cards use the rain symbol, and both April and August open
  the same Investigation Layers panel with source selection/add access.
- Removed the temporary deployment archive. GitHub `origin` and remote `main` remain unchanged.

## Phase 47 — August model-output Replay

- Audited the full WCC August pack: 284,556 canonical observations, 144 hourly slots and 929
  movement anomaly candidates; no candidate contains future matched-history points.
- Added RED contracts for model metadata, exact input/output reconciliation and the August
  investigation label, then updated the generator and regenerated the packaged artifact.
- The compact investigation header and selector now identify “929 model candidates”; April keeps
  its separate 209,334 → 2,903 retrospective result.
- Verification: Python 27/27 pass; site 93/93 pass with production build; ESLint pass;
  `git diff --check` pass apart from expected Windows line-ending notices.
- Published exact validated commit `5be3fff` to the private Sites source, saved version 56 and
  completed the owner-only production deployment. Deployed UI verification found the August
  summary, `929 model candidates` and the default `12 signals · 207 gaps` with no load error.
- GitHub `origin` and remote `main` remain unchanged.

## Phase 38 — unified map-first Live workspace

- 2026-08-11: Started the Live map-first redesign. Fixed the scope at one large OpenStreetMap
  workspace with collapsible Inbox, layer picker and detail overlay; existing evidence gates,
  zero-weight context, source truth and 1000% map controls remain unchanged.
- 2026-08-11: Audited the existing React/vinext Live components. Confirmed the change can reuse
  all current snapshot state and map behavior; only the three-tab composition, point grouping
  and overlay controls need to change. Context has no earned geometry and will stay an overlay.
- 2026-08-11: Defined the six spatial domain layers from existing source roles and observation
  kinds, plus a separate non-spatial City context panel. Exact source switches remain nested
  under Layers so operator grouping never overwrites integration truth.
- 2026-08-11: TDD RED confirmed the missing map-layer classifier, combined source/layer filter
  and broad-zoom clustering contract. TDD GREEN now passes for all three.
- 2026-08-11: Replaced the three primary tabs with one large map. Evidence Inbox, six domain
  chips, exact feed controls, city context and selected-record details are collapsible overlays;
  promoted evidence receives a visible ring and broad-zoom records cluster before street zoom.
- 2026-08-11: Production build, 76/76 behavior tests and ESLint pass. Keyboard alternatives,
  44px controls, visible focus, reduced motion, 70–1000% zoom, fullscreen, source truth and
  zero-weight context boundaries remain intact. Owner-only deployment is next.
- 2026-08-11: The first source-only Sites build did not publish because the deployable app is
  intentionally nested under `site/`. Repackaged the same validated build as an explicit Sites
  archive; no application code, access policy or source truth changed.
- 2026-08-11: Sites version 41 deployed successfully to the existing owner-only production URL.
  Access remains one owner and no groups. GitHub origin and remote `main` remain unchanged.

## Phase 37 — selectable Replay investigations

- 2026-08-11: Audited Replay query handoffs, April event-pack metadata, the August player,
  local source workspace and test contracts. Locked the boundary to packaged/local Replay
  contexts, not Incident/COP creation or mixed-unit playback.
- 2026-08-11: Selected a compact labelled selector plus progressively disclosed draft form;
  next step is TDD RED for catalogue validation, April selection and rendered controls.
- 2026-08-11: TDD RED confirmed three intended failures: no packaged-investigation catalogue,
  no bounded local-draft preparation contract, and no Replay investigation selector before
  the dataset summary. Existing unrelated tests remain green.
- 2026-08-11: TDD GREEN completed. Replay now lists April Storm first and August movement
  separately, preserves source/start/cutoff in the handoff URL, expands the selected packaged
  case, and creates bounded browser-local drafts without creating an Incident/COP.
- 2026-08-11: Site build, 73/73 behavior tests and ESLint pass. Browser verification passes
  for selection, navigation and draft creation at desktop and 390px mobile widths with no
  console warnings. Final regression and owner-only deployment remain.
- 2026-08-11: Final local regression passes: 73/73 site behaviors, 24/24 Python tests,
  production build, ESLint and whitespace checks. The restricted test-run temp-directory
  error was rerun with the verified project-local path and cleaned afterward.
- 2026-08-11: Published the exact validated feature commit as Sites version 39 to the
  existing owner-only production URL. Production `/replay` shows both packaged cases and
  the local investigation action with no browser warnings. GitHub origin remains unchanged.

## Phase 36 — evidence-first live triage and April sensor replay

- 2026-08-10: Audited Live Operations, Signal Review, both map implementations, source
  contracts, provider fixtures, candidate rules and the April event pack.
- 2026-08-10: Verified the shared GIS catalogue through its public GitHub source. Locked the
  source hierarchy: hydro/weather/natural-hazard observations are primary monitoring;
  access changes corroborate; events, cruise and flights are zero-weight context.
- 2026-08-10: Confirmed the local official WCC files contain 209,334 movement rows for the
  April event, but publisher cadence makes them retrospective outcome data rather than live
  event-time inputs.
- 2026-08-10: Queried the official Hilltop API for the April window. Three real sensor series
  and 1,683 observations are available for a reproducible Replay pack. Next: TDD RED.
- 2026-08-10: TDD RED confirmed the intended boundaries: the evidence-inbox projection and
  Hilltop replay module do not exist, and map zoom remains capped below 1000%.
- 2026-08-10: TDD GREEN completed. Live now opens on an Evidence Inbox, promotes only
  authoritative hazard/natural-hazard/sensor or report-plus-nearby-sensor evidence, and
  keeps standalone road, planned, stale and Mock records out of the review queue.
- 2026-08-10: Added City events, airport arrivals/departures and cruise calls as visibly
  Mock/access-gated zero-weight context. Signal Review now opens Evidence before Case & COP.
- 2026-08-10: Generated the reproducible official Hilltop pack: 1,683 rows across two
  rainfall series and Hutt River flow. The April UI keeps 209,334 WCC movement rows in the
  retrospective-outcome lane and preserves the 85.9/77.10347 mm source conflict.
- 2026-08-10: Final local verification passes: production build, 70/70 site behaviours,
  ESLint, 24/24 Python tests, desktop and 390px visual checks, 1000% street-label zoom,
  Evidence-first review order and whitespace checks. Owner-only deployment is next.
- 2026-08-10: Pushed the exact validated feature commit only to the private Sites source,
  saved version 38 and completed owner-only production deployment. Production verification
  confirms Evidence Inbox is first and the April sensor pack is loaded; GitHub origin and
  remote `main` remain unchanged. Phase 36 is complete.

## Phase 31 — quiet daily-work interface

- 2026-08-10: Started a full seven-route copy and density audit. Official Atlassian,
  Microsoft Fluent and Google Material guidance converges on concise labels, repeated
  patterns, progressive disclosure, clear hierarchy and preserved consequences.
- 2026-08-10: Locked the removal boundary: tutorial and AI-style narrative copy goes;
  operational state, errors, field labels, source truth and human-authority limits stay.
- 2026-08-10: Completed the route/component inventory. The implementation will remove
  interaction coaching and repeated subtitles, convert required boundaries to compact
  state labels, and preserve all current controls and data contracts.
- 2026-08-10: TDD RED is confirmed. The focused rendered suite has six expected failures
  from current eyebrow copy, tutorial sentences, map coaching, verbose direction legend
  and the old capability heading; the build itself succeeds.
- 2026-08-10: TDD GREEN passes. Seven routes now use concise headings and status labels;
  Ontology, Replay, Alert Centre and map surfaces no longer show tutorial copy. Styling
  now uses neutral work surfaces, subtle dividers, consistent radii and low shadow.
- 2026-08-10: Final local verification passes: ESLint, production build, 61/61 site
  behaviors, 22/22 Python tests and an additional 390/390 root regressions. Required
  loading/error states, field labels, mock/access/freshness truth and human approval
  boundaries remain present.
- 2026-08-10: Publishing the exact validated interface commit to the existing owner-only
  Sites project next; GitHub origin remains out of scope.


## Phase 30 — expandable ontology change timeline

- 2026-08-10: Audited the supplied timeline reference and the deployed six-layer
  graph. Locked the scope to a vertical workflow-change timeline with all six main
  layers visible and second-level detail collapsed behind `+`/`−`; no dated history
  or new ontology evidence will be invented.
- 2026-08-10: TDD RED confirmed two intended failures: the six display layers do
  not yet expose transformation outcomes, and the rendered graph is still a fully
  expanded six-column canvas rather than a collapsed vertical timeline.
- 2026-08-10: TDD GREEN confirmed. The six transformation labels, vertical timeline
  structure, semantic stage markers and collapsed `+` controls pass the focused
  model and rendered behavior tests; zoom, global disclosure and node inspection remain.
- 2026-08-10: Final local verification passes: production build, 60/60 site
  behaviors, ESLint, 22/22 Python tests and whitespace checks. The timeline uses
  labelled native buttons, 44px targets, one-column mobile detail and existing
  reduced-motion/focus behavior without introducing a new dependency.
- 2026-08-10: Pushed the exact verified commit only to the private Sites source,
  saved version 32 and completed the owner-only production deployment. The
  expandable ontology timeline is live at `/ontology`; GitHub origin and remote
  `main` remain unchanged. Phase 30 is complete.


## Phase 28 — compact operator title bars

- 2026-08-10: Audited the supplied Live screenshot and all six shared shell call sites.
  Locked the redesign to one compact title/mode/time bar, removal of Help/demo/eyebrow
  copy and a shorter Live status strip; operational labels and safety boundaries stay.
- 2026-08-10: Ran the required UI density/accessibility validation. The implementation
  will keep semantic headings, Wellington time, 44px actions, loading feedback, visible
  focus and responsive wrapping without adding animation or a replacement tutorial.
- 2026-08-10: TDD RED confirmed two intended failures: the six routes do not yet render
  one shared title/status bar, and the Live status strip has no named status region.
  The production build succeeds and the other 56 tests remain green.
- 2026-08-10: TDD GREEN passes all 58 site tests. All six pages now share one compact
  page-name/mode/time bar; the old demo row, large eyebrow band, Help menu and six
  instruction props are gone. Live retains all status and refresh semantics in a
  shorter named status region with 44px controls.
- 2026-08-10: Full local verification passes: production build, 58/58 site tests,
  ESLint, 22/22 Python tests and whitespace checks. The temporary pytest directory
  was removed. Publishing to the existing owner-only site is next.
- 2026-08-10: Pushed the exact validated commit only to the private Sites source,
  saved version 30 and completed the owner-only production deployment. The compact
  title bar is live across all six pages; GitHub origin and remote `main` remain
  unchanged. Phase 28 is complete.

## Phase 27 — dedicated Ontology module

- 2026-08-10: Audited the current Integration route, shared navigation, mobile grid,
  Ontology Dashboard and rendered contracts. Locked scope to moving the existing
  ontology experience into one first-class `/ontology` module; data and authority
  semantics remain unchanged.
- 2026-08-10: Ran the required UI navigation/accessibility validation. The dedicated
  route will preserve labelled navigation, current-page state, keyboard order, 44px
  targets, the existing civic design and a no-overflow six-item mobile grid.
- 2026-08-10: TDD RED confirmed five intended rendered failures: shared navigation has
  no Ontology item, `/ontology` returns 404, and the chain/graph still live on
  Integration. The production build succeeds and the other 52 tests remain green.
- 2026-08-10: TDD GREEN passes all 57 site tests. `/ontology` now owns the operational
  chain, focused graph, 33 source paths and raw ontology explorer; Integration retains
  only source contracts, endpoints, architecture and capability preview. All six
  operator pages expose the dedicated Ontology navigation item.
- 2026-08-10: Full local verification passes: production build, 57/57 site tests,
  ESLint, 22/22 Python tests and whitespace checks. The temporary pytest directory
  was removed. Publishing to the existing owner-only site is next.
- 2026-08-10: Pushed the exact validated commit only to the private Sites source,
  saved version 29 and completed the owner-only production deployment. The new
  `/ontology` page is live; GitHub origin and remote `main` remain unchanged.
  Phase 27 is complete.

## Phase 24 — top-to-bottom ontology hierarchy

- 2026-08-10: Started the requested hierarchy redesign. Audited the deployed
  Phase 23 component and fixed scope at layout/progressive disclosure only: Sources
  → Concepts → Relations & rules → Destinations, with source paths initially collapsed.
- 2026-08-10: TDD RED is verified. The new rendered contract fails only because
  the current page has no ordered vertical levels or collapsed pathway detail;
  the other 53 site tests remain green.
- 2026-08-10: TDD GREEN passes all 54 site tests. The dashboard now reads through
  four numbered vertical levels, keeps two typed relation branches and truth rules
  visible, and moves all source-level paths into a collapsed native drill-down.
  Concept and destination selections open and filter that detail.
- 2026-08-10: Validation passes the production build, 54/54 site tests, ESLint,
  22/22 Python regressions and whitespace checks. The hierarchy uses labelled
  native buttons/details, 44px+ targets, existing focus/reduced-motion rules and
  one-column breakpoints without changing data contracts.
- 2026-08-10: Saved Sites version 26 from the exact verified hierarchy source and
  completed the owner-only production deployment at the existing URL. GitHub
  origin was not pushed and remote `main` was not changed. Phase 24 is complete.


## Phase 23 — ontology dashboard

- 2026-08-10: Started a focused Ontology Dashboard inside Data Integration. Locked
  scope to a user-friendly source-to-concept-to-module view over existing artifacts;
  no new route, data, model, activation, authority or outbound action is authorised.
- 2026-08-10: Restored the clean local feature branch, loaded planning, TDD, UI and
  Sites instructions, and rejected an inaccessible network-graph primary view in
  favour of a compact filterable flow with a linear mapping alternative.
- 2026-08-10: Completed the contract audit: the 33 registry sources join exactly
  to 33 ontology `DataLayer` nodes. TDD RED is verified with two intended failures:
  the deterministic dashboard model does not exist and `/integration` has no
  visible Ontology Dashboard before Advanced; the other 52 tests remain green.
- 2026-08-10: TDD GREEN passes all 54 site tests after adding the deterministic
  33-path projection, five concept filters, Live/Alert/Replay destinations and
  compact source-role-destination rows. Every row retains truth, access/cost and
  ontology weight labels; the old machine-readable graph remains under Advanced.
- 2026-08-10: Validation passes the production build, 54/54 site tests, ESLint,
  22/22 Python regressions and whitespace checks. Responsive CSS uses a one-column
  375px projection with native labelled controls, visible focus and no wide graph.
- 2026-08-10: Saved Sites version 25 from the exact verified source and completed
  the owner-only production deployment at the existing live URL. GitHub origin
  was not pushed and remote `main` was not changed. Phase 23 is complete.


## Phase 21 — case/COP and warning operations workflow

- 2026-08-10: Audited the Alert Centre, mock adapters, Replay handoff, tests and
  current civic design tokens. Locked the phase to a browser-local, demo-safe
  case/COP and warning-preparation workflow; no database, authentication, model
  training or real external command is in scope.
- 2026-08-10: Selected a dense master-detail design with independent
  Signal/Incident/Warning states and Case, Warning, Evidence and Activity tabs.
  Rejected generic landing-page styling and any UI that implies mock channel
  preparation equals authorised publication or resident delivery.
- 2026-08-10: TDD RED produced six intended failures: the case workflow module,
  three-axis workspace, warning channel receipts and `available_at` replay cutoff
  did not exist. A focused follow-up RED also caught `severe` provider severity
  being reduced to a P4 WCC ticket mock.
- 2026-08-10: GREEN passes 49/49 site tests. Alert Centre now has a validated
  browser-local Case/COP, staff-controlled Incident state, required warning pack,
  distinct creator/approver, typed non-delivery channel states, versioned local
  activity and safe six-adapter handoffs. `severe` and `extreme` now map to P1.
- 2026-08-10: Replay handoff now carries and displays `case`, `source` and `as_of`.
  The UI explicitly states that v1 movement rows lack individual `available_at`,
  so the cutoff policy is required but not yet verifiable rather than claiming a
  leakage-safe case replay.
- 2026-08-10: Final local gate passes: production build, 49/49 site tests,
  ESLint, 22/22 Python tests, diff checks and independent read-only safety/UX
  verification.
- 2026-08-10: Published version 23 to the existing owner-only Sites project.
  The production URL is unchanged and the access policy remains one owner, no
  groups and no external visitors. Phase 21 is complete.

---

## Phase 18 — source labels and module separation

- 2026-08-10: Audited contracts and all source-facing screens. Confirmed Live is
  already connector-isolated, while Data Integration lacks a destination field,
  Setup cannot choose a destination and Replay mixes all 33 contracts by default.
- 2026-08-10: Locked the safe design to one explicit operations target per
  contract plus text badges and filters. This does not activate sources or move
  records between Live and Replay.
- 2026-08-10: RED confirmed the missing contract field, Setup destination,
  Integration filter and Replay module filter. The first GREEN run passed all
  new tests and exposed one obsolete assertion that still required all 33 source
  contracts to render together by default; it was updated to the new separation contract.
- 2026-08-10: GREEN passes 41/41 site tests. Every contract now has one current
  operator destination; Data Integration filters and labels it, Setup collects
  it, and Replay defaults to its single playable historical source.
- 2026-08-10: Final verification passes: production build, 41/41 site tests,
  ESLint, 22/22 Python tests, reduced-motion/focus/label review and whitespace
  checks. The exact validated source is prepared for the existing owner-only site.

---

## Phase 17 — April storm 回测

- 2026-08-10: Audited Live/Replay boundaries and verified that packaged real
  observations cover August only. Locked April to a retrospective event contract,
  not a fabricated replay.
- 2026-08-10: RED verified three missing behaviors: no Live deep link, no rendered
  April case study and no machine-readable event pack.
- 2026-08-10: GREEN passes 39/39 site tests. Live now exposes a labelled 回测
  action; Replay renders the April case contract; the v4 artifact has zero invented
  observations and enforces time availability, OOF stacking and Mock exclusion.
- 2026-08-10: Final verification passes: production build, 39/39 site tests,
  ESLint, 22/22 Python tests and whitespace checks. Published to the existing
  owner-only demo; access settings remain unchanged.

---

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
# Phase 16 — compact alert review queue

- 2026-08-10: Audited the alert contract, current review component, CSS and rendered behavior tests.
- 2026-08-10: Set the safe boundary: editable status, assignee and note are device-local review drafts; model severity, evidence and source truth remain read-only.
- 2026-08-10: TDD RED confirmed the old Alert Centre lacked the compact ticket queue and editable review controls.
- 2026-08-10: Implemented queue search/status filters, focused ticket selection, browser-local review drafts and compact read-only evidence cards.
- 2026-08-10: Focused production build and all 10 operator-console behaviors pass.
- 2026-08-10: Final verification passes: production build, 36 site tests, ESLint, 22 Python tests and whitespace checks. Textarea focus, 44px controls, mock zero-weight and read-only system truth remain explicit.
# Phase 17 — April storm 回测

- 2026-08-10: Started the source-verification and implementation audit. Locked the design to a Live Operations 回测 action that opens a separate retrospective workflow rather than changing live time.
- 2026-08-10: Verified the official GW, WCC and NZTA April-event evidence, including the contradictory 20/24 April rainfall date and road closure/reopening chronology.
## Phase 19 — workflow mock adapters

- 2026-08-10: Started Phase 19 from the user-supplied WCC TICKET_DETAIL field
  list and the previously agreed alert-to-case response workflow.
- 2026-08-10: Audited current provider fixtures, Alert Centre and worker routing.
  Selected six deterministic mock adapters with zero dispatch/evidence weight
  and retained the existing PII removal boundary.
- 2026-08-10: Recorded two audit path errors in the plan and corrected the
  implementation target to the existing worker router.
- 2026-08-10: Agent Reach/Jina verified the supplied NZTA TMS endpoint metadata
  and confirmed it remains a non-spatial ArcGIS table with the documented ten
  fields and pagination cap; no source activation or ontology role changed.
- 2026-08-10: The first RED attempt errored before behavior because it imported
  the not-yet-created module and used unescaped regex delimiters. Reframed the
  tests around the real worker API boundary so the next RED can fail on the
  absent catalogue, POST behavior and Alert Centre controls.
- 2026-08-10: Behavioral RED confirmed three missing outcomes: incomplete WCC
  provider fields, no workflow API, and no Alert Centre workflow controls.
- 2026-08-10: GREEN passes all 44 site tests after adding six deterministic mock
  adapter contracts, GET/POST preparation API, privacy-safe WCC TICKET_DETAIL
  envelope, compact Alert Centre preparation UI and Replay case handoff link.
- 2026-08-10: Final verification passes the production build, 44/44 site tests,
  ESLint, 22/22 Python tests and whitespace checks. The exact source was deployed
  to the existing owner-only Sites project with no access change.

## Phase 20 — international emergency-response benchmark

- 2026-08-10: Started a research-only phase after the user requested comparable
  overseas cases and explicitly authorised bounded multi-agent research. Locked
  the scope to primary-source benchmarking and a WCC operating roadmap; no site
  change, source activation, outbound notification or model training is authorised.
- 2026-08-10: Parallel official-source reviews completed for Netherlands LCMS/UK
  ResilienceDirect, Australia HazardPublisher/AWS/US IPAWS and Japan SIP4D/J-Alert.
  Main review independently verified the key platform boundaries and inspected the
  relevant warning-process/failure pages in the full 2022 NSW Flood Inquiry.
- 2026-08-10: Selected a composite design: LCMS case/COP discipline, SIP4D
  semantic/release contracts, NSW operator approval UX and CAP/IPAWS distribution
  controls. Defined the Wellington flash-flood operating flow and a three-stage
  feature roadmap. No deployment or model fit was performed.

## Phase 21 — case/COP and warning operations workflow

- 2026-08-10: Started the authorised implementation phase. Chosen boundary is a
  production-shaped, browser-local Case/COP and warning-preparation workflow
  inside Alert Centre, retaining zero dispatch and zero evidence for every mock.
  Database/authentication schema, real commands and model training remain excluded.

---
- 2026-08-10: Started Phase 22 for a full five-route production-demo UX polish.
  Restored the clean local feature branch after the cancelled GitHub upload,
  loaded the planning, TDD, public-dashboard UX, interaction-detail and Sites
  instructions, and fixed the boundary at visual/interaction quality only.
- 2026-08-10: Completed the deployed desktop and 375px audit across Live,
  Alerts, Replay, Integration and Setup. Confirmed no page-level horizontal
  overflow; selected loading truth, backtest disclosure, mobile source records,
  label legibility and consistent interaction timing as the bounded changes.
- 2026-08-10: TDD RED confirmed with three focused operator contracts while
  49 existing site tests remained green. Implemented explicit busy states with
  no provisional zeroes, collapsed April event detail, all six mobile source
  dimensions, responsive setup steps, larger operational labels and restrained
  120–180 ms interaction feedback.
- 2026-08-10: Local visual verification passes at 1667×792 and 375×812: Replay's
  playable August analyzer now starts at 412px on desktop, Integration renders
  a 339px complete record with no horizontal scrolling, and Setup's active form
  moves from roughly 624px to 464px on phone. Site tests are 52/52, ESLint is
  clean and all 22 Python tests pass.
- 2026-08-10: Saved Sites version 24 from the exact verified source and completed
  the owner-only production deployment at the existing live URL. GitHub origin
  was not pushed and its deleted feature branch was not recreated. Phase 22 is complete.
# Phase 25 — operational evidence chain

- 2026-08-10: Started the six-level Integration architecture update. Audited the
  existing four-level ontology hierarchy and fixed the scope at presentation and
  operator understanding only; no source, detector, model, authority or API changes.
- 2026-08-10: TDD RED confirmed. The rendered contract fails only because the
  current dashboard has no normalization/alignment level; all other site tests pass.
- 2026-08-10: TDD GREEN confirmed after adding the six ordered levels, five
  connectors and explicit candidate/human-authority boundaries. All 54 site tests
  pass in the focused run, including the production build.
- 2026-08-10: Full local verification passes: production build, 54/54 site tests,
  ESLint, 22/22 Python tests and whitespace checks. The pytest temporary directory
  was removed. Publishing to the existing owner-only site is next.
- 2026-08-10: Pushed the exact validated source only to the private Sites source,
  saved version 27 and completed the owner-only production deployment at the
  existing live URL. GitHub origin and remote `main` remain unchanged. Phase 25
  is complete.
# Phase 26 — alternate ontology graph view

- 2026-08-10: Started a Semantica-inspired alternate ontology view. Verified the
  public repository's Knowledge Explorer pattern and selected a bounded ego-graph
  projection alongside—not instead of—the existing operational chain.
- 2026-08-10: TDD RED confirmed two intended failures: the explicit ego-graph
  projection functions do not exist, and Integration has no alternate view switch.
  The other 54 tests remain green.
- 2026-08-10: TDD GREEN confirmed. The explicit graph projection, view switch,
  focused neighbour selection and source-truth inspector pass all 56 site tests in
  the focused run, including the production build.
- 2026-08-10: Full local verification passes: production build, 56/56 site tests,
  ESLint, 22/22 Python tests and whitespace checks. The pytest temporary directory
  was removed. Publishing to the existing owner-only site is next.
- 2026-08-10: Pushed the exact validated commit only to the private Sites source,
  saved version 28 and completed the owner-only production deployment at the
  existing live URL. GitHub origin and remote `main` remain unchanged. Phase 26
  is complete.
# Phase 29 — six-layer ontology knowledge graph

- 2026-08-10: Audited the existing concept-scoped ego graph and six-step
  operational chain. Chosen design keeps all six architecture layers visible,
  progressively discloses layer detail and preserves the existing node inspector.
- 2026-08-10: TDD RED confirmed three intended failures: the six-layer projection
  helper is absent, zoom bounds are absent, and the rendered graph has no six-layer
  canvas or zoom/disclosure controls. The build/test sandbox EPERM was isolated to
  Windows process spawning and the exact tests ran correctly outside it.
- 2026-08-10: TDD GREEN confirmed. The graph now projects the selected concept
  through six ordered layers, preserves the existing direct-neighbour inspector,
  supports 60–160% zoom in 10% steps and exposes per-layer plus global disclosure.
  All three focused behavior tests pass after a clean production build.
- 2026-08-10: Final local verification passes: production build, 60/60 site
  behaviors, ESLint, 22/22 Python tests and whitespace checks. The scroll canvas
  remains a named region without an unnecessary extra tab stop; all visible graph
  controls and selectable nodes remain keyboard reachable.
- 2026-08-10: Saved Sites version 31 from the exact verified source and completed
  the owner-only production deployment at the existing live URL. Access remains
  owner-only with no external visitors; GitHub origin and remote `main` were not pushed.

# Phase 31 — quiet daily-work interface

- 2026-08-10: Removed tutorial-style and AI-explanatory prose from all seven
  operator routes while preserving current state, source truth, safety boundaries,
  field labels, errors and accessible control names.
- 2026-08-10: Standardised compact navigation, panels, spacing and state colours
  around restrained issue-tracker and productivity-suite interaction patterns.
  No workflow, source, model, ontology rule or authority behavior changed.
- 2026-08-10: Verification passes: ESLint, 61/61 site behaviors, 22/22 Python
  tests and whitespace checks. Saved Sites version 33 and completed the owner-only
  production deployment at the existing live URL. GitHub origin and remote `main`
  remain unchanged.
# Phase 32 — Replay investigation source workspace

- 2026-08-10: Started the Replay source-onboarding update. Fixed the scope at a
  device-local investigation overlay with add/edit, include/exclude and explicit
  module assignment; canonical registry, evidence, live connections and alerts remain unchanged.
- 2026-08-10: TDD RED confirmed three intended failures: the source-workspace
  model does not exist and Replay has no add/edit/module-assignment controls.
  The remaining 36 focused behaviors stayed green.
- 2026-08-10: TDD GREEN confirmed. Replay now extends its existing layer rail
  with a local add/edit form, include/exclude controls, module assignment and
  persistent browser drafts. Canonical source truth stays locked, and only the
  packaged WCC history remains playable. All 39 focused behaviors pass.
- 2026-08-10: Final local verification passes: production build, 63/63 site
  behaviors, ESLint, 22/22 Python tests and whitespace checks. The source form
  meets the compact labelled-control and 44px interaction boundary; deployment
  to the existing owner-only site is next.
- 2026-08-10: Pushed the exact validated source only to the private Sites source,
  saved version 34 and completed the owner-only production deployment at the
  existing live URL. Access remains owner-only with no groups or external visitors;
  GitHub origin and remote `main` remain unchanged.
# Phase 33 — compact alert signal details

- 2026-08-10: Audited the Alert Centre and fixed the scope at a Jira-like issue
  hierarchy: one investigation column plus one compact signal-details rail. Existing
  queue, case state, evidence, warning, workflow and human-authority behavior stay intact.
- 2026-08-10: TDD RED confirmed the old page had no named investigation/details
  regions. TDD GREEN confirmed the new rail, editable staff fields and read-only
  system facts while preserving the existing case and warning contracts.
- 2026-08-10: Full local verification passes: production build, 64/64 site
  behaviors, ESLint, 22/22 Python tests and whitespace checks. Temporary test
  files were removed; owner-only deployment is next.
- 2026-08-10: Pushed commit `8fa9a51` only to the private Sites source, saved
  version 35 and completed the owner-only production deployment. GitHub origin
  and remote `main` remain unchanged.
# Phase 34 — Signal Review queues and classification

- 2026-08-10: Started the queue and outcome-feedback update. Selected Signal Review
  as the operator name and fixed History as an all-records view, not a workflow state.
  Automatic model training, shared persistence and external ticket writes stay out of scope.
- 2026-08-10: TDD RED confirmed the queue/classification model and rendered workflow
  were absent. TDD GREEN confirmed New/Active/Closed/History grouping, four human
  outcomes, mock/undetermined exclusion and the renamed operator module.
- 2026-08-10: Full local verification passes: production build, 67/67 site
  behaviors, ESLint, 22/22 Python tests and whitespace checks. Temporary test
  files were removed; owner-only deployment is next.
- 2026-08-10: Pushed commit `3854db8` only to the private Sites source, saved
  version 36 and completed the owner-only production deployment. GitHub origin
  and remote `main` remain unchanged.
# Phase 35 — ontology-aware fusion architecture

- 2026-08-10: Started the Ontology graph replacement. Scope is fixed at a presentation/model-
  governance update: domain experts feed ontology alignment and calibrated late fusion, while
  ontology, LLM, mock data and post-event news remain outside learned alert scoring.
- 2026-08-10: Audited the current page, source contracts, reference attachment and W3C OWL
  definition. The existing operational chain remains; only the change-timeline graph is replaced.
- 2026-08-10: TDD RED confirmed two intended failures: the fusion projection export is absent and
  `/ontology` still renders Knowledge graph / Change timeline. The other 41 focused behaviors stayed green.
- 2026-08-10: TDD GREEN confirmed. The second Ontology view is now a six-stage branching fusion
  architecture with domain training policies, untrained semantic alignment, prototype late fusion,
  LLM weight zero, mock/news exclusion and human-only release authority. All 43 focused behaviors pass.
- 2026-08-10: Added repository-scoped `AGENTS.md` rules for domain experts, event-blocked time splits,
  out-of-fold fusion, calibration, hard exclusions and human release gates. No model was fitted.
- 2026-08-10: Independent review found that context/news placement could imply they entered fusion;
  a new RED test captured the issue, then the nodes moved to a separate non-scoring branch. The
  reduced-motion zoom transition was disabled. Re-review passed with no P0–P3 findings.
- 2026-08-10: Final local verification passes: production build, 67/67 site behaviors, ESLint,
  22/22 Python tests and whitespace checks. Owner-only deployment is next.
- 2026-08-10: Pushed the exact validated feature commit only to the private Sites source, saved
  version 37 and completed the owner-only production deployment. Access remains one owner, no
  groups and no external visitors. GitHub origin and remote `main` remain unchanged.
# Phase 40 — reliable Replay/Live data binding and compact controls

- 2026-08-11: Started end-to-end audit after a deployed Replay screenshot showed duplicated
  time/status surfaces and the user reported stale investigation switching plus ineffective Live
  search. Scope is data-to-UI binding and compact presentation; source truth and model rules stay fixed.
- 2026-08-11: Code audit reproduced the Replay defect: investigation selection is isolated from
  `MovementCanvas`, which always loads August movement history. The April URL only opens details;
  it does not bind April sensor observations to the playable map or summary.
- 2026-08-11: Data-shape audit confirmed the April pack can support an honest sensor replay and
  confirmed the Live endpoint is `no-store`. Live search coverage is incomplete for displayed values.
- 2026-08-11: The generic web reader could not access the private Sites URLs. Browser verification
  will use the existing authenticated in-app session instead of retrying the rejected path.
- 2026-08-11: Deployed browser verification found 61 Live records after refresh and reproduced
  the search defect with `offline`. TDD RED now records the missing operational-value search and
  missing available-at-safe April sensor replay builder as the two expected failures.
- 2026-08-11: TDD GREEN completed. April Storm now binds 1,677 cutoff-safe Hilltop readings to
  a sensor replay, investigation switches replace the active dataset immediately, and Live search
  indexes displayed values, status, direction, units and source properties.
- 2026-08-11: Replay date, count, speed and playback controls now share one compact toolbar.
  Duplicate summary, history and paused cards were removed; narrow screens keep page width stable
  by scrolling the toolbar internally.
- 2026-08-11: Final local verification passes: production build and 82/82 site behaviors, ESLint,
  whitespace checks, mobile and landscape browser checks. Owner-only deployment is next.
- 2026-08-11: Pushed validated commit `4c71285` only to the private Sites source, saved version 49
  and completed the owner-only production deployment. Deployed-browser checks passed: April sensor
  replay loads 1,677 cutoff-safe records, switching to August replaces the active map immediately,
  and Live search finds 38 current records by the displayed `offline` status. GitHub origin and
  remote `main` remain unchanged.
# Phase 41 — Replay layer controls and event symbols

- 2026-08-11: Started deployed Replay overlap/layer audit. Scope now includes a compact compatible-
  layer picker and consistent accessible symbols for operational event families; no new data source
  or evidence semantics are introduced.
- 2026-08-11: TDD RED verified the intended gaps: no event-family symbol projection and no immutable
  sensor-layer filter exist yet. The focused suite failed only those two new behaviors (28/30 passed).
- 2026-08-11: Added the requested lighter basemap tone to the same map pass so street labels remain
  readable while operational symbols receive more contrast.
- 2026-08-11: TDD GREEN and regression verification pass. Replay series filtering is immutable,
  nine tested event families resolve to distinct labelled symbols, the production build passes all
  84 site behaviors, ESLint passes and whitespace checks are clean. Browser layout QA is next.
- 2026-08-11: Browser interaction exposed and fixed a React event-lifetime crash when a sensor
  series was unchecked. A pure selection helper now captures the checkbox value before the state
  update; hide one, Hide all and Show all correctly render 2, 0 and 3 sensor readings.
- 2026-08-11: Desktop, 375px mobile and 812×375 landscape QA pass with no horizontal overflow.
  Replay toolbar, zoom, attribution, sensor legend, readings and fixed mobile navigation have no
  intersecting rectangles. Live opens with Inbox and Layers collapsed and renders distinct rain,
  water, earthquake, warning, road, report, flight, cruise and city-event symbols.
- 2026-08-11: Final production build, 86/86 behavior tests and ESLint pass. Owner-only deployment
  remains; GitHub origin and remote `main` have not been changed.
- 2026-08-11: Published exact validated commit `7577aa0` only to the private Sites source, saved
  version 50 and completed the owner-only production deployment. Production browser checks confirm
  Live renders the new event families with Inbox collapsed, Replay loads 1,677 records, and
  disabling Hutt River changes visible readings from 3 to 2 without errors. GitHub origin and
  remote `main` remain unchanged.
# Phase 42 — compact Live source status

- 2026-08-11: Audited the mobile screenshot, rendered Live component and responsive rules. Scope is
  fixed to one concise status toolbar; operational counts, state semantics and actions remain.
- 2026-08-11: File-level plan and behavior acceptance recorded. TDD RED is next.
- 2026-08-11: UI guidance confirms the selected direction: data-dense real-time monitoring with
  explicit loading feedback and locally contained narrow-screen overflow.
- 2026-08-11: TDD RED confirmed the old verbose contract still renders `No current records`,
  `Not all-clear`, `Auto refresh · 60 s` and `Pause display` as stacked visible content.
- 2026-08-11: Compact JSX and responsive CSS are implemented. The first GREEN attempt correctly
  revealed that rendered tests use the built Worker artifact; rebuild is required before retesting.
- 2026-08-11: Production build and focused rendered GREEN test pass. The status strip now has
  compact visible metrics/actions and accessible full empty-state and refresh-policy meaning.
- 2026-08-11: Confirmed browser QA will exercise the production `vinext start` artifact, matching
  the Worker bundle already covered by the rendered test.
- 2026-08-11: Local production preview is ready on port 3018 and the authenticated in-app browser
  session is available for desktop and 375px layout checks.
- 2026-08-11: Local `/live` is open in a fresh in-app browser tab; semantic and geometry checks are
  ready against the real rendered component.
- 2026-08-11: Browser capability documentation confirms an explicit viewport override is available;
  mobile QA will use a real 375×812 rendered viewport and reset it before handoff.
- 2026-08-11: Desktop and 375px rendering confirm one 47–57px row and 44px Pause/Refresh targets.
  The toolbar itself is contained; investigation continues for an unrelated 11px page overflow.
- 2026-08-11: Narrow-screen padding was reduced without shrinking action targets. The rebuilt toolbar
  should now fit its 347px content box without its own scrollbar; browser recheck is next.
- 2026-08-11: 375×812 browser recheck passes: all four groups share one row, toolbar client and
  scroll widths both equal 347px, body overflow is zero, and both actions are at least 44×44px.
- 2026-08-11: The browser backend does not support element-only screenshots; acceptance therefore
  uses the authoritative rendered geometry, visible labels and control-state checks.
- 2026-08-11: Interaction QA passes: Pause becomes Resume, Refresh disables while paused, and resume
  restores the default state. Desktop remains one 47px row with no overflow; browser logs are clean.
- 2026-08-11: Full regression found one expected wording contract that requires the phrase
  `Not all-clear`. The hidden accessible note was shortened to preserve that safety language.
- 2026-08-11: Final local verification passes: production build, 86/86 behavior tests, ESLint,
  whitespace checks, desktop browser checks and 375×812 responsive interaction checks.
- 2026-08-11: Validated source is committed locally on the feature branch. Owner-only Sites access,
  source credentials and the exact pushed commit will be verified before saving version 51.
- 2026-08-11: Published validated commit `1bf0f75` only to the private Sites source, saved version 51
  and completed the owner-only deployment. Production desktop and 375px checks confirm one 47px
  status row, current source counts, 44px actions and clean browser logs. GitHub origin and remote
  `main` remain unchanged.
# Phase 43 — Replay source icon toggles

- 2026-08-11: Started the Replay layer-control refinement from the supplied screenshot. Scope is a
  direct accessible icon toggle per existing source; no source or evidence behavior changes.
- 2026-08-11: Located the existing checkbox-based source layer rows and supporting rendered/model
  tests. The icon will replace only the checkbox affordance and reuse the current selection state.
- 2026-08-11: File scope is fixed to MovementCanvas, layerModel, CSS and two focused tests. The
  existing playback-stop and map-inspection safeguards remain in the component handler.
## Phase 43 — Replay source icon toggles

- Added failing contracts for immutable one-source selection and an accessible pressed icon control.
- These tests specifically catch a toggle that changes the wrong layer, mutates the stored set, or regresses to a passive colour mark / hidden checkbox.
- Replaced the passive source swatch and checkbox with one compact add/remove icon button; the existing selection, replay-stop, map-refresh and browser persistence paths remain authoritative.
- First production build exposed and then closed one JSX self-closing-tag error in the new icon markup.
- 2026-08-11: Final local verification passes: production build, 87/87 behavior tests, ESLint and
  whitespace checks. The selected icon has a check, the unselected icon has a plus, both retain a
  44px hit target and `aria-pressed`; owner-only deployment is next.
- 2026-08-11: Published validated commit `e68aa1c` only to the private Sites source, saved version 52
  and completed the existing owner-only production deployment. GitHub origin and remote `main`
  remain unchanged.

# Phase 44 — Mobile Live map decluttering

- 2026-08-11: Converted the supplied mobile UX review into a bounded implementation phase. Priority
  is bottom-sheet details, progressive search/filter controls, explicit navigation glyphs and safer
  cluster/tool touch geometry; data and desktop behavior remain unchanged.
- 2026-08-11: UI guidance and the pre-delivery checklist confirm 44px targets, safe-area clearance,
  higher contrast and reduced-motion support. The existing civic visual system remains authoritative.
- 2026-08-11: Code audit confirmed six independent map-overlay states can overlap. The implementation
  will coordinate them on mobile, reuse existing search/data selection, and restyle the existing
  selected-record overlay into a bottom sheet rather than duplicating evidence content.
- 2026-08-11: LiveMap audit found canvas hit radii can fall below 44px while the zoom controls sit
  only 16px from the map bottom. The plan now expands hit testing and moves tools above the mobile
  navigation/sheet area while retaining the screen-reader observation list.
- 2026-08-11: Status/search review fixed the hierarchy decision: keep the existing compact health
  row, remove the redundant mobile map count, and add two labelled icon controls to search for
  Filters and Inbox. No operational count or refresh action is removed.
- 2026-08-11: Added RED contracts for mutually exclusive Live panels, 44px canvas hit targets,
  collapsed Filters/Inbox search actions and unambiguous Activity/Inbox/Settings navigation icons.
- 2026-08-11: Implemented one exclusive map-panel state, full-width mobile bottom sheets, collapsed
  filter/inbox controls, 44px canvas hit radii, higher metadata contrast and navigation icons from
  one tree-shaken outline set. The focused model tests are GREEN; production build is next.
- 2026-08-11: The first focused GREEN run was blocked by sandboxed worker spawning (`EPERM`). The
  same bounded test passed with scoped approval; no product code workaround was introduced.
- 2026-08-11: Final local verification passes: production build, 90/90 behavior tests, ESLint and
  whitespace checks. The selected-record sheet receives focus, respects reduced motion and keeps map
  controls clear; the validated source is ready for an owner-only Sites deployment.
- 2026-08-11: Published validated commit `9a20684` only to the private Sites source, saved version 53
  and completed the owner-only production deployment at the existing URL. The temporary archive was
  removed; GitHub `origin` and remote `main` were not changed.

# Phase 45 — April hydro-weather evidence enrichment

- 2026-08-11: Started the April evidence enrichment. Restored project state and audited the model
  boundary: 1,683 official Hilltop records are already packaged, while the only fitted model is the
  unrelated movement expert. Scope is now additional official hydro sensors plus a pre-event-only
  robust detector, never a cross-domain or post-event-trained model.
- 2026-08-11: Confirmed the existing pack schema and peaks: 121 hourly rows each for Berhampore and
  Newtown rainfall, plus 1,441 five-minute Hutt flow rows. `agent-reach` is not installed, so source
  discovery continues through official web results and direct provider endpoints.
- 2026-08-11: Official-source review confirms Hilltop is the correct historical authority and that
  materially more rainfall, flow and antecedent-condition sites exist. Candidate series will be
  probed individually for April coverage and freshness before entering the pack.
- 2026-08-11: Direct Hilltop site-list verification returned HTTP 200 from the current GWRC server.
  The generic web reader could not open these parameterized endpoints, so bounded provider requests
  are now the authoritative retrieval path.
- 2026-08-11: Retrieved the user-specified telemetry contract through GitHub's read-only API. It
  confirms the WGS84 site list, exact flow-site name join, measurement-specific units and the need
  to reject Hilltop `<Error>` bodies even when HTTP status is 200.
- 2026-08-11: Enumerated the rainfall viewer's three mutually exclusive current-state layers:
  34 dry, 7 latest-rain and 27 six-hour-total points at audit time. The first bounded multi-site
  measurement probe had a PowerShell pipeline syntax error and will be retried with explicit rows.
- 2026-08-11: Raw measurement-list inspection identified the correct nested XML schema after an
  empty-path parse. The next probe will select only datasource/measurement pairs whose declared time
  range covers the pre-event baseline and April event.
- 2026-08-11: Corrected the measurement-list parser and verified multiple April-spanning official
  rainfall stations plus Taita Gorge stage/flow/rise measures. The provider SiteList also supplies
  matching WGS84 points, so enriched replay layers can be mapped without a cross-source ID join.
- 2026-08-11: Queried the official flow viewer and identified seven metropolitan flow candidates
  whose names join exactly to Hilltop. A first combined April-count summary had a PowerShell loop
  serialization error; no data output was accepted from that failed probe.
- 2026-08-11: The corrected loop reached every bounded Hilltop URL, but history payloads were served
  as bytes and therefore failed direct PowerShell XML casting. The retry will decode UTF-8 first;
  none of those failed summaries will be treated as evidence.
- 2026-08-11: Downloaded and generated 10,098 official event-window observations across 12 rainfall
  and six flow series. The hydro detector found 6,343 above-baseline points and grouped them into 99
  investigation episodes; the compact detector pack is 173 KB rather than exposing every point.
- 2026-08-11: Added a regression for the repeated 5 April 02:00 hour and made NZ standard time the
  explicit normalization. The full 120-hour April movement build exceeded its first 180-second
  command limit after tests passed; it will be rerun with a larger bounded timeout.
- 2026-08-11: Completed the full April movement build: 209,334 source rows, 120 hourly slots and
  2,903 movement-model candidates. Replay loads this optional map layer only when selected and marks
  every result `Retrospective only` with zero event-time evidence weight.
- 2026-08-11: Validation is green: site production build plus 93/93 Node behavior/render tests,
  ESLint, and 27/27 Python tests. The temporary pytest directory was removed after verification.
- 2026-08-11: Added an operator-controlled official-impact layer containing the four withheld
  post-event labels. It stays off the map because those records lack verified event-time geometry;
  opening it shows source and claim without changing detector input or case state.
- 2026-08-11: Published validated feature commit `938aeda` only to the private Sites source, saved
  version 54 and completed the owner-only production deployment at the existing URL. The temporary
  archive was removed; GitHub `origin` and remote `main` were not changed.
# Phase 46 — movement-first April Replay

- 2026-08-11: Started the movement-first correction after operator feedback. Acceptance is fixed:
  default-on WCC movement outcomes, movement-first layer order and concise primary/supporting labels,
  while preserving retrospective-only availability and zero event-time evidence weight.
- 2026-08-11: TDD RED confirmed five intended gaps: no default movement-layer policy, the catalogue
  and page still use the hydro-first title, movement is fourth in the evidence contract, and the
  rendered case has no explicit primary-movement/supporting-weather hierarchy. The other 88 tests pass.
- 2026-08-11: TDD GREEN and final validation pass. April automatically loads the movement layer,
  lists it before hydro evidence, exposes WCC as the primary source in case settings, and keeps the
  retrospective/event-time-zero boundary. Production build, 93/93 tests, ESLint and whitespace checks pass.
- 2026-08-11: Published exact validated commit `050e003` only to the private Sites source, saved
  version 55 and completed the existing owner-only production deployment. The temporary archive was
  removed; GitHub `origin` and remote `main` remain unchanged.

# Phase 54 — Replay evidence density and review queues

- 2026-08-12: Added RED contracts for 2000% zoom, signed delta encoding, activity-only History,
  explicit All and the default-New queue selector. The focused run failed only at the intended gaps.
- 2026-08-12: Implemented one shared signed centre bar, compact evidence metrics, blue/coral movement
  direction, centred P/V filters, stronger map arrows, default-New queue selection and Review/Held Inbox truth.
- 2026-08-12: Real browser QA exposed a hidden-canvas initialization defect. Added a failing redraw
  contract, then made Evidence visibility trigger the trend render; the visible chart now contains the
  matched-hour line and expected baseline.
- 2026-08-12: Final validation passes: production build, 105/105 behavior/render tests, ESLint,
  whitespace, desktop, 375×812 portrait and 812×375 landscape checks.
- 2026-08-12: Published exact validated product commit `5b0e6b9` only to the private Sites source,
  saved version 65 and completed the owner-only production deployment. GitHub `origin`,
  `private-origin` and remote `main` were not changed.
# Phase 55 - Operator home dashboard

- 2026-08-12: Started the operator-home change. Classified the screenshot as a hierarchy reference, not a component
  template, and fixed the design direction at public-sector, low-motion, medium-density and existing civic-blue styling.
- 2026-08-12: Audited routes, shell, navigation and source-truth boundaries. The implementation will summarize current
  work and route staff into existing modules; it will not add a model, alert rule, feed, chatbot or fabricated incident.
- 2026-08-12: Added `/dashboard` as the default operator entry with adaptive next action, truthful review/source metrics,
  monitoring groups, real packaged investigations and specialist-module quick links. Mobile navigation now keeps the
  five daily destinations visible without horizontal scrolling.
- 2026-08-12: Final production build, lint and all 109 behavior/rendering tests pass. Browser checks pass on desktop,
  375x812 portrait and 812x375 landscape; the live source-issue state correctly routes to Data Integration and retains
  `Not an all-clear` when there are no promoted candidates.
- 2026-08-12: Published exact validated product commit `e094531` only to the owner-only Sites source, saved version 66
  and verified `/dashboard` in production. GitHub remotes and remote `main` were not changed.

# Phase 56 - Adaptive Replay evidence surfaces

- 2026-08-12: Started the adaptive Replay evidence change after comparing both deployed cases. Locked the design at
  one predictable preview/drawer shell with movement-, rain- and flow-specific projections; no source truth, model,
  case data or evidence authority changes are permitted.
- 2026-08-12: RED confirmed after a successful production build: 109/113 tests pass and the four intentional failures
  are exactly the missing movement/rain/flow/cluster projections and shared adaptive evidence shell.
- 2026-08-12: Implemented one shared adaptive preview/drawer contract across August movement and April movement,
  rainfall and river-flow evidence. Case, layer, filter, source and time changes now clear incompatible selections;
  April-only backtest detail is isolated from the August workspace.
- 2026-08-12: Verification passed: production build plus 113/113 tests, lint, zero browser console errors, desktop
  case switching and measurement-specific drawers, and a 375x812 mobile drawer with no horizontal overflow.
- 2026-08-12: Published exact validated product commit `307c53d` only to the owner-only Sites source, saved version 67
  and completed the private production deployment. GitHub remotes and remote `main` were not changed.
