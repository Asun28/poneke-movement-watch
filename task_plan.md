# Pōneke Movement Watch — evidence ontology roadmap

## Phase 51 — April movement evidence detail and history

### Goal

Restore the packaged April movement model detail that is currently dropped by the map projection,
including the real matched-hour history and a compact trend chart for the selected movement signal.

### Status

- [completed] Audit the April outcome pack and selection path.
- [completed] Add failing model and UI contracts.
- [completed] Implement selected movement detail and the matched-history chart.
- [completed] Run regressions, production build and owner-only deployment.

### Acceptance criteria

- Selecting an April movement marker shows increase/decrease, Investigate, site, class, direction,
  observed, expected, signed change, robust z, history count and baseline confidence.
- A compact time chart plots only the selected signal's real `matched_history`, plus the current
  observed value and expected-baseline reference; changing the selected signal refreshes it.
- The detail states that no cause is inferred and keeps the retrospective event-time weight at zero.
- Missing history is shown as unavailable; no values, confidence or cause are fabricated.
- Weather and river selections retain their generic source detail and never inherit movement fields.
- No detector retraining, new dataset, ontology/evidence-weight, case workflow or GitHub-origin change.

### Assumptions and exclusions

- The packaged 18–22 April movement outputs are retrospective investigation context only.
- Matched history is descriptive detector evidence, not causal evidence about the April storm.
- The existing Atlassian/Jira-style evidence overlay remains the visual system.

### File-level plan

- `site/lib/replayDataWorkspace.mjs`: pure movement-detail projection and ordered history contract.
- `site/app/components/SensorReplayCanvas.tsx`: retain packaged fields and render selected detail/chart.
- `site/app/globals.css`: compact responsive evidence overlay and chart styling.
- `site/tests/*`: model truth, selection and rendered-contract coverage.
- `findings.md`, `progress.md`: audit, verification and deployment evidence.

### Rejected major alternatives

- Do not rebuild or retrain the movement detector.
- Do not synthesize missing history or infer the storm caused a movement change.
- Do not make every sensor hover card carry the full movement evidence panel.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| One broad test patch did not match the longer existing Ontology assertion block | 1 | Split the RED edit into small exact-context patches after reading the complete block. |
| Session catch-up was first called from the obsolete `.codex` skill path | 1 | Re-ran the same read-only helper from the installed `.agents` skill path. |
| One broad inspection command produced truncated output and a PowerShell range type error | 1 | Re-ran bounded, file-specific reads; no files were changed. |
| A sandboxed parallel rebuild could not start Vite's helper process | 1 | Stopped the bounded preview server and reran the same build with approved process permission. |
| Browser label matching treated `Replay time` as a prefix for the timeline controls | 1 | Retried with the exact accessible label; the interaction passed. |
| The packaging helper was first invoked through an unavailable `bash` alias | 1 | Re-ran the unchanged helper through the installed Git Bash executable. |

## Phase 50 — Replay control hierarchy and map clustering

### Goal

Make Replay easier to operate by separating playback from layer filtering, enlarging the scrubber,
simplifying map controls and clustering crowded movement markers at regional zoom.

### Status

- [completed] Audit both Replay datasets, map controls, navigation and existing clustering behavior.
- [completed] Add failing behavior and rendered-contract tests.
- [completed] Implement the two-tier controls, movement clustering and compact icon controls.
- [completed] Run regressions, production build and owner-only deployment.

### Acceptance criteria

- Both Replay datasets use a two-tier control surface: playback/time first, layers and filters second.
- The scrubber is full width with an 8px track, a clear thumb and visible start/current/end labels.
- Replay shows standard vertical plus/minus controls with compact reset and fullscreen icon buttons;
  it does not show a zoom slider or percentage readout, while wheel zoom and the 50–1000% range remain.
- The movement map clusters nearby signals at regional zoom, shows the count, and expands the cluster
  when selected; high-zoom single-marker inspection keeps the existing People/Vehicle/direction detail.
- The map legend is a readable translucent card and the sidebar collapse control is icon-only with a
  descriptive accessible name and at least a 44px target.
- Mobile and desktop layouts do not clip the controls or cover most of the map.
- No dataset, detector, model, ontology, evidence weight, case workflow or GitHub-origin change.

### Assumptions and exclusions

- Clustering is a screen-space display projection, not a new evidence or ontology record.
- Selecting a cluster zooms the map; it does not select a misleading member signal.
- The existing Investigation Layers container remains the source of truth for detailed layer setup.
- No external map/clustering dependency and no removal of wheel/pinch-style map interaction.

### File-level plan

- `site/app/layerModel.mjs`, `site/tests/layer-model.test.mjs`: pure movement clustering behavior.
- `site/app/MovementCanvas.tsx`, `site/app/components/SensorReplayCanvas.tsx`: two-tier controls,
  timeline ticks, movement clusters and compact map actions.
- `site/app/components/OperatorNavigation.tsx`, `site/app/globals.css`: icon-only collapse and layout.
- `site/tests/rendered-html.test.mjs`, `site/tests/operator-console.test.mjs`: rendered UX contracts.
- `findings.md`, `progress.md`: decisions, verification and deployment evidence.

### Rejected major alternatives

- Do not add a third control bar or hide critical playback controls behind a drawer.
- Do not select the first signal inside a cluster as if it represented the whole cluster.
- Do not add a new map framework or change canonical Replay records.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| First full build found one extra CSS closing brace after the control rewrite | 1 | Removed the single unmatched brace; no design or behavior changed. |
| One mobile test still required the retired top-right sensor map controls | 1 | Updated it to enforce the new bottom-right Google-style control placement. |
| Independent review found a mobile legend/control overlap and a short cluster hit radius | 1 | Reserved mobile overlay space, constrained the legend beside the controls and made hit testing respect each marker radius. |

## Phase 49 — configurable movement icons

### Goal

Give People and Vehicle movement records clear, direction-preserving map icons and let an operator
choose a built-in icon or upload a browser-local custom icon while onboarding/editing a data source.

### Status

- [completed] Audit movement marker rendering, both onboarding surfaces and local persistence.
- [completed] Add failing behavior tests for icon selection, upload validation and persistence.
- [completed] Implement shared icon picker, source contract fields and map/source-row rendering.
- [completed] Run production regressions and publish the owner-only demo.

### Acceptance criteria

- Auto mode renders distinct People and Vehicle icons while retaining the signal direction cue.
- Add/Edit source in Replay and Add data source in Setup offer Auto, People, Vehicle and Custom icons.
- PNG/WebP uploads are size/type validated, previewed and stored only in the current browser draft.
- A source icon choice survives reload and is used consistently in the source row, map and filters.
- Invalid/oversized uploads fail visibly and never enter source storage.
- No evidence weight, dataset, model, ontology, alert/case or GitHub-origin change.

### Assumptions and exclusions

- Custom icons are device-local display preferences, not uploaded to a server or added to source data.
- Auto is the default and derives People/Vehicle only from the existing `transport_class` field.
- Custom source icons may replace the family pictogram, but the separate direction indicator remains.
- No arbitrary SVG/HTML upload; accept bounded PNG/WebP raster images only.

### File-level plan

- `site/lib/replaySourceWorkspace.mjs`, new icon helper: validate and persist local display fields.
- Shared icon picker/preview plus `SetupClient.tsx` and `MovementCanvas.tsx`: onboarding controls.
- Movement canvas and CSS: clear built-in glyphs, custom image projection and direction cue.
- `site/tests/*`: pure validation/persistence, rendered controls and movement-map behavior.
- `findings.md`, `progress.md`: decisions, verification and deployment evidence.

### Rejected major alternatives

- Do not remove direction arrows or rely on colour/letters P and V.
- Do not store uploaded images in canonical source records or a remote service.
- Do not accept unbounded files or active SVG content.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial multi-file plan insertion missed the exact heading context | 1 | Insert this phase directly before the verified Phase 48 heading. |
| A CSS excerpt command used the repository root instead of `site/` | 1 | Re-run scoped reads from the `site` directory; no files were changed. |
| First production build hit sandbox `spawn EPERM` | 1 | Re-ran the same build with approved process permission; it passed. |
| ESLint rejected synchronous custom-image cleanup in an effect | 1 | Store the loaded image with its URL and derive null for stale/missing URLs without a state-clearing effect. |
| System Python lacked the project's pandas dependency | 1 | Use the repository's existing `.venv` instead of changing dependencies. |
| Sandboxed pytest could not clean its exact temporary ACL | 1 | Re-ran the same `.venv` suite with bounded permission: 27/27 passed, then removed only that verified temp directory. |
| First archive command passed Windows drive paths to Git Bash tar | 1 | Re-ran the packaging script with MSYS `/c/...` paths; version 58 was saved successfully. |

## Phase 48 — unified Investigation Layers container

### Goal

Replace the separate August and April layer controls with one consistent Investigation Layers
container so every Replay investigation can add/select layers and independently turn them off.

### Status

- [completed] Audit both Replay layer implementations and reproduce the April Weather toggle bug.
- [completed] Add failing behavior tests for a shared container and deselectable Weather layer.
- [completed] Implement the shared container and migrate both movement and sensor investigations.
- [completed] Run regressions, production build and owner-only deployment.

### Acceptance criteria

- August movement and April storm investigations render the same `Investigation Layers` container,
  with the same open/close, layer count, selected state and add-source entry point.
- Every visible evidence layer can be selected and deselected. On 20 April, turning Weather off
  removes rainfall/flow/hydro readings from the map and current-values strip while movement remains.
- Rain, Flow and Hydro candidates remain optional subfilters; turning one on must also enable the
  weather evidence family without silently re-enabling unrelated layers.
- Switching investigations remounts the correct dataset and layer state without leaking selections
  from the previous investigation.
- Weather overview shows only the five packaged Wellington City locations; detailed Rain, Flow and
  Hydro selections retain their full investigation coverage. Rain uses a recognisable rain symbol.
- Existing source truth, retrospective-only movement boundary, post-event impact controls, map
  zoom/fullscreen, replay timing and mobile behavior do not regress.

### Assumptions and exclusions

- “Add layers” means selecting packaged/canonical investigation sources through the existing source
  workspace; it does not authorize downloading new data or creating external integrations.
- Layer state remains local UI state. No schema change, model retraining, alert/case mutation,
  ontology weight change or GitHub-origin push.

### File-level plan

- `site/tests/*`: shared-container and Weather-off behavior contracts.
- `site/lib/replayDataWorkspace.mjs`: pure deselectable evidence-filter state transition.
- `site/app/components/InvestigationLayersPanel.tsx`: shared container shell and controls.
- `site/app/MovementCanvas.tsx`, `site/app/components/SensorReplayCanvas.tsx`: migrate both Replay datasets.
- `site/app/globals.css`: one responsive container style; preserve current map geometry and controls.
- `findings.md`, `progress.md`: audit, verification and deployment evidence.

### Rejected major alternatives

- Do not keep two containers with matching titles; behavior must be shared.
- Do not make Weather a radio-only filter or hide all evidence through one global switch.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| PowerShell parsed the first source-anchor search pattern as syntax | 1 | Re-run the read-only search with a literal single-quoted pattern. |
| Full regression still expected the retired `Layer workspace` title | 1 | Updated the rendered behavior contract to the shared `Investigation Layers` name and reran all tests. |

## Phase 47 — August model-output Replay

### Goal

Make the 1–6 August WCC Transport Sensors investigation explicitly model-output first: source
observations are processed by the existing movement detector, and Replay operates on candidates
rather than presenting raw rows as map signals.

### Status

- [completed] Audit August source totals, candidate totals, model output and current Replay binding.
- [completed] Add failing contracts for explicit model metadata and accurate investigation counts.
- [completed] Update the replay generator, packaged artifact and concise investigation label.
- [completed] Run regressions, build and owner-only deployment.

### Acceptance criteria

- The August pack declares `movement-seasonal-mad-v1`, 284,556 input observations and 929
  candidate outputs for 1–6 August 2026.
- The August investigation label shows the model-output count, not 144 slots or the April
  209,334 → 2,903 figures.
- Replay map features come only from candidate signals; raw observed counts remain available only
  as candidate-level observed-versus-expected evidence.
- Model and UI truthfully retain batch publisher cadence and do not imply incident classification,
  live availability or general emergency accuracy.

### Assumptions and exclusions

- `observed_groups` are the detector input observations after canonical grouping and are not a
  unique-person count.
- No retraining, candidate recursion, fusion weight, new source, automatic alert/case or GitHub push.

### File-level plan

- `site/tests/*`, `tests/*`: model-output artifact and investigation-label contracts.
- `src/movement_anomaly/contract.py`: stable replay model/input/output metadata.
- `site/public/cop/v1/movement-replay.json`: regenerated/updated packaged August artifact.
- `site/lib/replayInvestigations.mjs`: accurate model-output investigation summary.
- `findings.md`, `progress.md`: decision and verification evidence.

### Rejected major alternatives

- Do not relabel April totals as August totals.
- Do not feed candidates back into the same detector or render every raw row on the map.

## Phase 46 — movement-first April Replay

### Goal

Restore the product's primary city-movement purpose in the April investigation: WCC pedestrian
and vehicle anomaly outputs are the first replay layer, while weather, river and post-event impact
records remain clearly separated supporting evidence.

### Status

- [completed] Audit the current April layer defaults, hierarchy, labels and truth boundaries.
- [completed] Add failing behavior tests for a default-on movement layer and movement-first evidence order.
- [completed] Implement automatic movement-layer loading, concise primary/supporting labels and page hierarchy.
- [completed] Run regressions, build and owner-only deployment.

### Acceptance criteria

- April Replay opens with movement outcomes selected and loads the packaged WCC movement model output
  without requiring the operator to discover it in Layers.
- The compact map controls and event details identify city movement as primary; rainfall, river flow
  and the hydro detector are supporting evidence, and post-event impacts remain withheld ground truth.
- The movement layer appears first in machine-readable and visible evidence-layer order.
- The UI states that 209,334 WCC source rows produced 2,903 movement candidates, while preserving
  `retrospective_outcome_only`, `event_time_evidence: false` and zero event-time evidence weight.
- Existing investigation switching, map controls, playback, source filtering and owner-only access do not regress.

### Assumptions and exclusions

- “Primary” means primary investigation subject and model output, not a claim that monthly WCC data
  was available during the storm.
- Hydro observations remain valid event-time supporting evidence and are not removed.
- No model retraining, new data source, fusion weight, automatic case/alert or GitHub-origin push.

### File-level plan

- `site/tests/*`: movement-first order, default visibility, wording and truth-boundary contracts.
- `site/app/components/SensorReplayCanvas.tsx`: default movement load and compact layer hierarchy.
- `site/app/replay/page.tsx`, `site/lib/replayInvestigations.mjs`: movement-first investigation copy.
- `site/public/cop/v4/april-storm-event-pack.json`: evidence presentation order only.
- `findings.md`, `progress.md`: decisions, verification and deployment evidence.

### Rejected major alternatives

- Do not hide the weather evidence or make movement outputs look event-time live.
- Do not merge movement and hydro values into one score or retrain the ontology.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| A standalone Windows build was blocked by sandbox child-process `EPERM` | 1 | Re-run the same scoped build outside the restricted process sandbox; it completed, then the full approved test workflow passed. |
| The Sites packaging helper was first invoked through an unavailable `bash` command | 1 | Use the verified Git for Windows Bash executable with the same official packaging helper. |

## Phase 45 — April hydro-weather evidence enrichment

### Goal

Expand the April Storm investigation with reproducible official sensor history and a truthful
hydro-weather detector output, then connect the resulting evidence layers to Replay without mixing
post-event labels, mock records or the unrelated movement model into event-time scoring.

### Status

- [completed] Audit existing April packs, sensor endpoints, model artifacts and Replay contracts.
- [completed] Verify and retrieve additional eligible April sensor series with coordinates and time provenance.
- [completed] Add failing tests for cutoff-safe detector output, evidence linkage and layer selection.
- [completed] Build the enriched pack, hydro detector projection and investigation UI.
- [completed] Run data validation, regressions, build and owner-only deployment.

### Acceptance criteria

- Replay exposes materially more official April rain/river evidence than the current three series,
  with source, coordinates, units, `observed_at`, conservative `available_at` and data-quality state.
- A hydro-domain robust detector uses only records before the event cutoff to establish its baseline;
  it never consumes post-event reports, mock data, movement-model outputs or later human labels.
- Every detector output declares model ID/version, source domain, baseline window/sample count,
  threshold, uncertainty/coverage and its `available_at`; it remains an investigation signal only.
- April Storm Replay can select sensor, anomaly, official impact and ground-truth/context layers
  independently, with non-event-time layers visibly excluded from scoring.
- Evidence links show supporting, contradicting, missing and context/ground-truth states without
  converting the case into a confirmed incident or general accuracy claim.
- Existing Replay investigations, Live Operations, ontology, source truth and owner-only access do not regress.

### Key assumptions and exclusions

- The existing fitted artifact is a movement/countline baseline. It is not valid for rainfall or
  river-flow values and will not be reused across domains merely to satisfy a “pre-trained” label.
- The hydro expert may be fitted only on eligible pre-event sensor history and will be labelled a
  prototype/un-calibrated domain detector unless an existing governed hydro artifact is found.
- News, committee reports, final impacts and timestamp-uncertain road outcomes are ground truth or
  context only; mock/provider-shaped records remain zero weight.
- No automatic Incident, COP, external ticket, warning, dispatch or GitHub-origin push is authorised.

### File-level implementation plan

- `scripts/`, `src/movement_anomaly/`, `tests/`: reproducible historical sensor retrieval,
  normalization and cutoff-safe hydro detector projection.
- `site/public/cop/v4/`: enriched observation, detector-output and evidence-link packs.
- `site/lib/`, Replay components and CSS: layer projection, investigation evidence summary and controls.
- Site and Python tests: data truth, leakage guards, model metadata and user-visible layer behavior.
- `README.md`, `docs/model-card.md`, `findings.md`, `progress.md`: provenance and limitations.

### Rejected major alternatives

- Do not feed rainfall/flow into the WCC movement model or concatenate unlike units into one model.
- Do not treat the April case alone as accuracy, calibration or a production-ready warning model.
- Do not make every sensor row a review ticket; group evidence by place, series and event window.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial PowerShell summary looked for a non-existent top-level `observations` array | 1 | Inspect and consume the pack's declared `series[].observations` structure instead. |
| `agent-reach` executable is unavailable in this workspace | 1 | Use the official-source web/search tools and direct verified provider endpoints as the bounded fallback. |
| Web reader rejected raw GitHub/Hilltop query URLs as unsafe/cache misses | 1 | Query the same public Hilltop provider directly with bounded read-only HTTP requests. |
| First multi-site PowerShell probe ended with an invalid pipeline after `foreach` | 1 | Collect rows explicitly, then format the completed array; do not repeat the invalid pipeline form. |
| Corrected probe parsed measurements at the wrong XML path and returned empty lists | 1 | Use `HilltopServer.DataSource.Measurement`; raw response verified the provider schema. |
| First April coverage summariser piped directly after `foreach`, causing a PowerShell parser error | 1 | Assign the loop output to `$results`, then serialize it separately. |
| Hilltop history response arrived as `System.Byte[]`, so direct `[xml]` casting failed | 1 | Decode response bytes as UTF-8 before parsing XML; no failed-row output is accepted. |
| Full 120-hour April movement replay exceeded the first 180-second command limit | 1 | Regression tests passed; rerun the deterministic local build with a larger bounded timeout. |
| Full Python suite could not access the default Windows pytest temp ACL | 1 | Re-run with a verified project-local `--basetemp` outside the sandbox; 27/27 passed, then remove it. |


## Phase 41 — Replay layer controls and event symbols

### Goal

Make the Replay map open without obstructive overlays, restore adjustable data layers, and give
each operational event family a consistent, readable map symbol.

### Status

- [completed] Inspect deployed Replay overlap, current symbols, and existing layer contracts.
- [completed] Add failing behavior tests for default panel state, layer adjustment, and symbol mapping.
- [completed] Implement compact layer controls and a consistent non-emoji event symbol system.
- [completed] Verify Replay switching, keyboard/touch access, mobile/landscape layout, and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Replay opens map-first: optional panels are collapsed and neither the toolbar nor map controls
  cover the default focal markers.
- A single compact Layers control can independently show/hide the dataset's compatible layers;
  hidden layers are excluded from both map markers and keyboard-accessible records.
- Weather/sensor, flood/water, earthquake, warning, road/access, transit, flight, cruise, city event,
  report and movement families have distinct, consistent vector/text symbols with accessible names.
- Icons remain legible without relying on colour alone and do not claim a source or event type that
  is absent from the active dataset.
- Existing source truth, cutoff rules, search, playback and investigation switching do not regress.

### Assumptions and exclusions

- “Default overlaps” means controls/panels obscure map content at initial load; the base map itself
  remains OpenStreetMap.
- Icons identify event families, not severity or confirmation. Mock/context sources keep their
  existing truth labels and zero evidence weight.
- No new data source, evidence score, model, schema, external write or GitHub-origin push is added.

### File-level plan

- Replay map components and shared map helpers: layer state, compatible layer projection and symbols.
- `site/app/globals.css`: compact layer picker, marker tokens and responsive placement.
- `site/tests/*`: observable layer filtering, symbol semantics and rendered accessibility contracts.

### Rejected major alternatives

- Do not load every source into every investigation or invent unavailable flight/event observations.
- Do not use emoji, colour-only distinctions, permanently open panels, or overlapping floating cards.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Existing controlled-tab list was empty after the previous task finalized it. | 1 | Claimed the user-visible Replay tab instead of opening a duplicate. |
| Browser element screenshot helper required coordinates rather than a locator. | 1 | Continue with the complete DOM plus later viewport QA; do not repeat the unsupported locator call. |
| Direct Node test runner could not spawn a worker inside the restricted sandbox. | 1 | Re-run the same read-only test with the approved test permission outside the sandbox. |
| A sensor checkbox read `event.currentTarget` inside the deferred React state updater and crashed after the event was released. | 1 | Capture `checked` synchronously, pass it through a pure immutable selection helper, and add a regression test. |
| Bottom-anchored sensor legend/readings crossed the fixed mobile navigation before the map was fully scrolled into view. | 1 | Anchor mobile attribution, zoom, legend and readings in one non-overlapping top stack; verify their rectangles at 375px. |

## Phase 40 — reliable Replay/Live data binding and compact controls

### Goal

Ensure every packaged investigation and current Live record can reach its intended UI,
make switching/searching update immediately, and merge repeated replay status into one line.

### Status

- [completed] Reproduce Replay switching, Live search and deployed data-feed failures.
- [completed] Add failing data-binding, search and compact-toolbar behavior tests.
- [completed] Fix investigation-to-dataset binding and searchable Live source/record fields.
- [completed] Consolidate duplicate Replay date/status/playback information into one toolbar.
- [completed] Verify all routes, production data endpoints, accessibility and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Switching between April Storm and August Movement immediately changes the displayed dataset,
  date range, count, sources and playback state without requiring a page reload.
- Live search can find records by title, source name/ID, kind, place and key displayed values;
  loading, no-match and upstream-error states remain distinct.
- Every observation returned by the current snapshot and every packaged Replay observation is
  either displayed by its compatible module or explicitly counted as non-playable with a reason.
- Replay presents investigation, selected time, counts, speed and playback actions in one compact
  row; duplicated floating status/date cards are removed.
- Data truth, `available_at`, mock exclusion, evidence weight and human-authority rules do not change.

### Assumptions and exclusions

- “Refresh” means UI state follows the selected investigation/current snapshot; it does not make
  monthly WCC transport history into a live feed.
- April hydro-weather and August movement remain typed, separate datasets with compatible views.
- No new source, model, evidence score, schema, external write or GitHub-origin push is introduced.

### File-level plan

- `site/lib/replayInvestigations.mjs`, replay data/model helpers: investigation-to-dataset binding.
- `site/app/components/ReplayInvestigationSelector.tsx`, `MovementCanvas.tsx`: switch state and toolbar.
- `site/lib/liveMapWorkspace.mjs`, `LiveOperationsClient.tsx`: complete search projection and states.
- `site/tests/*`: switching, search, data coverage and rendered compact-toolbar behavior.
- `site/app/globals.css`: one-line desktop toolbar and responsive wrapping.

### Rejected major alternatives

- Do not merge rainfall, flow and movement into one untyped series.
- Do not fake refresh by changing labels while leaving the underlying dataset unchanged.
- Do not hide unmatched or non-playable records without a visible count/reason.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Generic web reader rejected the private Sites/API URLs as unsafe. | 1 | Switch to the authenticated in-app browser for deployed UI/API verification. |

## Phase 38 — unified map-first Live workspace

### Goal

Combine Evidence Inbox, Map and zero-weight city context into one map-first Live Operations
workspace that remains readable under load and works like a familiar consumer map.

### Status

- [completed] Audit the current Live view, map interaction and rendered contracts.
- [completed] Add failing unified-workspace, overlay and responsive behavior tests.
- [completed] Implement the large map, compact inbox, layer picker and map detail card.
- [completed] Verify build, accessibility, regressions and source-truth boundaries.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Live Operations opens directly on one large street map; Inbox and Context are map overlays,
  not separate primary views.
- A compact left panel groups promoted candidates and raw/source health without covering most
  of the map; it can collapse to a single control.
- A layer control can independently show/hide primary evidence, sensors, access impacts and
  planned city context. Mock/context records remain visibly zero weight.
- Nearby points are grouped at broad zoom and individual street-level markers remain selectable
  after zooming; hover is optional and every detail is keyboard/click accessible.
- Selecting an inbox item or map marker opens one concise detail card with source, freshness,
  evidence state and review action.
- Existing 50–1000% zoom, pan, fullscreen, attribution, source truth, candidate gating and
  Signal Review handoff do not regress.
- Desktop uses a map-first overlay layout; mobile uses a large map plus bottom-sheet style
  inbox/detail surfaces without horizontal overflow.

### Assumptions and exclusions

- This is a presentation and interaction refactor over existing normalized Live data.
- No Google Maps or paid Google API is added; the existing OpenStreetMap basemap stays.
- No new data source, evidence score, model training, alert rule or external write is introduced.
- Context layers never become incident evidence; Mock remains zero weight.
- GitHub origin and remote `main` remain unchanged.

### File-level plan

- `site/tests/operator-console.test.mjs`, `site/tests/integration-model.test.mjs`: unified map,
  overlay selection and truth-boundary contracts.
- `site/app/components/LiveOperationsClient.tsx`, `site/app/components/LiveMap.tsx`: map-first
  composition, collapsible inbox, layer picker and shared selection.
- `site/app/globals.css`: large-map layout, overlay panels, responsive bottom sheets and focus.
- `README.md`, `findings.md`, `progress.md`: operator workflow and verification evidence.

### Rejected major alternatives

- Do not keep three equal tabs; they fragment one operator task.
- Do not copy Google Maps branding, tiles or commercial APIs.
- Do not render every raw record as an alert marker or force staff to inspect 1,000 signals.
- Do not make hover the only way to inspect evidence.

## Phase 37 — selectable Replay investigations

### Goal

Let an operator select a packaged historical case or create a browser-local investigation
draft, then open Replay with an explicit case, time window, source and availability cutoff.

### Status

- [completed] Audit Replay, case handoff, April event pack and existing source workspace.
- [completed] Add and verify failing investigation-catalogue and rendered-workflow tests.
- [completed] Implement the compact investigation selector and local draft flow.
- [completed] Verify behavior, accessibility, build and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Replay opens with an Investigation selector before dataset summary and playback surfaces.
- April Storm is a selectable packaged case with its 18–22 April window, GWRC Hilltop as
  primary source, 1,683 sensor rows and an `available_at` cutoff.
- August movement review remains a separate selectable packaged investigation.
- New investigation creates a browser-local draft with title, start, cutoff and primary
  source, then opens a Replay URL carrying those values.
- A local investigation is labelled as a draft and never creates an Incident, COP, evidence
  fact, external ticket or dispatch.
- The selector has visible labels, keyboard operation, 44px controls, submit feedback and a
  responsive single-column layout.

### Assumptions and exclusions

- Packaged and local investigations are Replay contexts, not authoritative case records.
- April hydro-weather data and August movement data keep separate playback contracts; no
  cross-unit chart or invented combined score is added.
- Drafts use the existing device-local prototype boundary; no D1 schema or account storage.
- No model training, new feed, external write, GitHub-origin push or remote-main mutation.

### File-level plan

- `site/tests/integration-model.test.mjs`: catalogue, validation, URL and canonical-ID guards.
- `site/tests/operator-console.test.mjs`: selector order, April option and draft form contract.
- `site/lib/replayInvestigations.mjs`: pure packaged/draft investigation model.
- `site/app/components/ReplayInvestigationSelector.tsx`: selection and local draft workflow.
- `site/app/components/ReplayCaseContext.tsx`, `site/app/replay/page.tsx`: query context and case binding.
- `site/app/globals.css`, `README.md`, `findings.md`, `progress.md`: compact UI and handoff.

### Rejected major alternatives

- Do not treat investigation selection as Incident/COP creation.
- Do not overwrite packaged April metadata with editable local values.
- Do not feed April rainfall/flow into the August movement chart without a typed adapter.

## Phase 36 — evidence-first live triage and April sensor replay

### Goal

Make Live Operations useful under high signal volume: aggregate raw telemetry, promote only
review-worthy multi-source or authoritative hazard evidence, expose planned city demand as
zero-weight context, and add real April 2026 hydro-weather observations to Replay Analyzer.

### Status

- [completed] Audit the Live, Signal Review, map, source and Replay contracts.
- [completed] Verify the shared GIS catalogue and the exact Hilltop historical query contract.
- [completed] Add failing evidence-triage, UI, zoom and replay-pack tests.
- [completed] Implement the evidence inbox, context cards, candidate noise gates and 1000% map.
- [completed] Build and bind the real April Hilltop observation pack.
- [completed] Verify all behavior, data truth, build and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Live Operations opens on Evidence Inbox before the map and raw source views.
- Operators review promoted candidates, not every source record; the UI shows how many raw
  records were grouped or suppressed.
- Official hazard/warning evidence, sensor anomalies and a report plus a time/space-aligned
  sensor anomaly may be promoted. A standalone road event or planned activity may not.
- Weather, river and coastal sensors are visibly primary monitoring sources. City events,
  cruise calls and airport arrivals/departures are visible as context with mock/access truth.
- Signal Review opens each selected signal on Evidence before Case & COP.
- Live and Replay maps support 50/70% through 1000% zoom, panning, fullscreen and real
  OpenStreetMap street labels with attribution.
- Replay ships actual 18–22 April Hilltop rows for two rainfall series and Hutt River flow,
  with explicit `observed_at`, conservative derived `available_at`, units and coordinates.
- WCC April movement rows remain retrospective outcome data because the publisher cadence is
  at least monthly; they are not represented as event-time live evidence.

### Assumptions and exclusions

- No new model is fitted. Current rules create review candidates only; humans confirm cases.
- Mock, context-only, unknown-time and post-event records keep zero score weight.
- No City Event, airport or cruise publisher data is republished without clearance; provider-
  shaped mock envelopes remain visibly labelled.
- No standalone road/access observation enters the review queue unless corroborated.
- No GitHub-origin push or remote-main mutation.

### File-level plan

- `site/tests/integration-model.test.mjs`, `site/tests/operator-console.test.mjs`,
  `site/tests/layer-model.test.mjs`: triage, rendering and zoom contracts.
- `tests/test_build_april_hilltop_pack.py`: historical Hilltop pack parser and time policy.
- `site/lib/dataIntegration.mjs`, `site/lib/providerFixtures.mjs`, `site/worker/index.ts`:
  evidence inbox, candidate promotion and context envelopes.
- `site/app/components/LiveOperationsClient.tsx`, `LiveMap.tsx`, `AlertCentreClient.tsx`,
  `site/app/globals.css`: evidence-first operator flow and map controls.
- `scripts/build_april_hilltop_pack.py`, `site/public/cop/v4/*`, `site/app/replay/page.tsx`:
  reproducible real sensor replay pack and visible data status.
- `README.md`, `findings.md`, `progress.md`: source truth and delivery evidence.

### Rejected major alternatives

- Do not send every gauge, closure, event and schedule item to human review.
- Do not use road events as the default primary evidence domain.
- Do not claim WCC hourly transport counts are live when the source refresh is monthly.
- Do not infer incident truth from event, cruise or flight schedules.

## Phase 35 — ontology-aware fusion architecture

### Goal

Replace the Ontology change timeline with a compact, interactive architecture view that
shows how domain-specific detectors, ontology alignment and a calibrated late-fusion model
produce a human-reviewed alert candidate.

### Status

- [completed] Audit the current graph, user reference, data boundaries and project instructions.
- [completed] Add failing behavior tests for the fusion architecture and safety boundaries.
- [completed] Implement the interactive domain-to-decision architecture and remove timeline semantics.
- [completed] Add the durable model/ontology rules to project `AGENTS.md` and update project docs.
- [completed] Verify build, behavior, accessibility and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- The Knowledge graph view no longer calls itself an Ontology or Change timeline.
- The view shows domain experts for hydro/weather, movement, official status, text reports,
  planned context and post-event news, each with its training boundary.
- Ontology is presented as an untrained semantic alignment and evidence-rule layer.
- A small calibrated late-fusion model combines eligible expert outputs; it does not retrain
  all raw feeds together and must use leakage-safe time splits / out-of-fold predictions.
- LLM explanation has score weight `0`; mock and post-event news are excluded from training.
- The resulting object remains a candidate requiring human review, never an automatic incident
  confirmation or public warning.
- Zoom, expand/collapse, focused node inspection and keyboard/touch accessibility remain.

### Assumptions and exclusions

- This phase changes the architecture presentation and durable engineering rules only.
- No model is fitted, no weights are estimated and no production detector/output is changed.
- Existing source truth, access/cost labels, evidence weights, six-layer operational chain,
  routes, APIs and owner-only access remain unchanged.
- The project currently has no project-level `AGENTS.md`; create one under the repository root
  rather than changing the parent Workstation instructions.
- No GitHub-origin push or remote-main mutation.

### File-level plan

- `site/tests/integration-model.test.mjs`: pure fusion-stage and domain-training contracts.
- `site/tests/operator-console.test.mjs`: rendered architecture, controls and authority boundary.
- `site/lib/dataIntegration.mjs`: deterministic ontology-aware fusion projection.
- `site/app/components/OntologyDashboard.tsx`: replace timeline markup with architecture graph.
- `site/app/globals.css`: compact tree/flow layout and responsive disclosure.
- `AGENTS.md`, `README.md`, `findings.md`, `progress.md`: durable model rules and handoff.

### Rejected major alternatives

- Do not train the ontology or treat it as a learned weight layer.
- Do not concatenate every source into one monolithic training table.
- Do not use LLM output, mock data or post-event news as alert-score inputs.
- Do not remove the separate operational hierarchy or source inspector.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Recursive `AGENTS.md` search entered a protected pytest cache and failed. | 1 | Re-ran a bounded `rg --files` search with cache and dependency exclusions. |
| First sandboxed W3C fetch returned no content. | 1 | Re-ran the same read-only Jina fetch with bounded network approval. |
| Sandboxed Node test runner could not start its per-file workers (`EPERM`). | 1 | Re-ran the same focused RED tests outside the restricted sandbox. |
| Sandbox denied removal of the verified pytest temp directory. | 1 | Removed only the resolved repository-local `.pytest_tmp_phase35` path with bounded approval. |
| First Sites archive placed the build contents at archive root instead of under `dist/`. | 1 | Repackaged the same verified build with `dist/server/index.js` and `dist/.openai/hosting.json`; version save then succeeded. |

## Phase 34 — Signal Review queues and classification

### Goal

Rename the operator-facing Alert Centre to Signal Review and give staff a clear
triage lifecycle with queue views and human outcome classification.

### Status

- [completed] Audit current queue state, draft persistence, navigation and model boundaries.
- [completed] Add failing model and rendered behavior tests.
- [completed] Implement queue grouping, workflow cues and classification guidance.
- [completed] Rename the operator-facing module without changing technical identifiers.
- [completed] Verify behavior, accessibility, build and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- The user-facing module name is Signal Review across navigation and operator surfaces.
- Queue views are New, Active, Closed and History with visible counts.
- New maps to open; Active maps to investigating/needs-action; Closed maps to closed;
  History is an all-records view, never a mutable workflow status.
- The detail view shows the lifecycle Signal → Candidate → Investigate → Outcome.
- Human classification supports True Positive, Benign Positive, False Positive and
  Undetermined with a short meaning and next step.
- Classification persists in the existing browser-local review draft and is never
  presented as automatic model retraining or production ground truth.
- Mock records and Undetermined outcomes are explicitly excluded from training feedback.

### Assumptions and exclusions

- “Historical” means a searchable view over prior tickets, not a fifth case status.
- Existing internal route, API and ontology identifier `alert_centre` remain stable;
  only user-facing labels become Signal Review.
- This prototype keeps localStorage persistence. No D1 migration, shared queue, external
  WCC ticket write, model fit, weight update or automated learning job is added.
- Classification is staff feedback for later governed review; it does not override
  evidence, confirm an incident or issue a warning.

### File-level plan

- `site/lib/signalReview.mjs`: queue mapping, classification catalogue and training boundary.
- `site/tests/integration-model.test.mjs`: pure queue/classification contracts.
- `site/tests/operator-console.test.mjs`: rendered workflow, queue tabs and editable field.
- `site/app/components/AlertCentreClient.tsx`: queue tabs, workflow and classification UI.
- `site/app/components/OperatorNavigation.tsx`, route/integration/ontology labels: rename visible module.
- `site/app/globals.css`: compact queue tabs, workflow steps and guidance panel.
- `README.md`, `findings.md`, `progress.md`: document workflow and safety boundary.

### Rejected major alternatives

- Do not use “History” as an editable status or duplicate Closed records into a new state.
- Do not call the module “Incident Centre”; candidates are not confirmed incidents.
- Do not feed a local reviewer selection directly into training, calibration or weights.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|

## Phase 33 — compact alert signal details

### Goal

Reshape each Alert Centre signal into a compact issue-details workspace: investigation
content on the left and a tidy, persistent field rail on the right.

### Status

- [completed] Audit current alert fields, forms, responsive rules and rendered contracts.
- [completed] Add a failing behavior test for the issue-details workspace.
- [completed] Implement the compact field rail and investigation layout.
- [completed] Verify behavior, accessibility, build and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- The ticket queue, search and status filter remain unchanged.
- The selected signal has named Investigation content and Signal details regions.
- System severity, source, observed time, evidence state and authority stay read-only.
- Review status, incident status, assignee and next review remain clearly labelled and editable.
- Case notes, evidence, warning preparation, activity and Replay handoff keep their behavior.
- Controls retain visible labels, 44px targets and a single-column mobile fallback.

### Assumptions and exclusions

- “Like Jira” means a dense issue layout and label/value field rail, not a visual clone.
- This is a presentation-only refactor: no API, schema, local-storage, workflow, evidence,
  alert authority, model or data-source behavior changes.
- No new dependency, tutorial copy, external write or GitHub push is added.

### File-level plan

- `site/tests/operator-console.test.mjs`: rendered structure and editability contract.
- `site/app/components/AlertCentreClient.tsx`: investigation region and detail field rail.
- `site/app/globals.css`: compact desktop rail, labelled fields and mobile stacking.
- `README.md`, `findings.md`, `progress.md`: record the UI boundary and verification.

### Rejected major alternatives

- Do not duplicate Jira branding or add a third-party component library.
- Do not make system severity, evidence state or decision authority editable.
- Do not hide safety-critical truth labels behind a disclosure control.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| The first narrow UI guidance search returned no database match. | 1 | Retried with broader accessibility, form-label and touch-target terms; used the returned high-priority guidance. |
| Sandboxed Node test runner could not start its test worker (`EPERM`). | 1 | Re-ran the same focused behavior test outside the restricted sandbox and confirmed the intended RED failure. |
| Sandboxed vinext build could not spawn its Windows dependency resolver (`EPERM`). | 1 | Re-ran the same bounded production build outside the restricted sandbox. |

## Phase 32 — Replay investigation source workspace

### Goal

Give investigators one compact Replay workspace where they can choose the sources
used for a case, add or edit a source draft, and assign each source to Replay,
Live Operations or Alert Centre without changing the canonical source registry.

### Status

- [completed] Audit Replay, source registry, onboarding controls and route contracts.
- [completed] Add failing behavior tests for selection, editing and module assignment.
- [completed] Implement the investigation source workspace and compact responsive layout.
- [completed] Verify behavior, accessibility, build and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Replay lists available sources with clear live/mock/auth/cost and active/inactive state.
- An investigator can include or exclude a source from the current Replay investigation.
- Add and Edit use the same short form with source name, source ID, status and modules.
- Module assignment supports Replay Analyzer, Live Operations and Alert Centre.
- Saved investigation drafts remain device-local and are visibly distinguished from
  canonical registry records; no draft is treated as evidence or a live connection.
- Controls have visible labels, 44px targets, keyboard names and responsive layout.

### Assumptions and exclusions

- “Add” means configure an investigation source draft, not connect or authenticate a
  provider automatically. Existing source truth and licensing labels remain authoritative.
- Device-local persistence is appropriate for this owner-only prototype; no D1 schema,
  account model, credentials, external write, model training or new data feed is added.
- Module assignment controls routing intent only; it does not send alerts or mutate Live.
- GitHub origin and remote `main` remain unchanged; deploy only through private Sites.

### File-level plan

- `site/tests/integration-model.test.mjs`: pure source-draft validation and routing tests.
- `site/tests/operator-console.test.mjs`: rendered Replay onboarding and accessibility contract.
- `site/lib/replaySourceWorkspace.mjs`: normalize registry sources and validate local drafts.
- `site/app/components/ReplaySourceWorkspace.tsx`, `site/app/replay/page.tsx`: source list,
  add/edit form, module assignment and browser-local persistence.
- `site/app/globals.css`: compact table/card layout and mobile stacking.
- `README.md`, `findings.md`, `progress.md`: record boundaries and verification.

### Rejected major alternatives

- Do not make the canonical public registry editable from an investigation page.
- Do not imply that a typed URL is connected, licensed, live or safe for alerting.
- Do not add a database or authentication migration for a demo-only local workspace.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Looked for `.openai/hosting.json` at repository root, but this project stores it under `site/.openai/hosting.json`. | 1 | Located and read the existing nested Sites configuration; no configuration change required. |
| First findings patch used a wrapped sentence as an anchor and did not match the current file. | 1 | Located the Phase 32 section directly and applied a section-local patch. |
| Sandboxed vinext build could not spawn its Windows dependency resolver (`EPERM`). | 1 | Re-run the same bounded build outside the restricted sandbox, matching prior verified phases. |
| Sandboxed Node test runner could not spawn its per-file workers (`EPERM`). | 1 | Re-run the same two focused test files outside the restricted sandbox. |
| Full regression found that an unused `module_count` field changed the established `sourceLayerState` return contract. | 1 | Removed the unused field; module membership remains on the source record where filtering and rendering consume it. |
| ESLint rejected a synchronous status-state update inside the localStorage synchronization effect. | 1 | Removed the redundant success update and deferred the exceptional failure notice from the external-system effect. |
| The Sites packaging helper requires Bash, which is not installed in this Windows workspace. | 1 | Reproduce the helper's bounded staging contract with native PowerShell and `tar`, then inspect both required archive entries. |
| Windows `tar.exe` could not open an absolute archive path containing non-ASCII workspace characters. | 1 | Keep the verified staging directory and rerun `tar` with ASCII-only relative paths from the repository working directory. |

## Phase 31 — quiet daily-work interface

### Goal

Remove tutorial-style and AI-explanatory copy from every operator route, then tighten
the shared layout into a calm, familiar work surface comparable to mainstream issue
trackers and productivity suites without changing operational behavior.

### Status

- [completed] Audit every rendered route and relevant mainstream interaction patterns.
- [completed] Add failing behavior tests for concise shared chrome and page-level copy budgets.
- [completed] Implement compact labels, progressive disclosure and consistent spacing.
- [completed] Verify behavior, accessibility, responsive layout and regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- `/`, `/live`, `/alerts`, `/replay`, `/integration`, `/ontology` and `/setup` contain
  no tutorial paragraphs, feature explanations or AI-style narrative headings.
- Page title, current status, primary action, field labels, errors, provenance, licensing,
  freshness and human-authority boundaries remain available where operationally required.
- Navigation, filters, maps, replay, cases, setup, ontology disclosure and integration
  controls keep their current behavior and keyboard-accessible names.
- Repeated cards and section chrome use one compact hierarchy, restrained borders and
  consistent density across desktop and mobile.
- Empty/loading/error states stay explicit; no meaning depends on icons, hover or colour.

### Assumptions and exclusions

- “Remove explanations” means remove instructional/promotional prose, not safety truth,
  evidence labels, field names, status messages, source attribution or accessibility text.
- Preserve all existing routes, source/mock/auth/cost distinctions, evidence rules and
  human approval gates.
- No new source, model, ontology rule, API, dependency, icon library or workflow behavior.
- No public sharing and no GitHub-origin push; use the existing owner-only Sites project.
- Browser interaction testing is not requested; rendered contracts, build and regressions
  are the verification boundary.

### File-level plan

- `site/tests/operator-console.test.mjs`, `site/tests/rendered-html.test.mjs`: concise
  shell and route-level copy contracts before implementation.
- `site/app/components/OperatorShell.tsx`, `OperatorNavigation.tsx`: shared compact chrome.
- Route clients and page components: remove explanatory prose while preserving controls,
  field labels, state, provenance and authority boundaries.
- `site/app/globals.css`: normalize spacing, panels, headings and dense responsive flow.
- `README.md`, `findings.md`, `progress.md`: record the information-removal boundary.

### Rejected major alternatives

- Do not remove visible labels in favor of ambiguous icon-only controls.
- Do not hide safety, licensing or data-truth information merely to reduce word count.
- Do not replace the existing civic design system or rebuild working workflows.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `agent-reach doctor` executable was not available on PATH. | 1 | Used the skill's zero-config Exa route directly; all three official-design searches completed successfully. |
| Sandboxed Vite/Node verification could not spawn child processes (`EPERM`). | 1 | Re-run the same bounded build/test command with the existing test approval outside the restricted sandbox. |
| First Movement Canvas copy patch used stale wrapper class anchors. | 1 | Locate the exact current JSX blocks and apply smaller targeted hunks. |
| First full verification ran root Workstation tests and found no root `lint` script instead of targeting the nested site package. | 1 | Root 390 tests and Python 22 tests passed; re-run lint and the full site suite with the explicit `site` package prefix. |

## Phase 30 — expandable ontology change timeline

### Goal

Recompose the six-layer Knowledge graph as a clean vertical timeline that shows
how a record changes through the evidence workflow, with `+`/`−` drill-down for
second-level nodes.

### Status

- [completed] Audit the reference image and existing six-layer graph contracts.
- [completed] Add failing behavior tests for timeline order, change labels and collapsed detail.
- [completed] Implement the vertical timeline and accessible per-layer disclosure.
- [completed] Verify regressions and responsive/accessibility contracts.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Knowledge graph displays the same six ordered architecture layers on one vertical spine.
- Every layer states the transformation outcome from source record to human decision.
- All second-level detail is collapsed initially; each row has a 44px `+` button that
  becomes `−` while expanded, with labelled `aria-expanded`/`aria-controls` behavior.
- Expand all, Collapse all and 60–160% zoom remain available.
- Expanded source, concept, module and authority nodes still update the existing inspector.
- Workflow sequence is explicitly not a historical event log or evidence assertion.

### Assumptions and exclusions

- “Timeline” is a workflow-change timeline, not invented dated ontology history; the
  repository has no authoritative ontology change-event ledger to present as dates.
- Six top-level layers always remain visible; only second-level nodes are disclosed.
- Preserve source truth, concept filtering, direct-neighbour inspection, evidence rules,
  human authority, routes and access policy.
- No new data, graph database, detector, model, dependency, external action or GitHub push.
- Browser interaction testing was not requested; rendered behavior, build and regressions
  are the verification boundary.

### File-level plan

- `site/tests/integration-model.test.mjs`: exact six transformation labels.
- `site/tests/operator-console.test.mjs`: timeline structure and initial `+` disclosure state.
- `site/lib/dataIntegration.mjs`: presentation-only transformation labels.
- `site/app/components/OntologyDashboard.tsx`: timeline markup and collapsed default.
- `site/app/globals.css`: vertical spine, markers, nested detail and mobile flow.
- `README.md`, `findings.md`, `progress.md`: record the workflow-timeline boundary.

### Rejected major alternatives

- Do not fabricate dates, versions or ontology change events.
- Do not remove zoom, concept filters or the evidence inspector.
- Do not add a timeline/graph package for six deterministic stages.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| First combined test patch used an operator-test anchor inside the model-test file. | 1 | Split the patch by file and apply each behavioral contract at its exact current block. |

## Phase 29 — six-layer ontology knowledge graph controls

### Goal

Show the complete six-layer City Ontology architecture in the Knowledge graph
view, with bounded zoom and accessible expand/collapse controls.

### Status

- [completed] Audit the existing graph projection, dashboard and rendered contracts.
- [completed] Add failing behavior tests for six ordered layers, zoom bounds and disclosure controls.
- [completed] Implement the graph projection, controls and responsive canvas.
- [completed] Verify regressions and accessibility contracts.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Knowledge graph renders all six ordered layers: Sources, Alignment, Ontology,
  Corroboration, Modules and Human decision.
- Visible `−` and `+` controls change a bounded Zoom level; Reset returns to 100%.
- Operators can expand or collapse every layer individually and all layers together.
- Controls are keyboard-operable, labelled, at least 44px, and do not depend on hover or colour.
- Workflow connectors are explicitly presentation structure, not inferred evidence.
- Operational chain, source truth, evidence rules and human authority remain unchanged.

### Assumptions and exclusions

- “All 6 layer” means the six architecture layers remain visible together; detail
  inside each layer can be progressively disclosed to prevent a 33-source hairball.
- The selected ontology concept scopes source and relationship detail without hiding layers.
- This is a presentation projection only. No new ontology facts, source, detector,
  graph database, model training or external action is added.
- No GitHub push and no change to remote `main`.
- Browser interaction testing was not requested; rendered behavior, build and regressions
  are the verification boundary.

### File-level plan

- `site/tests/integration-model.test.mjs`: pure six-layer projection and zoom bounds.
- `site/tests/operator-console.test.mjs`: rendered controls, order and authority guardrail.
- `site/lib/dataIntegration.mjs`: deterministic six-layer display projection and zoom helper.
- `site/app/components/OntologyDashboard.tsx`: graph controls, disclosure and layer canvas.
- `site/app/globals.css`: responsive six-layer graph and accessible control states.
- `README.md`, `findings.md`, `progress.md`: record behavior and verification.

### Rejected major alternatives

- Do not install a force-directed graph library or render all records in one hairball.
- Do not make pinch/scroll gestures the only zoom mechanism.
- Do not turn visual adjacency into ontology evidence.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Phase 29 RED build hit Windows sandbox `spawn EPERM` while Vite resolved packages. | 1 | Re-run the same read/build gate with the already approved unsandboxed npm build path; no source change required. |
| Focused Node test runner also hit sandbox `spawn EPERM` before loading either test. | 1 | Re-run the exact focused test command outside the Windows sandbox to observe the behavioral RED. |
| ESLint rejected `tabIndex` on the graph scroll container. | 1 | Keep the named region and its keyboard-reachable controls/nodes; remove the redundant non-interactive tab stop. |

## Phase 28 — compact operator title bars

### Goal

Replace the two stacked page headers with one tidy shared title bar on all six
operator pages, and reduce the Live status strip so routine work starts higher.

### Status

- [completed] Audit the supplied screenshot, shared shell, Live strip and route props.
- [completed] Add failing rendered behavior tests for the compact shared header.
- [completed] Implement the title bar and Live status-density changes.
- [completed] Verify regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Every operator page has one compact title bar containing its `h1`, relevant mode
  state and Wellington time.
- The old global status row, large eyebrow title band, `WCC demo` and Help menu are absent.
- Per-page instructional descriptions are removed from routine display and component props.
- Live still shows Connected, No current records, Issues, data timestamp, pause and refresh;
  `Not all-clear`, loading and error states remain intact.
- Live status cells are materially shorter on desktop while buttons remain at least 44px.
- Mobile can wrap title metadata without horizontal overflow or hiding the page name.

### Assumptions and exclusions

- “How to use later” means remove the current Help surface rather than replace it now.
- Status, safety and action labels are relevant operational content and remain; decorative
  eyebrow copy and demo/instructional prose do not.
- This is a shared presentation refactor only. No data, route, model, ontology, evidence,
  access, alert or workflow behavior changes.
- Preserve the existing civic palette, navigation and content modules. No new package,
  image, theme or animation is required.
- No GitHub push and no change to remote `main`.
- The supplied screenshot is the visual evidence; browser interaction testing is not
  requested, so rendered behavior, build and regressions are the verification boundary.

### File-level plan

- `site/tests/operator-console.test.mjs`: one compact title/status contract across six routes.
- `site/app/components/OperatorShell.tsx`: merge title, mode and time; remove Help/eyebrow.
- `site/app/{live,alerts,replay,integration,ontology,setup}/page.tsx`: remove obsolete copy props.
- `site/app/globals.css`: compact shared title bar and Live status strip, responsive wrapping.
- `README.md`, `findings.md`, `progress.md`: record the operator-density boundary and checks.

### Rejected major alternatives

- Do not hide the page title or replace it with an icon-only header.
- Do not remove operational state, timestamps, `Not all-clear` or refresh controls.
- Do not add a new tutorial, drawer or settings menu in this phase.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| The first combined planning patch did not match the current file anchor. | 1 | Re-read the exact file heads and apply smaller file-specific patches. |
| First GREEN run exposed one legacy safety test coupled to instructional Help copy removed by the request. | 1 | Keep the safety contract on the operational `Decision authority` and `Staff decision required` fields instead of restoring Help prose. |

## Phase 27 — dedicated Ontology module

### Goal

Move the Ontology Dashboard out of Data Integration into one dedicated top-level
operator module with its own navigation icon and `/ontology` route.

### Status

- [completed] Audit the current route, navigation, responsive and rendered-test contracts.
- [completed] Add failing route/navigation/separation tests.
- [completed] Implement the dedicated page and remove the dashboard from Integration.
- [completed] Verify regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- `Ontology` is a top-level navigation destination on every operator page.
- `/ontology` renders the existing operational chain, focused knowledge graph and
  33 source-path explorer with the Ontology item marked current.
- `/integration` no longer renders the Ontology Dashboard or city ontology explorer.
- Data Integration retains source contracts, source setup, integration architecture,
  API links and capability preview.
- Desktop collapsed navigation exposes one Ontology glyph; mobile retains a visible
  text label, at least 44px targets and no horizontal page overflow.
- No source, ontology relationship, evidence weight, model authority, access policy or
  external action changes.

### Assumptions and exclusions

- “Single nav icon and single page” means one dedicated top-level module rather than a
  modal, sub-tab or duplicate dashboard.
- Preserve the established civic operations design; do not adopt the unrelated red
  landing-page palette returned by the generic design-system search.
- No new data, route API, graph database, package, model training or public-access change.
- No GitHub push and no change to remote `main`.
- Browser visual testing is not requested; rendered behavior, build and regression tests
  are the verification boundary.

### File-level plan

- `site/tests/operator-console.test.mjs`: six-module navigation, dedicated-route and
  Integration-separation behavior.
- `site/app/ontology/page.tsx`: dedicated Ontology operator page.
- `site/app/integration/page.tsx`: source integration only.
- `site/app/components/OperatorNavigation.tsx`, `OperatorShell.tsx`: route, label and glyph.
- `site/app/globals.css`: six-item responsive navigation without shrinking touch targets.
- `README.md`, `findings.md`, `progress.md`: architecture and validation record.

### Rejected major alternatives

- Do not duplicate the dashboard on both `/integration` and `/ontology`.
- Do not hide Ontology behind Advanced or Setup; it is a first-class operator module.
- Do not replace the current graph/chain interactions while moving their route.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| A combined design audit command included a missing `design-system/` directory and returned exit 1, hiding parallel output. | 1 | Run the required UI searches independently and treat the absent directory as confirmation that no persisted design-system override exists. |
| First GREEN run left one legacy rendered test pointing at `/integration` for the city ontology explorer. | 1 | Move that existing behavioral assertion to the new canonical `/ontology` route; do not restore duplicate Integration content. |

## Phase 26 — alternate ontology graph view

### Goal

Add a Semantica-inspired relationship explorer as an optional second view of the
existing ontology, while keeping the six-level operational chain as the default.

### Status

- [completed] Verify Semantica's relevant interaction patterns and audit current graph data.
- [completed] Define the smallest accessible graph/list interaction and add failing behavior tests.
- [completed] Implement the alternate view without changing evidence or authority semantics.
- [completed] Verify regressions.
- [completed] Deploy to the existing owner-only site.

### Acceptance criteria

- Operators can switch between `Operational chain` and `Knowledge graph` without a new route.
- The graph uses existing sources, ontology concepts and operator destinations only.
- Selecting a graph node reveals its directly connected relations in a readable detail panel.
- The same relationship information remains keyboard-accessible and understandable without
  relying on node position, hover or colour alone.
- The default remains the six-level operational chain; mobile has no horizontal page overflow.
- Mock/access/cost/weight labels and human decision authority remain unchanged.

### Assumptions and exclusions

- “Reference Semantica” means borrow the graph-exploration pattern, not copy its brand,
  codebase, backend, AI extraction pipeline or technical ontology model.
- This is a visual projection over the existing model, not a new graph database, source,
  inference, detector, model training, API, route or external action.
- No GitHub push and no change to remote `main`.
- Browser visual testing is not requested; rendered behavior, build and regression tests
  are the verification boundary.

### File-level plan

- `site/tests/operator-console.test.mjs`: alternate-view, selection and safety contracts.
- `site/app/components/OntologyDashboard.tsx`: view switch and graph explorer.
- `site/app/globals.css`: responsive graph canvas, nodes, edges and detail panel.
- `README.md`, `findings.md`, `progress.md`: source attribution, design boundary and validation.

### Rejected major alternatives

- Do not replace the operational chain with a graph-only interface.
- Do not install a force-graph library or render an unreadable 33-source hairball.
- Do not infer new relationships from visual proximity.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| The first combined test patch used an outdated assertion anchor. | 1 | Re-read the focused test block and apply the two test changes separately. |
| Focused RED run found the graph projection and view switch absent. | 1 | Expected TDD failure; implement only the protected projection and alternate view. |

## Phase 25 — operational evidence chain

### Goal

Extend the Ontology Dashboard into the agreed six-level operational chain:
source access, normalization/alignment, ontology evidence, anomaly corroboration,
operator modules, and human confirmation/action.

### Status

- [completed] Audit the current four-level hierarchy and rendered contract.
- [completed] Add a failing test for the six ordered levels and authority boundary.
- [completed] Implement the two missing processing/decision levels with concise copy.
- [completed] Verify regressions and deploy to the existing owner-only site.

### Acceptance criteria

- `/integration` renders all six levels in the user's stated top-to-bottom order.
- Standardization visibly includes schema normalization plus time and place alignment.
- Anomaly output is labelled as a candidate that requires multi-source corroboration.
- Live, Alert Centre and Replay remain operator destinations, not ontology entities.
- Human confirmation and response is the terminal authority level; the model cannot
  silently confirm an incident or issue a warning.
- Existing source filters, concept filters and collapsed per-source pathways remain usable.

### Assumptions and exclusions

- This is a clearer operational architecture view over existing contracts, not a new
  detector, ontology version, source, model, database or external integration.
- The six levels are one semantic chain; no step implies that mock, restricted or
  registry-only data became operational evidence.
- No GitHub push and no change to remote `main`.
- Browser interaction testing is not requested; automated rendered behavior, build and
  regression tests are the verification boundary.

### File-level plan

- `site/tests/operator-console.test.mjs`: ordered six-level rendered contract.
- `site/app/components/OntologyDashboard.tsx`: six concise levels and connectors.
- `site/app/globals.css`: readable processing/decision level styling and responsive flow.
- `README.md`, `findings.md`, `progress.md`: architecture and validation record.

### Rejected major alternatives

- Do not create a second operations dashboard inside Integration.
- Do not add a graph/chart library or duplicate the Live/Alert/Replay interfaces.
- Do not treat an anomaly score as a confirmed Incident or issued Warning.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Focused RED run failed at the absent alignment level. | 1 | Expected TDD failure; proceed with the minimal six-level presentation change. |
| First GREEN run retained the old `Data sources` heading. | 1 | Align the source-level heading with the agreed access-status responsibility. |
| Hosting metadata was checked at the repository root. | 1 | Read the established `site/.openai/hosting.json` location. |
| The packaging helper was first called without an available `bash` command, then with Windows-style arguments. | 2 | Use the installed Git Bash executable with POSIX paths; the canonical helper then packaged successfully. |

## Phase 24 — top-to-bottom ontology hierarchy

### Goal

Reshape the Ontology Dashboard into a calm top-to-bottom hierarchy that moves
from source truth through concepts and relations to operator destinations, with
the 33 per-source pathways available only when the operator asks for detail.

### Status

- [completed] Audit the current horizontal flow, dense path list and responsive contract.
- [completed] Add a failing rendered hierarchy and progressive-disclosure test.
- [completed] Implement the vertical hierarchy and focused detail expansion.
- [completed] Verify regressions and deploy to the existing owner-only site.

### Acceptance criteria

- The rendered reading order is Sources → Concepts → Relations & rules → Operator destinations.
- Each hierarchy level has a visible numbered heading, short summary and vertical connector.
- Concept and destination cards remain keyboard-operable filters and open the relevant source pathways.
- The complete 33-path detail is collapsed initially, expandable with a native labelled control,
  and retains search, concept and destination filters.
- Real/Mock/access/cost/ontology-weight labels and all source/role mappings remain unchanged.
- The layout is one vertical reading flow on desktop and mobile with no horizontal graph or scroll.

### Assumptions and exclusions

- “Top to bottom” applies to the ontology dashboard hierarchy, not the five-module app navigation.
- The five presentation groups remain navigation over the existing 28 exact roles, not new ontology nodes.
- No data, model, API, route, source activation, authority or external action changes.
- Browser visual inspection is not requested; verification uses rendered behavior, build and regression gates.

### File-level plan

- `site/tests/operator-console.test.mjs`: rendered hierarchy order and collapsed-detail behavior.
- `site/app/components/OntologyDashboard.tsx`: vertical levels, connectors and interactive disclosure.
- `site/app/globals.css`: single-column hierarchy, semantic branches and responsive detail rows.
- `README.md`, `findings.md`, `progress.md`: updated operator behavior and validation.

### Rejected major alternatives

- Do not add a force-directed tree, Sankey/chart library or horizontal desktop-only pipeline.
- Do not remove the 33 source mappings; move them behind progressive disclosure.
- Do not infer that Integration-only contracts are operational evidence.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial multi-skill read was truncated. | 1 | Re-read the test and UI instructions separately before implementation. |

## Phase 23 — user-friendly ontology dashboard

### Goal

Add a focused Ontology Dashboard inside Data Integration that shows how the
existing registered datasets become typed ontology concepts and relationships,
then support Live Operations, Alert Centre and Replay Analyzer.

### Status

- [completed] Audit the current ontology artifact, source contracts and Integration UI.
- [completed] Add failing observable mapping, filtering and accessibility tests.
- [completed] Implement the source-to-concept-to-module dashboard without changing source truth.
- [completed] Verify responsive behavior, regressions and owner-only deployment.

### Acceptance criteria

- `/integration` visibly exposes an Ontology Dashboard without requiring Advanced
  and without adding a sixth primary route.
- The dashboard presents a readable three-stage flow: registered data sources,
  ontology concepts/relationships, and operator modules.
- Operators can filter or select by source, concept and destination; the selected
  path remains understandable without hover or colour alone.
- Every mapping is derived from the existing source registry and city ontology;
  real, context, mock, restricted, paid and zero-weight states remain explicit.
- The primary view is keyboard operable, has a linear/list alternative to its
  visual flow, and does not horizontally overflow at 375px.
- Existing Live, Alerts, Replay, Setup, source registry, evidence weights and
  external-action boundaries do not change.

### Assumptions and exclusions

- This is a user-facing view over existing ontology/data contracts, not a new
  ontology version, data source, observation, detector or trained model.
- The existing five-module information architecture remains the navigation source
  of truth; technical schemas and endpoint links stay under Advanced.
- A registry entry is not presented as an active live observation. Mock, paid,
  permissioned and restricted sources cannot gain evidence weight through this UI.
- No database, authentication, credential, activation or outbound integration is added.

### File-level plan

- `site/tests/integration-model.test.mjs`, `site/tests/operator-console.test.mjs`:
  mapping behavior, visible dashboard, filters and safety-boundary contracts.
- `site/lib/dataIntegration.mjs`: deterministic source-to-concept projection only
  if the existing artifacts do not already expose a suitable view model.
- `site/app/components/OntologyDashboard.tsx`, `site/app/integration/page.tsx`:
  focused dashboard and Integration placement.
- `site/app/globals.css`: compact responsive flow, controls, selected paths and
  accessible state presentation.
- `README.md`, `findings.md`, `progress.md`: operator use and verification evidence.

### Rejected major alternatives

- Do not add a sixth primary Ontology route.
- Do not use a force-directed network graph or inaccessible Sankey as the primary view.
- Do not install a chart library or replace the existing civic visual system.
- Do not infer source activation, runtime observations or evidence support from registry metadata.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| The first combined context read was truncated. | 1 | Re-read required skill files separately and use focused file reads for the implementation audit. |

## Phase 22 — production-demo UX polish

### Goal

Make the existing five-module operator console calmer, faster to scan and smoother
to use across desktop and mobile without changing source truth, workflow authority,
data semantics or external side effects.

### Status

- [completed] Audit the deployed and local five-route experience, shared controls and responsive behavior.
- [completed] Define a restrained civic interaction and surface system from the existing visual language.
- [completed] Add failing observable UX/accessibility tests before implementation.
- [completed] Implement the shared polish and route-specific usability fixes.
- [completed] Verify regressions, reduced motion, responsive behavior and owner-only deployment.

### Acceptance criteria

- Live, Alerts, Replay, Integration and Setup share one consistent hierarchy,
  control language, focus treatment, loading treatment and interaction timing.
- Primary actions and selected states remain obvious without relying only on colour;
  dense operational content stays readable at 375px and desktop widths.
- Pointer feedback is crisp, keyboard focus remains visible and motion-sensitive
  users receive no transform movement.
- Loading, empty, disabled, success and error states reserve stable space and use
  short plain-language labels suitable for routine operators.
- Existing maps, layers, replay, case/COP, warning validation, mock boundaries and
  API/data contracts do not change.
- All automated regressions pass and the exact verified build is deployed to the
  existing owner-only Sites project without recreating a GitHub feature branch.

### Assumptions and exclusions

- This is a cohesive polish pass, not a navigation rewrite or new design-system dependency.
- No new data source, model, database, authentication, outbound integration or real dispatch is added.
- Existing civic colours and compact operations layout remain the visual foundation.
- Browser-local workflow state remains browser-local and all mock/permission/paid labels retain their meaning.

### File-level plan

- `site/tests/operator-console.test.mjs`, `site/tests/rendered-html.test.mjs`:
  observable loading, navigation, focus and responsive UX contracts.
- `site/app/globals.css`: shared tokens, interaction states, density, responsive and reduced-motion polish.
- `site/app/components/OperatorShell.tsx`, `OperatorNavigation.tsx` and selected
  route clients: only the minimal semantic/loading markup needed by the verified UX contract.
- `README.md`, `findings.md`, `progress.md`: production-demo behavior and verification evidence.

### Rejected major alternatives

- Do not install a large component, icon or animation library.
- Do not add decorative motion, glassmorphism, oversized marketing typography or a dashboard redesign.
- Do not conceal evidence limitations or collapse independent Signal/Incident/Warning states into one score.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial browser bootstrap called the module namespace instead of the configured runtime. | 1 | Initialized the packaged browser runtime, selected the existing in-app tab and read its control contract before inspection. |
| Python regression temp directories were blocked by the Windows sandbox. | 2 | Ran the same 22-test suite with an explicit repository-local basetemp outside the sandbox, then removed both verified temp directories. |

---
## Phase 57 — Unified Replay command bar

### Goal

Combine the separate Investigation summary and Replay controls into one concise, case-aware command
bar without changing replay data, case truth, layer behavior or evidence authority.

### Status

- [completed] Audit the duplicated case and playback surfaces plus existing responsive contracts.
- [completed] Add a failing rendered contract for one unified command-bar container.
- [completed] Implement the shared case/change slot in both August and April Replay toolbars.
- [completed] Run focused, full, lint and desktop/mobile browser verification.
- [in_progress] Publish the validated private Sites build and push the requested GitHub branch.

### Acceptance criteria

- One visible Replay command-bar container owns case identity, Change, date/time/speed, playback,
  timeline, filters, Layers and Evidence where available.
- The old standalone collapsed Investigation strip and the duplicated toolbar title are removed.
- Change still opens the existing case selector/editor; switching cases retains the current URL and data behavior.
- Desktop remains compact; 375px and landscape layouts wrap by function with no page-level horizontal overflow.
- All controls remain keyboard accessible, at least 44px, and keep their existing accessible names.

### Assumptions and exclusions

- This is a Replay presentation refactor only; no data, source, model, ontology, score or alert-policy changes.
- The detailed case editor remains progressive disclosure below/within the command surface when opened.
- Do not merge Layers or Evidence drawers into the toolbar body; only their launch actions belong in the bar.

### File-level implementation plan

- `site/app/components/ReplayInvestigationSelector.tsx`: expose a compact case/change trigger and keep the editor.
- `site/app/components/ReplayWorkspaceClient.tsx`: compose the selector with the active Replay canvas.
- `site/app/MovementCanvas.tsx`, `site/app/components/SensorReplayCanvas.tsx`: accept and render the shared case slot.
- `site/app/globals.css`: one responsive command-bar hierarchy with stable 44px controls.
- `site/tests/operator-console.test.mjs`, `site/tests/rendered-html.test.mjs`: prove a single container and no duplicate title.

### Rejected major alternatives

- Do not overlay a second floating card or hide Change inside Layers.
- Do not place every control in one unwrapped desktop row; preserve functional rows inside one container.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| GitHub CLI keyring token is invalid and direct Git DNS lookup failed. | 1 | Finish the requested UI commit first; use the authenticated GitHub connector or request re-authentication only if the final branch push still cannot be completed. |
| Focused Node test workers could not spawn in the filesystem sandbox. | 1 | Re-ran with the existing scoped `node --test` approval; four tests failed only at the intended unified-bar contract. |
| First GREEN rerun read the previous production build. | 1 | Rebuilt before testing through the normal full test command; the unified contracts then passed. |
| A Playwright `eval` command was split by shell quoting. | 1 | Use short selector-based evaluations separately; the screenshot and semantic snapshot were unaffected. |
| The first restarted preview reused a log file held by the old process. | 1 | Restarted with unique timestamped logs and verified the new production listener before browser QA. |
| The browser helper command is named `select`, not `select-option`. | 1 | Used the documented `select` command and verified the April case transition. |

---
## Phase 55 - Operator home dashboard

### Goal

Make `/dashboard` the first post-login workspace for WCC emergency staff. It must summarize current
operational truth, focus the operator on the next review action and link into the existing specialist
modules without creating a second alerting or evidence system.

### Status

- [completed] Audit current navigation, runtime summaries and existing operator contracts.
- [completed] Add failing route, navigation, truth-state and responsive rendering tests.
- [completed] Implement the server-first dashboard and focused client refresh behavior.
- [completed] Validate build, regression, lint and desktop/mobile layouts.
- [completed] Publish the exact owner-only build without changing GitHub remotes.

### Acceptance criteria

- `/` redirects to `/dashboard`; Dashboard is the first desktop navigation item and remains reachable on mobile.
- The first viewport shows current review workload, source health, current evidence summary and recent investigations.
- A single primary action opens Signal Review; secondary links open Live Operations and Replay Analyzer.
- Zero candidates is explicitly not presented as all-clear, and mock, held and unavailable records remain distinct.
- Every value is derived from existing product contracts or labelled unavailable; no invented incident, score or AI decision.
- Loading, empty and error states are visible; keyboard order, 44px targets and 375px/landscape layouts remain usable.

### Assumptions and exclusions

- This is an operator home page, not a new model, COP, alert policy, feed or authentication implementation.
- Existing light theme, civic blue palette, Phosphor icon family and 8px spacing rhythm remain the design source of truth.
- The reference screenshot contributes layout hierarchy only; GitHub-specific repository, agent and changelog concepts are excluded.
- The UI database returned a dark marketing landing pattern that conflicts with the existing public-sector console; it is rejected.

### File-level implementation plan

- `site/app/dashboard/*`: add the server route, loading skeleton and one focused dashboard client only if refresh is needed.
- `site/app/page.tsx`, `site/app/components/OperatorNavigation.tsx`, `OperatorShell.tsx`: make Dashboard the default destination.
- `site/lib/*`: add a pure projection only if existing live/review models cannot supply the summary cleanly.
- `site/app/globals.css`: add scoped responsive dashboard layout with no new theme or generic card grid.
- `site/tests/*`: lock route, source-truth, navigation, accessibility and responsive contracts.

### Rejected major alternatives

- Do not copy GitHub Home, add a general chatbot prompt, or repeat every specialist screen on the landing page.
- Do not show fake user productivity, risk scores, incident counts or AI recommendations.
- Do not add a new design-system dependency to one route inside the established console.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| The first broad `rg` expression had an unclosed PowerShell regex group. | 1 | Re-ran with separate `-e` patterns. |
| The first RED run failed seven new contracts because the route and model did not exist. | 1 | Expected TDD RED; implemented only the specified gaps. |
| Dashboard route HTML contained two `h1` elements because its loading fallback repeated `OperatorShell`. | 1 | Keep the route skeleton inside the page content and let the final shell own the single page heading. |
| Direct `node --test` could not spawn a child process in the managed shell. | 1 | Ran the test module directly to preserve the RED evidence, then kept the normal `npm test` gate for final verification. |

---
## Phase 54 — Replay evidence density and review queues

### Goal

Make movement differences, direction, evidence density and review state readable in one operational
view without inflating evidence or hiding the retrospective-only boundary.

### Status

- [completed] Add failing behavior and rendering contracts for zoom, deltas, queue semantics and inbox truth.
- [completed] Implement compact Replay evidence, clearer directional markers and 2000% map zoom.
- [completed] Replace queue tabs with a default-New five-option selector and meaningful History/All semantics.
- [completed] Surface held observations beside zero review candidates without manufacturing a case.
- [completed] Run production build, full regression, lint, whitespace and responsive browser checks.
- [completed] Publish the validated owner-only build without changing GitHub origin or `main`.

### Acceptance criteria

- Increase and decrease use signed values, distinct accessible colours and a centred thin delta bar.
- Replay maps zoom to 2000%; people/vehicle glyphs are centred and every movement marker retains a visible direction.
- April movement detail removes the visible `Movement evidence` / `Retrospective · weight 0` duplication,
  keeps the truth boundary accessible and fits its core metrics and chart in a compact desktop panel.
- Replay controls use less vertical space while retaining 44px touch targets and an 8px scrub track.
- Live Evidence Inbox distinguishes promoted review candidates from held observations and never treats zero as all-clear.
- Signal Review defaults to New and exposes New, Active, Closed, History and All in one labelled selector;
  History requires saved human activity and All includes every candidate.

### Assumptions and exclusions

- “Energy bar” is implemented as a signed difference-from-expected bar, not a new score or model output.
- Generic People/Vehicles filter icons do not claim a direction; map markers and evidence rows show observed direction.
- No mock observation becomes a live candidate, and no alert promotion, ontology or model rule changes.
- Mobile evidence may scroll only when the viewport cannot contain the full detail; desktop is compact by default.

### File-level implementation plan

- `site/tests/*`: lock the new zoom limit, delta semantics, compact Replay contract, inbox truth and five queue states.
- `site/app/MovementCanvas.tsx`, `site/app/components/SensorReplayCanvas.tsx`: render signed delta bars,
  compact evidence and stronger movement direction cues.
- `site/app/components/LiveMap.tsx`, `site/app/layerModel.mjs`: apply the shared 2000% zoom ceiling.
- `site/app/components/LiveOperationsClient.tsx`: show Review and Held counts in the collapsed and expanded Inbox.
- `site/lib/signalReview.mjs`, `site/app/components/AlertCentreClient.tsx`: add truthful History/All filtering and a queue selector.
- `site/app/globals.css`: reduce replay stacking, centre icons and compact evidence without shrinking touch targets.

### Rejected major alternatives

- Do not manufacture review candidates to avoid a zero count.
- Do not use colour alone, an unlabeled intensity gauge or an unbounded zoom transform.
- Do not remove retrospective truth from source contracts merely because the repeated visible label is removed.

---

## Phase 53 — Operator readability and first-viewport controls

### Goal

Remove the five verified UX defects from Replay, Live, Integration and Ontology while preserving
all data, evidence, model and human-authority contracts.

### Status

- [completed] Reproduce the deployed desktop/mobile defects and identify their component seams.
- [completed] Add failing behavior contracts for fixed Replay actions, visible Live empty truth and lazy Ontology graph mounting.
- [completed] Implement readable typography, non-scrolling primary controls and deferred advanced graph rendering.
- [completed] Run full regression, lint, desktop/mobile/landscape browser verification and a DOM/readability audit.
- [completed] Publish the exact validated build to the existing owner-only Sites deployment.

### Acceptance criteria

- At 375px, Replay shows `Layers` and `Evidence` in the first viewport without horizontal scrolling;
  People, Vehicles and Sensor coverage remain directly selectable.
- At 1440px, every Live category control is fully visible without a hidden horizontal chip strip.
- Operational labels and values in Integration, Replay and Ontology render at 13px or larger;
  legal attribution and non-critical decorative/axis text may remain smaller.
- Live's map has a named keyboard interaction surface, geographic marker navigation, Enter to
  select, Escape to release, real focusable marker items, and modifier-only wheel zoom.
- The Ontology fusion graph is not mounted in the default operational-chain DOM and mounts only
  after `Fusion architecture` is selected; zoom, expand/collapse and provenance remain unchanged.
- Live visibly states `No promoted candidates · Not an all-clear` whenever the current candidate
  count is zero; the Mock preview remains clearly synthetic.
- No API, source, replay data, ontology schema, evidence weight, alert policy or authority changes.

### File-level implementation plan

- `site/tests/operator-console.test.mjs` and `site/tests/rendered-html.test.mjs`: add behavior-first RED contracts.
- `site/app/MovementCanvas.tsx` and `site/app/components/SensorReplayCanvas.tsx`: separate primary filters from always-visible Layers/Evidence actions.
- `site/app/components/LiveOperationsClient.tsx`: expose the zero-candidate truth and group desktop filters without hiding controls.
- `site/app/components/LiveMap.tsx`: add the verified keyboard and screen-reader marker path without
  making the visual canvas itself semantic.
- `site/app/components/OntologyDashboard.tsx`: conditionally mount the advanced graph only when selected.
- `site/app/globals.css`: enforce readable scoped type and responsive fixed-action layouts.
- `findings.md`, `progress.md`, `README.md`: record the UX boundary and verification.

### Assumptions and exclusions

- “13px minimum” applies to operational labels and values, not map attribution, decorative step numbers or chart-axis microcopy.
- Lazy loading means deferred React/DOM mounting, not a new route, network request or ontology schema.
- Empty candidate state is uncertainty, not evidence that the city is safe.
- The original GitHub `origin` remains untouched; any later GitHub publication goes only to the user's `private-origin` when explicitly requested.

### Rejected major alternatives

- Do not hide Layers or Evidence behind a generic overflow menu; both are high-frequency investigation actions.
- Do not remove ontology nodes or source contracts to reduce DOM size; defer the advanced view instead.
- Do not increase every map annotation to 13px because legal attribution and dense map-axis text have different roles.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| One broad test patch did not match the longer Ontology contract. | 1 | Split the patch at exact test boundaries. |
| First `rg` expression lost its quoted `role` pattern in PowerShell. | 1 | Re-ran with a single-quoted expression. |
| Authoritative RED run failed five new UX contracts while 97 existing contracts passed. | 1 | Expected TDD RED; proceed to implementation only for those verified gaps. |
| ESLint rejected an Escape handler on a role-based detail overlay. | 1 | Use the native open `dialog` element and retain the same non-modal, focus-return behavior. |
| The first final-test process handle expired after context compaction. | 1 | Re-ran the complete build, 103 tests, lint and whitespace gate from source. |
| Post-deployment self-review found the zero-candidate label was unconditional. | 1 | Render loading, zero and positive candidate states separately; add a regression and republish. |

---

## Phase 52 — Production operator workflow refactor

### Goal

Refactor Signal Review, Data Integration, City Ontology and Easy Setup into one concise,
task-first operator experience that is smooth on desktop and mobile without changing evidence,
model, ontology, API or human-authority contracts.

### Status

- [completed] Audit current page structure, responsive rules, tests and shared visual system.
- [completed] Add failing rendered behavior contracts for the four production workflows.
- [completed] Implement the shared master-detail, step-inspector and guided-setup layouts.
- [completed] Run focused and full regression, accessibility and responsive browser checks.
- [completed] Publish the exact validated build to the existing owner-only deployment.

### Acceptance criteria

- Signal Review keeps Evidence first and presents one compact queue, signal header, workflow and
  editable detail surface without hiding truth, authority or Mock state.
- Data Integration replaces the six-column horizontal table with a searchable source list and one
  readable selected-source detail panel; all 33 contracts remain reachable.
- City Ontology presents all six operational layers as a compact step rail with one focused detail
  surface, while retaining the expandable fusion graph, zoom, provenance inspector and source paths.
- Setup behaves as one three-step guided flow with compact progress, visible field labels, clear
  browser-only activation state and a primary Save-and-continue action.
- Desktop, 375px mobile and landscape layouts have no page-level horizontal overflow; focus,
  selected and disabled states do not rely on colour alone; interactive targets remain 44px.

### Assumptions and exclusions

- Current civic palette, Segoe UI typography, Phosphor icon family and operator navigation remain.
- This phase changes information architecture and presentation only. No source activation, durable
  storage, authentication, external write, warning issue, evidence weight or training is added.
- Mock, permission, paid, stale and browser-local boundaries remain visible at the point of action.
- GitHub origin and remote `main` remain unchanged.

### File-level implementation plan

- `site/app/components/AlertCentreClient.tsx`: compact queue, signal identity and detail hierarchy.
- `site/app/components/IntegrationRegistry.tsx`: accessible master-detail source workspace.
- `site/app/components/OntologyDashboard.tsx`: six-step operational inspector plus existing graph.
- `site/app/components/SetupClient.tsx`: guided steps and save/continue workflow.
- `site/app/globals.css`: shared production workspace rhythm and responsive states.
- `site/tests/operator-console.test.mjs`: rendered behavior contracts for all four workflows.
- `findings.md`, `progress.md`, `README.md`: record UX decisions, limits and verification.

### Rejected major alternatives

- Do not adopt or recreate a second design system. The existing civic interface already has the
  required tokens, icon family and accessibility conventions.
- Do not hide truth, access, evidence or authority fields merely to make a page shorter; move
  secondary technical content behind explicit progressive disclosure instead.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Focused `node --test` could not spawn its worker in the sandbox (`EPERM`) | 1 | Use the completed full `npm test` RED run and do not repeat the blocked direct invocation. |
| `bash` was not on PowerShell `PATH` and Windows archive paths were parsed as remote tar targets | 2 | Use the installed Git Bash executable and convert both arguments to `/c/...` paths. |
| Sites rejected the abbreviated commit ID | 1 | Retry once with the exact full commit SHA required by the version contract. |

---
## Phase 44 — Mobile Live map decluttering

### Goal

Maximise useful map space on phones while keeping status, search, filters, evidence details and
navigation immediately understandable to an emergency operator.

### Status

- [completed] Audit the current Live mobile overlays, controls, navigation and test contracts.
- [completed] Add failing behavior tests for progressive controls, bottom-sheet details and mobile-safe labels.
- [completed] Implement the compact mobile hierarchy, clearer navigation icons and safer map controls.
- [completed] Run build, regressions, accessibility/layout checks and owner-only deployment.

### Acceptance criteria

- On narrow screens, a selected map record opens in a full-width bottom sheet rather than a clipped floating card.
- Search remains directly available; filters collapse into one labelled control and do not cover the map by default.
- Evidence Inbox remains collapsed by default and does not share the map surface with an open detail sheet.
- Live status stays one compact row with Connected, Empty, Issues, freshness, Pause and Refresh.
- Mobile warning/filter labels do not truncate; touch targets are at least 44px and map tools clear the bottom navigation.
- Mobile navigation uses consistent outline-style Activity, Review inbox and Setup controls with text labels.
- Cluster markers retain a minimum 44px hit area while their records remain available in the
  keyboard-accessible observation list.
- Desktop layout, source truth, evidence eligibility, map search and refresh behavior do not change.

### Assumptions and exclusions

- The supplied review is an implementation request and prioritises the four named actions over a wholesale visual redesign.
- Existing civic colours and typography remain; the generated red design-system palette is rejected as off-brand.
- No data source, ontology, alert threshold, map provider, model or desktop information architecture changes.
- Native pinch/double-tap remains available, but visible zoom controls stay as an accessible gesture alternative.

### File-level implementation plan

- `site/app/components/LiveOperationsClient.tsx`: mobile filter drawer state and selected-record coordination.
- `site/app/components/LiveMap.tsx`: bottom-sheet detail semantics, cluster touch targets and concise mobile controls.
- `site/app/components/OperatorNavigation.tsx`: consistent accessible navigation glyphs.
- `site/app/globals.css`: mobile overlay hierarchy, safe-area offsets, contrast and reduced-motion treatment.
- `site/tests/operator-console.test.mjs` and focused model tests where needed: protect user-visible behavior.
- `findings.md`, `progress.md`: record decisions, RED/GREEN evidence and deployment state.

### Rejected major alternatives

- Do not remove visible zoom buttons; gestures alone are not an accessible control path.
- Do not hide system health inside a menu; it is high-frequency operational state.
- Use one tree-shaken outline icon package across operator navigation and mobile map actions; do not
  mix text punctuation, emoji and incompatible icon styles.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Focused Node test could not spawn its worker inside the sandbox (`EPERM`) | 1 | Re-ran the same bounded test with scoped approval; both focused tests passed. |
| Production build could not start compiler workers inside the sandbox (`EPERM`) | 1 | Re-ran the unchanged build with scoped approval; build completed successfully. |

---

## Phase 21 — case/COP and warning operations workflow

### Goal

Turn the international benchmark into a focused Alert Centre workflow that lets
an operator move from a reviewed candidate to a structured case/COP, prepare an
authorised-warning package, inspect channel states and hand the exact case to
Replay Analyzer without implying that any external action occurred.

### Status

- [completed] Audit current Alert Centre, workflow adapters, replay handoff and design tokens.
- [completed] Define the case/COP, three-axis state, approval and channel contracts.
- [completed] Add failing behavior tests for the operator workflow and safety boundaries.
- [completed] Implement the compact case workspace and warning preparation UI.
- [completed] Verify accessibility, responsive layout, regressions and owner-only deployment.

### Acceptance criteria

- The selected candidate shows three independent states: Signal, Incident and Warning.
- An operator can prepare a browser-local case/COP with owner, next review,
  affected area, situation, confirmed/unknown items and current actions.
- Warning preparation requires hazard, affected area, level, public action,
  effective/expiry/next-update times and linked evidence before it can become
  `awaiting_approval`.
- Creator and approver are distinct recorded roles; a prepared package remains
  mock/local and cannot become an issued public warning.
- Channel rows distinguish `not_prepared`, `prepared_not_sent`, `accepted`,
  `failed` and `published`, but this demo can produce only the first two states.
- Every workflow version and action is shown in a case timeline and the Replay
  handoff retains `available_at_only` evidence policy.
- Existing model authority, zero-evidence mocks, PII removal, source truth,
  Live/Replay separation and five-route navigation do not regress.

### Assumptions and exclusions

- This is a production-shaped demo workflow, not durable production case storage.
  User edits remain explicitly browser-local because the deployed site has no D1
  binding; adding a database or authentication schema requires a separate approval.
- No real WCC ticket, field dispatch, leadership contact, CDEM/NEMA escalation,
  public warning, SMS, email or social post is sent.
- No Australian warning names/colors become WCC policy; the demo uses neutral
  `Advice`, `Watch and act` and `Emergency` labels as mock workflow vocabulary.
- No new data source or model is trained. Existing detectors and evidence remain read-only.

### File-level plan

- `site/tests/operator-console.test.mjs`, `site/tests/integration-model.test.mjs`:
  RED behavior and safety assertions at the rendered/API boundaries.
- `site/lib/caseWorkflow.mjs`, `site/lib/workflowAdapters.mjs`, `site/worker/index.ts`:
  deterministic state, validation, channel and handoff contracts.
- `site/app/components/AlertCentreClient.tsx`, `site/app/globals.css`:
  compact case/COP tabs, warning composer, approval state and timeline.
- `site/app/replay/page.tsx`: case handoff label only if needed by the verified contract.
- `README.md`, `findings.md`, `progress.md`: operating boundary and evidence.

### Parallel goal graph

- A: read-only workflow/contract audit.
- B: read-only public-sector dashboard UX blueprint.
- C: read-only acceptance and safety-test review.
- D: serialized main-agent RED/GREEN implementation after A/B/C feed exact findings.
- E: independent read-only verification after D; deployment only after tests release the gate.

### Rejected major alternatives

- Do not add D1, authentication or a real command API in this phase.
- Do not make one overall score drive incident confirmation or warning issuance.
- Do not add a sixth primary route; the workflow belongs inside Alert Centre and Replay.
- Do not install a large visual design system into the existing dependency-light prototype.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Direct `npm run build` hit a Windows sandbox `spawn EPERM` after prior successful builds. | 1 | Re-ran through the approved full `npm test` gate; production build and all tests passed. |

---

## Phase 20 — international emergency-response benchmark

### Goal

Benchmark real flood/disruption response systems and operating cases in other
countries, then define the smallest evidence-backed feature and workflow upgrade
for WCC Live Operations, Alert Centre and Replay Analyzer.

### Status

- [completed] Audit the current prototype boundary and select comparable international systems.
- [completed] Run parallel primary-source research for shared COP, interoperability and public warning.
- [completed] Compare real event workflows, design patterns, governance and failure lessons.
- [completed] Define a WCC target operating flow and prioritised borrowing roadmap.
- [completed] Independently verify claims, source links and model-training recommendation.

### Acceptance criteria

- At least four official systems are compared using primary or authoritative sources.
- At least one real flood or severe-weather case is traced from detection through
  investigation, escalation, public warning and post-event review.
- Recommendations distinguish useful patterns from unsafe or inapplicable copies.
- Every proposed WCC feature maps to the existing Live, Alerts, Replay or
  Integration module and has an explicit implementation priority.
- Model training is recommended only where labels, event independence and a
  leak-free validation path exist.

### Assumptions and exclusions

- This phase is research and operating-model design only; it does not change the
  deployed site, activate a source, send a notification or train a production model.
- Publicly documented overseas practice is comparative evidence, not authority to
  bypass WCC, CDEM, NEMA, privacy, procurement or warning-approval rules.
- Vendor marketing claims do not count as operational evidence unless corroborated
  by an official agency, inquiry or technical standard.

### Parallel research graph

- Netherlands LCMS and UK ResilienceDirect: multi-agency COP and case coordination.
- Australia Hazards Near Me/Australian Warning System and US IPAWS: public-warning
  preparation, approval and multi-channel delivery.
- Japan SIP4D/J-Alert and regional alternatives: ontology/interoperability and
  cross-agency data exchange.
- Main synthesis: current-product gap map, real Wellington-style case walkthrough,
  priorities and independent source verification.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `agent-reach` executable is not installed on the active PATH. | 1 | Use the skill's documented Exa/mcporter and Jina Reader routes, plus official primary-source verification; do not retry the missing executable. |

---

## Phase 19 — investigation workflow mock adapters

### Goal

Provide a complete, clearly synthetic adapter chain from an alert candidate to
WCC case/ticket handling, Replay Analyzer investigation, internal escalation,
authorised-agency coordination and public-warning preparation.

### Status

- [completed] Audit the supplied TICKET_DETAIL fields and current alert/provider boundaries.
- [completed] Define privacy-safe workflow adapter contracts and RED behavior tests.
- [completed] Implement six deterministic zero-dispatch mock adapters and API surface.
- [completed] Add a compact Alert Centre workflow action panel and Replay handoff.
- [completed] Verify regressions, documentation and owner-only deployment.

### Acceptance criteria

- Six adapters are available: WCC ticket, Replay handoff, field dispatch,
  leadership notification, Civil Defence/NEMA escalation, and public warning/social.
- Every result declares `mode: mock`, `is_synthetic: true`, `dispatched: false`
  and `evidence_weight: 0`; no network write or external message occurs.
- The WCC ticket mock preserves all supplied TICKET_DETAIL attribute names and
  allowed status/priority/source shapes while nulling requester identity, exact
  address and unrestricted description in the public demo.
- Alert Centre can prepare and inspect each adapter output and open Replay
  Analyzer with a case reference; preparing a mock never confirms an incident.
- Real, paid, permissioned and restricted provider states remain unchanged.

### Assumptions and exclusions

- “All mock adapters” means the complete response workflow described in the
  immediately preceding request, not every registered data-source mock fixture.
- Non-WCC outbound shapes are demo integration contracts until the owning
  organisation supplies an authorised interface specification.
- No real WCC ticket is created, no leader/NEMA/Civil Defence contact is made,
  and no public or social message is published.
- No personal data, credentials, new live source or model training is in scope.

### File-level plan

- `site/tests/integration-model.test.mjs`, `site/tests/operator-console.test.mjs`:
  mock safety, field fidelity, API and operator-workflow behavior.
- `site/lib/workflowAdapters.mjs`, `site/worker/index.ts`: deterministic adapter
  catalogue, request/result contracts and read-only mock execution endpoint.
- `site/app/components/AlertCentreClient.tsx`, `site/app/globals.css`: compact
  action preparation, output status and Replay handoff.
- `README.md`, `findings.md`, `progress.md`: schema, privacy and activation boundary.

### Rejected major alternatives

- Do not treat a prepared mock as a sent notification or confirmed incident.
- Do not copy the full SERVICE_ITEM/SERVICE_ITEM_L2 dictionaries into UI controls.
- Do not include requester name, exact incident address or unrestricted ticket text.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Initial API audit assumed Next route files under `site/app/api`. | 1 | Located the existing API router in `site/worker/index.ts`; use that surface. |
| A wildcard path was passed literally to `rg` on Windows. | 1 | Search explicit directories/files rather than retrying the invalid wildcard. |
| Agent Reach Jina verification was blocked by the workspace network proxy. | 1 | Retry the same read-only official-service metadata request with network approval. |
| First RED run had a missing-module import and two unescaped `/` regex delimiters, so tests errored before exercising behavior. | 1 | Move adapter assertions to the real worker boundary and use safe regex patterns; rerun until failures are behavioral. |

---

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
## Phase 42 — Compact Live source status

### Goal

Replace the stacked Live source summary with one short operational toolbar while preserving
source-state meaning, refresh controls and accessible detail.

### Status

- [completed] Audit the deployed mobile layout, component, breakpoints and rendered contract.
- [completed] Add a failing rendered behavior test for the compact toolbar.
- [completed] Implement the compact labels and single-row responsive layout.
- [completed] Run focused, full and browser verification at desktop and 375px.
- [completed] Publish the validated owner-only build without changing GitHub origin or `main`.

### Acceptance criteria

- Desktop and mobile show one compact row: Connected, Empty, Issues, time, Pause/Resume and Refresh.
- “No current records”, “not all-clear” and the 60-second refresh policy remain available to
  assistive technology without occupying separate visible blocks.
- Pause/resume, loading and refresh behavior remain unchanged; action targets remain at least 44px.
- The toolbar does not create page-level horizontal overflow at 375px.

### Assumptions and exclusions

- “Short and tidy” means reducing visible labels and stacking, not removing operational state.
- No source, adapter, ontology, alert or model behavior changes in this phase.
- No new icon or component dependency is required.

### File-level implementation plan

- `site/tests/operator-console.test.mjs`: replace the verbose-status contract with compact visible
  labels plus accessible-detail assertions.
- `site/app/components/LiveOperationsClient.tsx`: project the same state into concise metrics/actions.
- `site/app/globals.css`: keep the strip on one row across breakpoints with compact responsive sizing.
- `findings.md`, `progress.md`: record the cause and verification evidence.

### Rejected major alternative

- Do not hide the counters or refresh controls in a menu; they are high-frequency operational state.

---
## Phase 43 — Replay source icon toggles

### Goal

Turn each Replay source-layer marker into a small, direct toggle so operators can add or remove
that source from the map without opening another control.

### Status

- [completed] Audit the current Replay layer rows, selection state, symbols and rendered tests.
- [completed] Add a failing behavior test for icon-driven source selection.
- [completed] Implement accessible icon toggles with stable selected/unselected states.
- [completed] Run production build, full regression, lint and whitespace verification.
- [completed] Publish the validated owner-only build without changing GitHub origin or `main`.

### Acceptance criteria

- Every compatible Replay source row has one small visible icon control with a 44px hit target.
- Clicking the icon adds or removes only that source layer and immediately updates the map.
- Selected state is visible without relying on colour alone and exposed through `aria-pressed`.
- Existing source labels, truth/status badges, All/People/Vehicles filters and Replay timing remain.
- Keyboard, 375px and landscape layouts work without page-level horizontal overflow.

### Assumptions and exclusions

- “Default small icon” means the existing source colour/symbol becomes the direct toggle.
- Initial source selection remains unchanged; this request changes control ergonomics, not defaults.
- No new source, ontology rule, evidence weight, dataset or icon-library dependency is added.

### File-level implementation plan

- `site/app/MovementCanvas.tsx`: render the source marker as a semantic toggle bound to existing state.
- `site/app/layerModel.mjs`: expose the existing immutable add/remove operation for direct testing.
- `site/app/globals.css`: compact icon, pressed, focus and muted states without layout shift.
- `site/tests/layer-model.test.mjs` and `site/tests/rendered-html.test.mjs`: prove one icon changes
  exactly one source and retains accessible state.

### Rejected major alternatives

- Do not make the whole row an unlabeled click target; it obscures the action and harms keyboard use.
- Do not add a full icon package for five controls.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Looked for a non-existent `site/lib/investigationSources.mjs` | 1 | Use the imported `site/app/layerModel.mjs` and `site/lib/replaySourceWorkspace.mjs`. |
| Sandboxed build could not spawn the compiler | 1 | Re-ran the same build with the existing scoped build approval. |
| First build found an unclosed icon span | 1 | Corrected it to a self-closing decorative span, then rebuilt successfully. |

---
## Phase 56 — Adaptive Replay evidence surfaces

### Goal

Give every Replay case one predictable preview/drawer interaction while keeping the evidence fields
strictly adaptive to the active case, selected layer, entity type and record.

### Status

- [completed] Audit August/April preview, drawer, case-switch and responsive behavior.
- [completed] Add failing projection, rendered and case-isolation contracts.
- [completed] Implement shared adaptive evidence projections and shells for both Replay canvases.
- [completed] Run focused, full, lint and desktop/mobile browser verification.
- [completed] Publish the exact owner-only build without changing GitHub remotes.

### Acceptance criteria

- August movement hover shows direction, observed, expected and signed change in a compact preview;
  click/keyboard opens the full movement drawer with trend and signal list.
- April movement hover and drawer retain retrospective movement metrics and matched-hour history.
- April rain and flow hover/drawer show measurement-specific values, units, observation time and detector state;
  they never inherit movement fields.
- Preview and drawer use one shared visual/semantic shell, but their content is selected by the active
  case and entity type rather than a fixed global field list.
- Switching case, layer or replay time clears an incompatible selection. Mobile uses tap/keyboard for
  primary access and never depends on hover.
- April-specific backtest detail is not shown as part of the August case workspace.

### Assumptions and exclusions

- The change is Replay-only; existing Live Operations evidence behavior remains unchanged.
- Existing source truth, retrospective status, event-time weight, values and trend data are preserved.
- No new model, score, dataset, ontology rule, alert policy or evidence weight is added.

### File-level implementation plan

- `site/lib/adaptiveEvidence.mjs`: pure case/type-specific preview and drawer projections.
- `site/app/components/AdaptiveEvidence.tsx`: shared compact preview and drawer shell.
- `site/app/MovementCanvas.tsx`: August projection, hover preview and drawer selection.
- `site/app/components/SensorReplayCanvas.tsx` and `LiveMap.tsx`: April movement/rain/flow projection and selection.
- `site/app/components/ReplayWorkspaceClient.tsx`, `site/app/replay/page.tsx`: active-case isolation for April-only detail.
- `site/app/globals.css`, `site/tests/*`: responsive shell styling and behavior contracts.

### Rejected major alternatives

- Do not force every source into movement fields or one universal record schema.
- Do not keep two unrelated popup shells with matching colours only.
- Do not rely on hover for touch or keyboard access.

### Errors encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Combined skill read exceeded the output budget. | 1 | Re-read the selected UI and testing references separately before implementation. |
| A PowerShell `rg` call used a Unix-style wildcard path. | 1 | Re-ran the audit with `-g '*.mjs'` and bounded file reads. |
| Browser helper rejected one malformed wait expression. | 1 | Used the normal interaction command and verified the resulting frame directly. |

---
