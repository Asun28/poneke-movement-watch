# Pōneke Movement Watch — evidence ontology roadmap

## Phase 18 — clear source labels and operator-module separation

### Goal

Make every data source easy to identify by operational destination and keep
Live Operations sources distinct from Replay Analyzer sources in contracts,
setup and source-selection UI.

### Status

- [completed] Audit source contracts, Setup, Integration, Live and Replay source selectors.
- [completed] Define one truth-preserving operations-target label contract.
- [completed] Add failing contract and rendered-behavior tests.
- [completed] Implement target labels, filters and Setup destination selection.
- [completed] Verify accessibility, regressions and owner-only deployment.

### Acceptance criteria

- Every integration contract declares exactly one `operations_target`:
  `live_operations`, `replay_analyzer` or `integration_only`.
- Live connectors map to Live Operations; batch replay maps to Replay Analyzer;
  mock, stale and unconnected context remain Integration only.
- Data Integration can filter by `Used in` and shows a text destination badge on
  every source; meaning is not conveyed by colour alone.
- Add data source exposes a required `Use in` field with the same three choices.
- Replay's layer workspace defaults to Replay Analyzer sources and can explicitly
  reveal Live Operations or Integration-only contracts without making them playable.
- Existing Live data selection, replay evidence rules and activation boundaries do not change.

### Assumptions and exclusions

- A source contract has one current operational destination. A future archival
  adapter may be registered separately instead of silently treating a live feed
  as historical replay data.
- `connector_mode` remains technical source truth; `operations_target` is the
  plain-language operator destination and does not change access or runtime state.
- Setup continues to save a browser-only draft; no source is activated and no
  credentials, database schema or access settings are changed.
- No new data source, model, live API or replay observation is added.

### Initial file-level plan

- `site/tests/integration-model.test.mjs`, `site/tests/layer-model.test.mjs`,
  `site/tests/operator-console.test.mjs`: contract, separation and rendered controls.
- `site/lib/dataIntegration.mjs`: canonical target derivation and contract field.
- `site/app/components/IntegrationRegistry.tsx`, `SetupClient.tsx`: target filter,
  badges and destination choice.
- `site/app/MovementCanvas.tsx`, `site/app/layerModel.mjs`: Replay-only default
  filter and explicit non-playable destination labels.
- `site/app/globals.css`, `README.md`, `findings.md`, `progress.md`: compact,
  accessible presentation and handoff notes.

### Rejected major alternatives

- Do not use connector modes (`live`, `batch`, `mock`) as the only user-facing labels.
- Do not rely on colour, icons or route context alone to distinguish source use.
- Do not place live connector records into historical replay without an archival contract.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Planning skill was first read from `.codex/skills`; its actual root is `.agents/skills`. | 1 | Read the complete skill from the catalogued `r1` path. |
| Source-contract audit first requested nonexistent `site/lib/integration.mjs`. | 1 | Read the existing `site/lib/dataIntegration.mjs`; do not retry the wrong path. |
| One audit search included nonexistent `site/app/api`. | 1 | Use the existing app/lib routes directly and omit the absent directory. |

---

## Phase 17 — April storm 回测 entry point and event pack

### Goal

Add a clear 回测 action to Live Operations and a truthful 18–22 April 2026
storm evaluation pack that demonstrates retrospective validation without
mixing hindsight, mock records or post-event reports into model inputs.

### Status

- [completed] Audit Live/Replay entry points, existing historical coverage and cited official event evidence.
- [completed] Define the event-pack time/provenance/leakage contract and supported UI states.
- [completed] Add failing behavior and artifact tests for the 回测 entry point and April pack.
- [completed] Implement the Live Operations 回测 icon and event-pack view in Replay Analyzer.
- [completed] Verify source truth, responsive accessibility and full regressions.

### Acceptance criteria

- Live Operations exposes one labelled 回测 control with an accessible icon and 44px target.
- The control deep-links to a Replay Analyzer April Storm evaluation view without changing Live feed state.
- The pack uses `2026-04-18T00:00:00+12:00` through `2026-04-22T23:59:59+12:00` and preserves claimed, normalized and correction times separately.
- Training cutoff, replay cadence, `available_at`, allowed inputs, withheld ground truth and evaluation metrics are explicit and machine-readable.
- One event is labelled a case study, not an accuracy claim; mock records remain excluded from training, calibration and scoring.
- No April movement/rainfall/road record is presented as ingested unless a permitted timestamped record is actually packaged.

### Assumptions and exclusions

- “Stimulation icon” means a Simulation/回测 action inside Live Operations, not a sixth primary navigation destination.
- Existing Live and Replay modules stay separate: the button opens a retrospective mode and never rewinds live APIs.
- This phase prepares the event contract and operator workflow; it does not claim a trained fusion model or calibrated accuracy from one storm.
- Logistic regression is a declared comparison candidate only after leak-free event rows exist; XGBoost, SVM and learned global weights remain deferred.
- No paid/keyed source activation, credential change, public-access change or invented event observation is authorised.

### Initial file-level plan

- `site/tests/operator-console.test.mjs`, `site/tests/rendered-html.test.mjs`: deep-link and rendered truth behavior.
- `site/lib/` and `site/public/cop/`: April Storm event-pack contract and generated/static artifact as warranted by the audit.
- `site/app/components/LiveOperationsClient.tsx`: compact 回测 action.
- `site/app/replay/page.tsx` and a focused client/server component: selected event-pack view.
- `site/app/globals.css`: accessible icon/action and dense evaluation layout.
- `README.md`, `findings.md`, `progress.md`: source, leakage and evidence boundaries.

### Rejected major alternatives

- Do not add a sixth bottom-navigation item for a subordinate evaluation workflow.
- Do not relabel the existing August replay as the April storm or fabricate April sensor rows.
- Do not use news or final reports as model inputs, and do not randomly split adjacent 5/15-minute records.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `agent-reach` executable is not installed on the active PATH. | 1 | Use the skill's documented Jina Reader/Exa fallback routes and the primary web reader; do not retry the missing executable. |

---

## Phase 16 — compact human review ticket workbench

### Goal

Turn Alert Centre into a focused Jira-style review queue for routine emergency
operations while keeping model evidence, source truth and severity immutable.

### Status

- [completed] Audit the alert candidate contract, current queue UI and persistence boundary.
- [completed] Add failing rendered-behavior tests for compact triage and editable review drafts.
- [completed] Implement search/filter, queue selection and editable status, assignee and note fields.
- [completed] Replace the oversized alert layout with a dense responsive ticket workbench.
- [completed] Verify accessibility, truth-state boundaries and full site regressions.

### Acceptance criteria

- Operators can scan a compact queue, search by ticket text and filter by review state.
- Selecting a row opens one focused ticket with title, source, observed time, severity and evidence first.
- Review status, assignee and note are editable and can be saved as a clearly local browser draft.
- System severity, source, epistemic state and evidence remain visually and semantically read-only.
- Mock preview remains labelled zero evidence and cannot become a confirmed alert.
- Controls remain keyboard reachable, visibly labelled and at least 44px high; mobile avoids horizontal overflow.

### Assumptions and exclusions

- Browser storage is appropriate only for an explicit device-local review draft; it is not shared persistence.
- No D1 schema, authentication, API mutation, dispatch, notification or alert-confirmation workflow is added.
- Review status is an operator draft separate from the source candidate's read-only review state.
- Existing civic palette, source contract, model policy and owner-only deployment access remain unchanged.

### File-level plan

- `site/tests/operator-console.test.mjs`: rendered behavior for ticket controls and truth boundary.
- `site/app/components/AlertCentreClient.tsx`: compact queue, selection, filtering and local draft form.
- `site/app/globals.css`: dense two-pane ticket layout, focus, feedback and responsive treatment.
- `README.md`, `findings.md`, `progress.md`: persistence and verification boundary.

### Rejected major alternatives

- Do not make severity, evidence or source fields editable.
- Do not add a database or pretend browser-local notes are shared with other reviewers.
- Do not introduce drag-and-drop boards; a queue/detail workflow better fits fast review and keyboard use.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| A combined six-skill read exceeded the tool output limit. | 1 | Re-read every selected skill and required reference separately before acting. |
| The first hosting metadata read used the repository root instead of the site root. | 1 | Use `site/.openai/hosting.json`; no project file was changed. |
| The first specialised UX database query returned no match. | 1 | Retry with broader list-detail and form terms, then use the documented general UX rules if still unmatched. |

---

## Phase 15 — concise day-to-day operator mode

### Goal

Turn every operator module into a low-reading, click-and-select daily workflow
without weakening source truth, mock, access, freshness or human-review guards.

### Status

- [completed] Audit visible copy, repeated guidance and current action hierarchy across all six routes.
- [completed] Add failing rendered-behavior tests for concise screens and optional help.
- [completed] Replace explanatory page copy with short task labels, status chips and direct controls.
- [completed] Add one predictable Help menu for guidance that is not needed during routine work.
- [completed] Verify keyboard, touch, responsive, truth-label and existing workflow regressions.
- [completed] Publish the exact verified source to the existing owner-only Sites deployment.

### Acceptance criteria

- Live, Alerts, Integration, Replay and Setup open with a clear primary task and no long explanatory paragraphs.
- Routine actions are visible buttons, selects, filters or status chips; no instruction is required to discover the next action.
- Help is optional, keyboard reachable and closed by default.
- Real, mock, permission, cost, freshness and human-review states remain visible in compact labels.
- Interactive targets remain at least 44px, focus-visible and usable on mobile without horizontal overflow.

### Assumptions and exclusions

- “Remove explanations” means remove visible instructional prose from routine screens, not legal attribution, accessibility labels or critical truth/safety state.
- Existing data, ontology, alert policy, evidence weights, source registry and deployment access do not change.
- No new design-system package or icon dependency is needed; preserve the established civic visual language.
- No auto-connect, credential handling, alert dispatch or public-access change is authorised.

### File-level plan

- `site/tests/operator-console.test.mjs` and `site/tests/rendered-html.test.mjs`: concise-screen and optional-help behavior contracts.
- `site/app/components/OperatorShell.tsx` and `OperatorNavigation.tsx`: shared compact heading and Help menu.
- `site/app/components/*`, `site/app/MovementCanvas.tsx`, `site/app/*/page.tsx`: remove repeated prose and clarify direct actions.
- `site/app/globals.css`: task-first hierarchy, compact labels, touch/focus and responsive help treatment.
- `README.md`, `findings.md`, `progress.md`: document the operator-mode boundary and verification.

### Rejected major alternatives

- Do not remove provenance or truth-state labels to make the screen look cleaner.
- Do not hide primary operations inside a hamburger menu.
- Do not introduce a guided tour, modal chain or new settings wizard for routine work.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| The first planning patch assumed generic `Findings` and `Progress` headings. | 1 | Read the actual file heads and patch against their Phase 2 titles. |
| A first PowerShell copy-search used double-quoted regex text and parsed `[` as syntax. | 1 | Re-ran the same read-only search with a single-quoted pattern. |
| First GREEN run left three legacy exact-copy assertions for baseline, numeric React comments and capitalisation. | 1 | Pointed the assertions at the new compact rendered states without weakening their truth checks. |
| A four-file documentation patch included an empty hunk marker. | 1 | Re-applied the patch with valid per-file hunk boundaries. |

---

## Phase 14 — easy integration setup

### Goal

Give non-technical operators one short, safe place to prepare a new data source,
an API/MCP/A2A connection and basic operating defaults.

### Status

- [completed] Audit the current five-surface information architecture and setup safety boundary.
- [completed] Add failing route and shared-navigation tests.
- [completed] Add `/setup`, a Data Integration entry point and five-item responsive navigation.
- [completed] Add source, REST API, MCP, A2A and settings drafts with browser-only persistence.
- [completed] Keep secrets, live calls, registry mutation and evidence activation out of the browser flow.
- [completed] Run build, route, accessibility lint and regression tests.

### Acceptance boundary

- Setup stores a secret reference only, never a credential value.
- Saved drafts remain `needs server activation` and carry zero evidence weight.
- Real activation still requires an approved server adapter, secret store,
  connection test and human review.

## Phase 13 — shared integration layer, live operations and alert centre

### Goal

Lift the prototype into a modular emergency-information platform: one shared
Data Integration Layer supplies the existing Replay Analyzer, a new Live
Operations Dashboard, an Alert Centre and future WCC dashboards without
changing source truth or presenting model output as a confirmed emergency.

### Status

- [completed] Restore the dirty worktree and audit routes, build/runtime limits,
  current source registry, ontology artifacts and reusable map components.
- [completed] Verify WorldMonitor's relevant architecture and the official live API
  contracts for the 33 registered source products.
- [completed] Define the shared observation envelope, adapter lifecycle, source
  health, mock fidelity and alert-candidate contract.
- [completed] Add RED tests for integration snapshots, live/mock/access states,
  alert gating and the three new operator modules.
- [completed] Implement the minimal shared integration layer and deterministic
  live/mock demo adapters.
- [completed] Implement Live Operations, Data Integration and Alert Centre modules
  while preserving Replay Analyzer behavior.
- [completed] Run site, Python, artifact, lint, responsive and truth-label
  verification; document production credential and deployment boundaries.

### Acceptance criteria

- A versioned Data Integration Layer exposes stable source contracts, normalized
  observations, provenance, freshness, spatial scope, access/cost state, adapter
  health and raw-payload format metadata for multiple downstream modules.
- Replay Analyzer remains historical/batch. Live Operations shows only current
  time-aligned observations and labels each record `live`, `mock`, `empty`,
  `stale`, `credentials_required`, `permission_required` or `unavailable`.
- Keyless, licensed live APIs are connected where technically safe. Paid/keyed
  and restricted products use deterministic mock fixtures that preserve the
  verified official response envelope and are always zero-weight until replaced
  by an authorised adapter.
- Alert Centre receives candidate alerts from sensor-monitor output plus ontology
  relationships and an optional LLM explanation. Rules and provenance remain
  inspectable; the LLM cannot publish, confirm, dispatch or change access state.
- Every alert exposes supporting, contradicting, missing and context evidence,
  observation/freshness times, severity basis and a human review state.
- New modules are routable, responsive, keyboard accessible and share source
  state without duplicating adapter logic.
- No credential, personal data, restricted NEMA record or unlicensed raw record
  is committed or exposed by the public build.

### Goal Graph policy

| Node | Independently verifiable goal | Resource claim | Mode/state |
|---|---|---|---|
| G13-A | Audit current runtime and define integration/alert contracts | repository read | main thread, in progress |
| G13-B | Verify WorldMonitor patterns and official API envelopes | web/repository read | subagent, authorised |
| G13-C | Classify 33 source adapters as live/mock/empty/gated | registry/docs read | subagent, authorised |
| G13-D | Design Live/Integration/Alert operator UX | site read, no writes | subagent, authorised |
| G13-E | Write RED contracts and implement shared layer | shared repository write | main thread, blocked by A-C |
| G13-F | Implement operator modules | shared repository write | main thread, blocked by D-E |
| G13-V | Independent build/test/browser verification | repository read/runtime | main thread, blocked by E-F |

- `G13-B`, `G13-C` and `G13-D` are parallel read-only branches that inform or
  feed `G13-E/F`. All shared writes are serialized in the main thread.
- Agent reports enter review only. Official contracts, literal tests, generated
  artifacts and observed browser behavior release implementation/verification gates.
- Concurrency is bounded to the four available slots already authorised by the
  user. One validated deployment to the existing private Sites target is in
  scope after tests pass; no public-access change, key activation or paid call is authorised.

### Key assumptions and exclusions

- “All available live APIs” is scoped first to the existing verified 33-source
  registry and its documented endpoint families. New publishers require a
  separate verified contract before entering the integration layer.
- A public endpoint being reachable does not override licence, privacy or
  responder-only restrictions. Such sources remain permission-gated mocks.
- Mock fidelity means official field names, nesting, enum and time/geometry
  shape, not invented claims that a publisher emitted the record.
- The existing pre-trained sensor monitor remains the only implemented anomaly
  detector in this phase. No new classifier is trained without labelled outcomes.
- The LLM produces bounded explanations and suggested investigation questions;
  deterministic policy creates the alert candidate and humans decide disposition.
- No public warning, dispatch, route optimisation, automatic confirmed fact,
  credential storage, billing activation or public production launch is in scope.

### Initial file-level plan

- `site/lib/`: shared source manifest, fixtures, live adapters, normalization and alert policy.
- `site/scripts/`: read-only live connector health check.
- `site/worker/`: versioned integration snapshot and alert-candidate APIs.
- `site/app/`: shared navigation plus Live Operations, Integration and Alert
  Centre routes/components; Replay Analyzer remains backward compatible.
- `tests/` and `site/tests/`: literal contract, alert-gate, rendered-route and
  artifact tests written before production code.
- `README.md` and `docs/`: architecture, API examples, operational boundary and
  real/mock/key/permission/paid deployment matrix.

### Rejected major alternatives

- Do not let every dashboard call external publishers independently; adapters,
  freshness and provenance belong in one integration boundary.
- Do not pass raw mixed payloads directly to an LLM or let an LLM set severity.
- Do not label deterministic fixtures as current simply because their schema is real.
- Do not make all 33 sources evidence-bearing; schedules, static context,
  duplicates and unavailable products retain their ontology roles and zero weights.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| PowerShell rejected piping directly after a `foreach` block in three inspection probes. | 3 | Stop using that output-composition shape entirely; emit JSON inside each loop body or use a different reader. |
| Agent Reach's first `gh api` content/tree request hit the sandbox's dead proxy. | 1 | Retry the same read-only GitHub API request with approved external network access. |
| Node's isolated `--test` child process was denied with `spawn EPERM`. | 1 | Execute the node:test file directly in-process for the RED check; it then failed on the intended missing integration module. |
| This Node 22 build does not recognise `--test-isolation=none`. | 1 | Do not retry the unsupported flag; use direct test-file execution in the sandbox. |
| The first snapshot test assumed only one unconfigured source, but registry defaults correctly exposed all unconfigured contracts. | 1 | Assert the targeted provider state and require at least one unavailable source instead of coupling the test to unrelated registry defaults. |
| The sandbox denied Vite's Windows helper process with `spawn EPERM`. | 1 | Re-run the production build with the approved scoped `npm run build` permission. |
| The first two full rendered regressions used obsolete monolithic-page copy and a privacy keyword in a non-sensitive manifest note. | 2 | Update route-aware assertions and remove the sensitive field name from the serialized client contract note. |
| ESLint rejected synchronous initial refresh, an implicit label association and one misplaced current-event filter. | 3 | Defer initial refresh, bind/label the checkbox explicitly, and apply the event filter to NZTA rather than GWRC. |

---

## Phase 12 — zoomed map selection and operator UI polish

### Goal

Make the map reliably navigable and selectable after zooming, then improve the
operator-facing hierarchy and interaction feedback without changing data,
ontology, replay or evidence semantics.

### Status

- [completed] Restore the dirty worktree and audit the map rendering, hit targets, zoom and current visual system.
- [completed] Add RED tests for anchored zoom, zoomed-region selection and visible interaction guidance.
- [completed] Implement cursor-anchored zoom, drag-to-pan, click-to-select and reset behavior.
- [completed] Apply a targeted civic-operations UI polish with improved map prominence, control rhythm and focus states.
- [completed] Run focused, full, build, lint, browser interaction and responsive visual verification.

### Acceptance criteria

- Wheel zoom keeps the map location under the pointer stable instead of always
  enlarging around the fixed city centre.
- A paused user can drag the zoomed map, hover a visible signal and click it to
  select the corresponding evidence; a drag must not accidentally select.
- Reset restores both `100%` zoom and the original map centre.
- Playback continues to disable map inspection and the signal list remains the
  keyboard-accessible selection path.
- Visible guidance explains hover, click and drag behavior, with clear pointer,
  touch and focus states.
- UI polish makes the map and current task easier to scan while preserving URLs,
  section order, copy meaning, civic palette and all ontology/source truth labels.

### Assumptions and exclusions

- “Region” means the visible movement signal/countline area. No administrative
  suburb polygon is invented because the playable layer does not contain one.
- This is a redesign-preserve pass, not a new brand or information architecture.
- Design read: public-sector operations tool for WCC reviewers. Use native React
  and CSS already in the project, with `DESIGN_VARIANCE=3`,
  `MOTION_INTENSITY=2`, `VISUAL_DENSITY=6`.
- No new dependency, basemap provider, data source, model, ontology relation,
  evidence weight, route, deployment or external write is in scope.

### File-level plan

- `site/app/layerModel.mjs`: pure anchored-zoom math used by real interaction.
- `site/tests/layer-model.test.mjs`: literal behavior tests for stable pointer anchor.
- `site/app/MovementCanvas.tsx`: pan refs, pointer lifecycle and click selection.
- `site/tests/rendered-html.test.mjs`: accessible guidance/control contract.
- `site/app/globals.css`: targeted layout, interaction and focus-state polish.
- `README.md`, `findings.md`, `progress.md`: behavior and verification record.

### Rejected major alternatives

- Do not replace the dependency-free canvas with a new mapping framework during
  a focused interaction fix; that would risk projection and replay regressions.
- Do not add a fake region polygon layer or interpret a countline as a suburb.
- Do not use per-frame React state for dragging; keep pointer movement in refs
  and coalesce canvas redraws with the existing animation-frame renderer.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| First GREEN run passed anchored zoom but one legacy rendered test still required the established paused-status label. | 1 | Preserve `Paused · hover markers` and add the new click/drag guidance beneath it. |
| Second GREEN run still required the playback-off and keyboard-alternative explanation in the initial accessible document. | 2 | Keep that invariant as screen-reader text while showing concise active guidance visually. |
| ESLint rejected a click handler on the non-interactive map overlay because it had no native keyboard behavior. | 1 | Select on pointer-up when no drag occurred; keep the existing signal list as the explicit keyboard selection path. |
| The in-app browser locator does not expose `scrollIntoViewIfNeeded()`. | 1 | Use browser-visible scrolling and read-only bounding-box inspection instead of relying on the unsupported locator helper. |
| The first CUA scroll call used Playwright-style delta names. | 1 | Use the browser CUA contract's required `scrollX` and `scrollY` fields. |
| The CUA object has no per-object `documentation()` method. | 1 | Reuse the already loaded browser documentation and inspect only the public gesture method names when needed. |
| The first drag attempt used `from`/`to` fields. | 1 | Use the CUA contract's required non-empty `{x, y}` path. |
| Treating the browser screenshot wrapper directly as PNG bytes produced invalid dimensions. | 1 | Do not depend on rendered-image pixels; calculate marker positions from CSS overlay bounds and the same projection data instead. |
| A source-file search included a non-existent `site/public/data` path and returned exit 1 after finding the required v1 files. | 1 | Use only the verified `site/public/cop/v1` paths for projection evidence. |
| Screenshot metadata inspection enumerated every `Uint8Array` index and produced excessive output. | 1 | Inspect only constructor, length and a bounded header; the screenshot is JPEG, not PNG. |
| Reading the range input's HTML `value` attribute after fill/keypress stayed at the server default. | 1 | Read the live DOM value property and visible zoom status; attributes do not reflect controlled input state. |
| The final parallel check invoked `npm run lint` at the repository root, which has no lint script. | 1 | Run lint from `site/`; keep root `npm test` for the full project suite. |

---

## Phase 11 — 2026 data-layer ontology ingestion

### Goal

Feed every verified, relevant 2026 data layer that is safe and technically
available into the ontology, while preserving the distinction between a real
record, an empty activation feed, a static/context layer and a restricted or
paid capability.

### Status

- [completed] Audit the registry, ontology builders, generated artifacts, UI layer model and tests.
- [completed] Define the 2026 eligibility, freshness, access and evidence-weight contract.
- [completed] Add failing tests for 2026 layer nodes, exclusions and generated artifacts.
- [completed] Implement the minimal ontology/registry ingestion and rebuild artifacts.
- [completed] Expose the 2026 layer state without enabling mock/restricted replay.
- [completed] Add adjustable replay speed and run focused, full, build, lint, artifact and browser verification.

### Acceptance criteria

- Every eligible layer is represented by a stable ontology node with publisher,
  ontology role, access status, 2026 coverage/as-of state and demo truth state.
- Real records are included only when the official source supplies a permitted,
  time-stamped 2026 record; an empty activation feed remains an explicit empty state.
- Static and planned layers contribute context only; cameras require human review;
  restricted, paid, key-required or terms-review sources contribute zero evidence.
- Stale pre-2026 sources are excluded from the 2026 active set but remain visible
  in the broader source registry with the reason.
- Existing v1/v2/v3 endpoints remain backward compatible and the map never
  animates a layer without real playable records.
- Eventfinda 2026 Wellington events are represented as planned-demand context;
  scheduled attendance or capacity never becomes an observed crowd count.
- Metlink static GTFS is represented as real schedule/network context. Bus
  disruption, delay, trip-update and vehicle records are ingested only through
  the documented realtime API with a configured key, retaining route/trip IDs,
  timestamps, alert validity and cancellation/delay semantics.
- Replay speed is adjustable at `0.5×`, `1×`, `2×` and `4×`, defaults to `1×`,
  and changes only the playback interval. Changing speed preserves the selected
  time slot, source selection, filters and evidence state.

### Assumptions and exclusions

- “All 2026 data layers” means all relevant layers in the verified inventory
  that have 2026 temporal coverage and an allowed public integration contract,
  not every dataset on the internet or every row in a national feed.
- Source availability is not evidence of an incident. Source-layer nodes may be
  real even when they contain zero Wellington records for the selected time.
- Do not fetch or publish NEMA restricted polygons, responder-only feeds,
  paid Google output, personal data, street-level outage detail or unlicensed data.
- No classifier training, causal declaration, automatic confirmed fact, route
  optimisation, dispatch or public-warning behavior is added.
- Do not scrape around Eventfinda or Metlink authentication. Without credentials,
  publish the real contract and an explicit `not_configured` state with zero
  playable/evidence records.

### File-level plan

- `src/movement_anomaly/ontology.py`: 2026 layer eligibility and graph nodes.
- `scripts/build_ontology_demo.py`: publish deterministic ontology artifacts.
- `tests/test_ontology.py`: RED/GREEN contract and exclusion tests.
- `site/app/` and `site/tests/`: expose truthful 2026 layer state if the existing
  registry-driven UI needs no new interaction model; add a tested, accessible
  replay-speed control beside the existing date/hour controls.
- `README.md`, `docs/ontology-and-exclusions.md` and planning files: document boundaries.

### Rejected major alternatives

- Do not ingest every external endpoint into one evidence score; it would count
  duplicated, stale and context-only data as corroboration.
- Do not scrape restricted or unclear-licence sources merely because a public URL responds.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Hosting-manifest discovery returned exit 1 because no matching file exists. | 1 | Treat absence as a verified result; do not invoke Sites skills automatically. |
| Direct Node test runner could not spawn its isolated worker in the sandbox (`EPERM`). | 1 | Use the repository's approved `npm test` build-and-test path, which runs the same real tests outside that restriction. |
| Focused pytest reached the intended RED failures but its CLI test could not create a fixture under the default user temp root. | 1 | Keep the valid 0-vs-33 and 24-vs-33 RED evidence; use an explicit workspace-owned `--basetemp` for later CLI/full runs. |
| A PowerShell `rg` locator used over-escaped quotes and produced an invalid regular expression. | 1 | Stop regex location probing; use already-known line ranges and literal patches. |
| A progress-log patch used an outdated surrounding paragraph and failed verification. | 1 | Read the current file head and apply the update against the exact latest paragraph. |
| A broad playback-code locator produced valid but truncated output. | 1 | Re-run narrow, line-bounded searches for the timer, state and control regions. |
| Full pytest created six fixture errors and then failed cleanup because Windows denied access to the workspace `--basetemp`. | 1 | Treat as a sandbox filesystem failure, not a test assertion; rerun the same suite with approved unsandboxed access. |
| The first browser-skill read incorrectly combined the `sites` and `browser` cache roots. | 1 | Use the exact `r3` root from the available-skills catalogue. |
| Foreground local-preview launch exceeded the one-second shell timeout. | 1 | Launch the dedicated preview process hidden, then verify its listening port before browser QA. |
| Browser QA initially called unsupported `browser.tabs.open`. | 1 | Read the browser API contract and use `browser.tabs.new()` followed by `tab.goto()`. |
| Preview shutdown verification returned exit 1 because the listener was already absent. | 1 | Verify the three exact preview process IDs directly; all were stopped. |

---

## Phase 10 — Remaining official data-source inventory

### Goal

Find and verify the remaining official Wellington-region datasets that could
extend the movement and city ontology beyond the current 24-source registry,
without integrating records or changing the live demo.

### Status

- [completed] Restore project state and enumerate the current 24 registered sources.
- [completed] Search official transport, event, hazard, lifeline and context catalogues.
- [completed] Verify access, machine interface, geometry, time fields, licence and ontology role.
- [completed] Deduplicate against the current registry and rank the remaining candidates.
- [completed] Document direct-use, permission/key, context-only and excluded groups.

### Acceptance criteria

- Every recommended candidate is absent from the current 24-source registry.
- Each entry identifies an official publisher surface and honest access status.
- Direct observations are separated from schedules, static context and modelled risk.
- No candidate is described as live, open, mappable or reusable without evidence.
- Research does not ingest data, add layers or alter the deployed prototype.

### Assumptions and exclusions

- “All remaining” means a systematic pass over relevant official Wellington/NZ
  public catalogues, not every dataset on the internet.
- Prefer WCC, GWRC/Metlink, NZTA, NEMA, GeoNet/GNS, LINZ, Stats NZ and local
  lifeline/transport publishers; third-party aggregators are discovery-only.
- Social posts, personal data, 111 records and unlicensed scraped content remain excluded.

### File-level plan

- `site/public/cop/v2/source-registry.json`: read-only deduplication baseline.
- `docs/remaining-data-sources.md`: verified candidate inventory and ranking.
- `findings.md`, `progress.md`: research evidence and task state.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `agent-reach` executable is not available in this shell. | 1 | Use the skill's documented `mcporter` Exa path and official-page verification fallback. |
| Repository scan named a non-existent local `data/` path. | 1 | Restrict the local audit to the published registry, README and docs that exist. |
| Generic web open rejected direct ArcGIS/JSON endpoints as unsafe. | 1 | Read the same official public endpoints directly and emit only metadata/count summaries. |
| First street-light date summary encountered a null-valued pipeline row. | 1 | Normalise ArcGIS features to attribute objects and handle null strings explicitly. |

---

## Phase 9 — Continuous zoom and map fullscreen

### Goal

Replace the fixed-step-only map view with continuous operator-controlled zoom
and a true map fullscreen mode while preserving replay, selected layers and
paused marker inspection.

### Status

- [completed] Restore project state and audit the current fixed zoom controls.
- [completed] Define and test zoom bounds, wheel behavior and visible controls.
- [completed] Add wheel/trackpad zoom, a continuous slider and fullscreen toggle.
- [completed] Preserve overlays, controls and redraw behavior in fullscreen.
- [completed] Run site, Python, lint and production-build regressions.
- [completed] Publish the validated build to the existing private site.

### Acceptance criteria

- Zoom is continuously adjustable from 50% to 800% with a labelled slider.
- Mouse wheel or trackpad over the map zooms in and out without scrolling the page.
- Existing plus, minus and reset controls remain available and respect the same bounds.
- A visible control enters and exits browser fullscreen for the map only.
- Fullscreen redraws the basemap, countlines, markers and paused inspection layer.
- Replay state, source selection and truth boundaries are unchanged.
- Controls remain keyboard and touch accessible.

### Assumptions and exclusions

- Use the browser Fullscreen API; do not add a mapping framework or data source.
- Continuous zoom changes presentation only and does not pan or alter evidence geometry.
- If fullscreen is blocked by browser policy, show a concise non-destructive status.

### File-level plan

- `site/app/mapViewport.mjs`: pure zoom bounds and wheel-step behavior.
- `site/tests/`: test zoom behavior and server-rendered controls before implementation.
- `site/app/MovementCanvas.tsx`: slider, wheel handling, fullscreen lifecycle and redraw.
- `site/app/globals.css`: compact zoom instrument and fullscreen map layout.
- `README.md` and planning files: document map navigation.

---

## Phase 8 — Paused map inspection overlay

### Goal

Add a transparent inspection layer above the map so an operator can pause the
replay, move the pointer near a visible movement marker and read a compact,
truthful summary without losing the spatial context.

### Status

- [completed] Restore project state and audit the current canvas/replay/layer controls.
- [completed] Define and test paused-only marker hit testing and replay eligibility.
- [completed] Add the transparent inspection surface and compact marker summary.
- [completed] Add responsive styling and document the keyboard-accessible alternative.
- [completed] Run site, Python, lint and production-build regressions.
- [completed] Publish the validated build to the existing private site.

### Acceptance criteria

- Pointer inspection is enabled only while replay is paused and a selected source
  has real playable records.
- The closest visible marker within a bounded hit radius receives the hover card;
  empty map space shows no card.
- The card shows place, transport class, travel direction, increase/decrease,
  observed versus expected count, observation time and real source status.
- Playing, changing time/filter/layers, or leaving the map clears the card.
- Mock, restricted, paid and registered-only sources never create markers or cards.
- The existing signal list remains the keyboard-accessible route to the same facts.

### Assumptions and exclusions

- Reuse the existing selected WCC replay layer; add no source or synthetic record.
- Do not infer cause, incident, closure, evacuation or access state from a marker.
- Do not inspect while the map is moving and do not restore person/car pictograms.

### File-level plan

- `site/app/layerModel.mjs`: deterministic paused-inspection eligibility and nearest-marker rule.
- `site/tests/`: test pure behavior and server-rendered inspection boundaries first.
- `site/app/MovementCanvas.tsx`: retain drawn marker positions and render the overlay/card.
- `site/app/globals.css`: pointer layer, status instruction and compact civic tooltip.
- `README.md` and planning files: explain paused inspection and its truth boundary.

---

## Phase 7 — Selectable map-layer workspace

### Goal

Turn the map into a source-aware layer workspace with a collapsible left rail,
explicit basemap/overlay controls, per-source integration selection and replay
that uses only selected layers with real records.

### Status

- [completed] Audit the current canvas, replay state, filters and source registry.
- [completed] Define and test selected-layer replay and no-record source behavior.
- [completed] Add a collapsible, keyboard-accessible left layer rail.
- [completed] Connect basemap, coverage, movement and source toggles to map/replay state.
- [completed] Add neutral map-symbol size adjustment without person/car pictograms.
- [completed] Run site, ontology, lint and production-build regressions.
- [completed] Publish Phase 6 and 7 together to the existing private site.

### Acceptance criteria

- The left rail can be hidden and restored without losing layer selections.
- Basemap, countline coverage and WCC movement replay can be selected independently.
- All 24 source contracts appear as individual integration layers with truthful
  real/mock/permission/paid/registered-only state.
- Only selected sources with actual replay records can render or advance playback.
- Selecting a source with zero records never invents markers, movement or evidence.
- Symbol size is adjustable while neutral countline shapes and travel-direction
  arrows remain legible.
- Controls remain keyboard/touch accessible and usable on a narrow viewport.

### Assumptions and exclusions

- Reuse the existing source registry and WCC replay; add no new source product.
- A registered, mock, restricted or paid layer is selectable for integration
  planning but remains `0 playable records` until a real adapter supplies data.
- Do not restore person/car pictograms, animate mock events, or imply that a
  selected source is connected merely because its contract is visible.

### File-level plan

- `site/app/layerModel.mjs`: pure selected-layer and replay eligibility rules.
- `site/tests/`: test behavior and rendered controls before implementation.
- `site/app/MovementCanvas.tsx`: collapsible rail, layer/source selection and replay gating.
- `site/app/globals.css`: compact civic control rail, responsive state and symbol sizing.
- `README.md` and planning files: explain the layer/replay truth boundary.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| First GREEN run passed the new layer tests but removed the existing tile-fallback sentence. | 1 | Restore the truthful fallback copy and retain the new selected-layer boundary beside it. |
| ESLint required explicit label/control IDs and rejected a synchronous state reset inside an effect. | 1 | Add stable IDs to layer checkboxes and stop playback directly in the source-toggle/clear actions. |

---

## Phase 6 — Wellington city ontology explorer

### Goal

Extend the evidence lifecycle with a navigable city-semantic layer that links
each existing movement observation to its sensor, place, time window, movement
state and potential access impact without promoting an inference to fact.

### Status

- [completed] Audit the current ontology generator, artifact and case-ledger UI.
- [completed] Define and test the v3 typed-node and relationship contract.
- [completed] Generate the deterministic city ontology from existing replay evidence.
- [completed] Add an accessible semantic-rail explorer and truth-boundary copy.
- [completed] Run ontology, artifact, rendered-site, lint and production-build regressions.
- [completed] Rebuild the source download and publish the existing site.

### Acceptance criteria

- A stable `/cop/v3/city-ontology.json` artifact exposes typed nodes and edges.
- The graph includes place, infrastructure, time window, movement state,
  potential impact and access state alongside the existing evidence lifecycle.
- Every edge references an existing node and uses a documented relation type.
- Movement-only evidence can indicate a potential impact but cannot confirm a
  cause, closure, evacuation or access state.
- `access_state=unknown` is visible and never rendered as open.
- The site lets an operator inspect the typed chain, provenance, allowed claims
  and prohibited claims without adding a new source or synthetic event.

### Assumptions and exclusions

- Reuse the existing real WCC replay and current ontology case only.
- Add a backward-compatible v3 endpoint; keep `/cop/v1/` and `/cop/v2/` stable.
- Do not infer road identity from proximity, assert attendance, create a causal
  incident, train a classifier, or activate restricted/paid source records.

### File-level plan

- `src/movement_anomaly/ontology.py`: deterministic typed graph builder and validation.
- `scripts/build_ontology_demo.py`: publish the v3 artifact beside v2.
- `tests/` and `site/tests/`: test graph integrity and visible truth boundaries first.
- `site/app/CityOntologyExplorer.tsx`, `page.tsx` and `globals.css`: semantic rail.
- `README.md` and planning files: document the endpoint and assertion limits.

### Design direction

- Preserve the civic ink, harbour teal, warning amber and investigation coral palette.
- Use a horizontal semantic rail whose relationship verbs are the structure,
  with compact node detail rather than another generic card grid.
- Keep the current display/body/data typography and spend visual emphasis only
  on the selected relationship path.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial Python RED failed during collection because the missing API was imported directly. | 1 | Import the ontology module and call the wished-for API inside the test so RED is an intentional behavior failure. |
| Reusing the first project-local pytest base directory ended with a Windows access-denied cleanup error. | 1 | Run focused tests with a unique writable visualization-root base directory and disable pytest's cache provider. |
| The second sandboxed pytest base directory also passed tests but failed Windows cleanup. | 1 | Re-ran the focused suite outside the sandbox; all eight tests passed, then scheduled only the verified temporary directories for cleanup. |
| Full regression used the system Python, whose environment lacks pandas. | 1 | Locate and use the project's existing virtual-environment interpreter for the full suite; no dependency change is needed. |

---

## Phase 5 — Historical replay and trend view

### Goal

Let an operator move through the publisher's available historical date/hour
slots, replay mapped increases and decreases, and inspect the selected signal's
matched-weekday/hour history without presenting batch data as live telemetry.

### Status

- [completed] Audit the existing single-snapshot UI, detector and official history contract.
- [completed] Define and test the compact replay artifact and no-future-data trend contract.
- [completed] Build the real WCC replay window and add date, hour, step and play controls.
- [completed] Add an accessible observed-versus-expected trend view for the selected signal.
- [completed] Run detector, artifact, build, rendered-page and lint regressions.
- [completed] Rebuild the source download and publish the existing site.

### Acceptance criteria

- Date/hour controls expose only slots present in the published WCC batch data.
- Previous, next, scrub and play actions update the map, signal list and headline timestamp together.
- Every replay signal is scored using only observations before its selected time.
- The trend view shows real matched weekday/hour counts and the detector baseline; missing observations remain gaps.
- The page states the replay range, batch cadence and that this is not live emergency information.
- Existing filters, movement-direction arrows, map zoom and COP v1 snapshot remain compatible.

### Assumptions and exclusions

- Use only the existing WCC Transport Sensors product and its metadata; no new movement source.
- Ship a bounded recent history window rather than raw citywide records to keep the static COP feed responsive.
- Do not interpolate gaps, infer causes, label evacuation, or claim current/live movement.

### File-level plan

- `src/movement_anomaly/pipeline.py` and `contract.py`: deterministic replay/trend builder.
- `scripts/build_demo.py`: publish the bounded history artifact beside the stable snapshot feeds.
- `tests/` and `site/tests/`: test no-future scoring, artifact consistency and visible controls first.
- `site/app/MovementCanvas.tsx` and `globals.css`: time controls, playback and trend canvas.
- `README.md` and planning files: document the history endpoint and limitations.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Parallel direct `node --test` could not spawn its isolated worker in the sandbox. | 1 | Use the existing `npm test` flow, which builds and runs the same real worker successfully. |
| Pytest's default user temp directory is not readable in this sandbox. | 1 | Use a project-local `--basetemp` for subsequent focused and full runs, then remove it after verification. |
| The second 144-slot regeneration exceeded a 180-second command bound before writing artifacts. | 1 | Preserve the already validated 2.12 MB replay, add the tested default target field, and keep the deterministic builder for scheduled/offline refreshes. |
| Initial ESLint found an unstable trend-point effect dependency. | 1 | Memoized the derived series; the subsequent lint run is clean. |

---

## Phase 4 — Real Wellington basemap

### Goal

Replace the abstract grid behind the movement layer with a recognisable,
attributed Wellington street map while preserving the existing movement data,
direction arrows and investigation interactions.

### Status

- [completed] Audit the current map projection, zoom and pointer interactions.
- [completed] Add a failing rendered-contract test for the real basemap and attribution.
- [completed] Implement a dependency-free OpenStreetMap tile layer with a safe grid fallback.
- [completed] Verify build, regression, and desktop/mobile interaction.
- [completed] Publish the update to the existing site and open the live result.

### Acceptance criteria

- Wellington roads, coastline and place labels are visibly present beneath the sensor layer.
- Zoom, reset, filters, countline geometry and travel-direction arrows still work.
- OpenStreetMap attribution is always visible and links to its copyright page.
- Tile failure never hides the sensor layer or changes evidence semantics.
- No Google key, paid API or additional incident dataset is introduced.

### File-level plan

- `site/app/MovementCanvas.tsx`: synchronise tiled Web Mercator basemap and overlays.
- `site/app/globals.css`: style tiles, fallback and attribution without obscuring evidence.
- `site/tests/rendered-html.test.mjs`: verify the user-visible basemap contract.
- `README.md`: document the basemap source separately from evidence sources.

---

## Phase 3 — Additional open-source evidence

### Goal

Identify and verify the highest-value additional official open data sources that
can strengthen Wellington ontology cases without inventing entity links or
treating static context as live evidence.

### Status

- [completed] Research official mobility, lifeline, hazard, community and impact feeds.
- [completed] Score candidates for openness, cadence, geometry, time alignment, entity resolution and ontology value.
- [completed] Select the smallest high-confidence source set and document exclusions.
- [completed] Verify official Wellington city-event, airport-flight and cruise-schedule sources added by the user.
- [completed] Add selected sources to the registry and public documentation with tests, including explicit real/mock/auth/paid labels.
- [completed] Rebuild, verify and publish the updated ontology demo.

### Acceptance criteria

- Every selected source has an official publisher URL, access method, cadence,
  spatial/temporal fields, attribution and known limitations.
- Sources are assigned an ontology role: direct observation, official event,
  consequence/lifeline observation, or static impact context.
- Only time-aligned and entity-resolved records may contribute evidence units.
- Key-required, non-spatial, stale or static sources are registered honestly and
  do not silently corroborate a case.
- No personal, social-media or unlabelled commercial/invented record is introduced.

### Assumptions and exclusions

- This request authorises adding official open sources beyond the current ten.
- Prefer keyless machine-readable feeds; key-required sources may be documented
  but will not block the demo.
- Research does not authorise operational dispatch, public warnings, causal
  claims, or automated confirmed facts.
- NEMA EMA is represented as restricted source metadata only; the public demo
  never queries, caches or publishes its polygons without explicit permission;
  its visible capability example is synthetic and carries zero evidence weight.
- Google Routes is represented as a paid/key-required mock capability; no API
  credential or Google response is used in this build.

### File-level implementation plan

- `site/public/cop/v2/source-registry.json`: add verified source contracts.
- `src/movement_anomaly/ontology.py`: extend registry generation only where the
  contract is deterministic and tested.
- `tests/test_ontology.py` and rendered artifact tests: verify roles and limits.
- `docs/ontology-and-exclusions.md` and `README.md`: explain selection and use.

### Rejected major alternative

- Do not ingest every available dataset into one score. A broad unweighted data
  lake would obscure freshness, provenance and entity-resolution failures.

---

## Phase 2 — Multi-source evidence ontology

## Goal

Extend Pōneke Movement Watch from a single-source anomaly feed into a small,
working multi-source evidence graph that follows the supplied ontology:
Observation → Entity Resolution → Evidence → Hypothesis → Human Decision →
Confirmed Fact.

## Status

- [completed] Parse the ontology brief, audit the current repository, and verify candidate public sources.
- [completed] Select the smallest high-value source set and define provenance, freshness, reliability, and entity-resolution contracts.
- [completed] Add failing contract tests for the ontology and contradictory-evidence behavior.
- [completed] Implement source normalization, entity resolution, evidence/hypothesis outputs, and backward-compatible COP feeds.
- [completed] Extend the operator UI to distinguish observation, inference, decision, and confirmed fact.
- [completed] Run replay, regression, build, and visual checks; update documentation and downloadable source archive.

## Acceptance criteria

- Every claim has a typed epistemic state: `observation`, `inference`, `decision`, or `confirmed_fact`.
- Observations carry source, observed/published times, freshness, location/entity links, quality, and attribution.
- Supporting, contradicting, neutral, and missing evidence remain visible; absence of a closure is not treated as proof of no disruption.
- Hypotheses are ranked transparently without presenting an uncalibrated score as probability.
- Human confirmation is represented as a new fact and never synthesized by the model.
- The existing movement GeoJSON remains consumable while new ontology/evidence feeds compose into the shared COP.
- Only verified public sources are implemented; no personal 111-call data, private traffic provider, or unverified social content is fabricated.
- Existing WCC `TICKET_DETAIL` rows and NZTA TMS rows are accepted in the supplied format; requester names are dropped at the ingestion boundary.

## Assumptions and exclusions

- The user's new request authorizes adding data sources and supersedes the prior single-source restriction.
- Prefer sources already catalogued by `wcc-emergency-gis-data`, then official NZ/Wellington public endpoints.
- This remains a prototype/replay, not an operational emergency system or automated dispatch tool.
- No causal declaration, calibrated incident probability, route optimisation, public messaging, or autonomous response in this phase.

## Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Git Bash treated a `C:` archive path as a remote tar target | 1 | Re-ran the official packaging script with an MSYS `/c/...` path. |
| Web search/open returned no extract for direct ArcGIS REST metadata URLs | 1 | Use the official JSON endpoints directly and verify fields/counts locally. |
| NEMA EMA endpoint was publicly reachable but its item licence is restricted | 1 | Exclude its records from the public prototype; document permission requirement instead. |
