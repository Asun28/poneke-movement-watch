# Pōneke Movement Watch — evidence ontology roadmap

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
- [in_progress] Publish the validated build to the existing private site.

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
