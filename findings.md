# Findings — Phase 2 ontology and sources

## Phase 24 — vertical hierarchy findings

- The current dashboard is logically correct but still reads left-to-right twice:
  the three-stage summary is horizontal on desktop and every one of the 33 source
  pathways repeats Source → Role → Destination across a wide row. That weakens the
  user's requested top-to-bottom mental model and exposes too much detail at once.
- The safer hierarchy is four semantic levels: source truth, concept grouping,
  ontology relations/rules, then operator destination. The per-source paths are
  an audit drill-down, not the primary explanation, so native progressive disclosure
  should keep them available without dominating the first viewport.
- Concept and destination cards can remain filters. Selecting either should open
  the drill-down and show the matching pathways, preserving current interaction
  value while making the default state much calmer.
- UI guidance supports a low-motion funnel/progressive-disclosure pattern with
  sequential headings, native controls, visible focus and one-column mobile flow.
  Oversized marketing type, scroll-reveal animation and a chart library remain rejected.


## Phase 23 — ontology dashboard findings

- The user needs an operational explanation of the existing ontology, not a new
  ontology model or another primary destination. Data Integration is the correct
  home because it already owns source contracts, ontology artifacts and setup entry points.
- The useful interaction is a deterministic, filterable three-stage projection:
  source contract → ontology role/concept → operator destination. It must preserve
  access, cost, runtime, provenance and evidence-weight truth rather than collapse
  them into a single confidence score.
- UI design guidance rejects a force-directed network as the primary view because
  it is weak on mobile and inaccessible without an alternative. A structured flow
  plus keyboard-readable mapping list gives the same mental model with less cognitive load.
- The generic design-system search suggested oversized landing typography and
  scroll-reveal motion; both conflict with the existing compact civic console and
  are rejected. Retained rules are 44px controls, visible focus, 150–300ms state
  feedback, reduced-motion support, textual state labels and no mobile overflow.
- No new runtime fetch is necessary. The page can be built from the packaged v2
  source registry, v3 city ontology and existing integration contracts, keeping
  the private demo deterministic and preserving its production-truth boundary.
- The registry and ontology join exactly by `source_id`: 33 registered sources,
  33 `DataLayer` nodes, no missing or extra IDs. The ontology currently exposes
  28 exact role names, 11 relationship types and six assertion guardrails.
- Current `/integration` hides the complete ontology explorer under Advanced and
  presents the source registry first. The old explorer also uses an 820px semantic
  rail with horizontal scrolling below 860px, so it is unsuitable as the new
  primary mobile-friendly explanation.
- Source contracts provide the operator destination, connector/runtime state,
  access/cost and format; `DataLayer` nodes provide ontology role, 2026 status,
  `can_support`, `cannot_assert` and ontology evidence weight. The new view model
  should join both instead of recomputing or overriding either contract.
- The ontology summary is intentionally conservative: one real-record layer and
  32 zero-weight layers at the packaged graph level. Live provider contracts may
  declare alert eligibility separately; the dashboard must not merge these two
  meanings into one score.


## Phase 18 — source labels and module separation

- The integration contract currently exposes connector mechanics but no explicit
  operator destination. Operators must infer `live` versus `batch`, which is the
  labeling problem the user reported.
- Live Operations already fails closed correctly: it renders only contracts whose
  connector mode is `live`. This boundary must remain unchanged.
- Replay Analyzer currently displays all 33 registry contracts together in one
  source list, although only WCC Transport Sensors is playable. Truth chips exist,
  but the default mixed list makes Live, Replay and registered-only sources look
  like peers.
- Setup has cadence, format and access fields but no destination selection. A
  required `Use in` select is the smallest operator-friendly addition and remains
  a browser-only draft.
- The canonical destination mapping is: connected live adapter → Live Operations;
  batch replay → Replay Analyzer; mock, context, stale or merely registered →
  Integration only. This is a label and filtering contract, not evidence promotion.
- UX guidance supports explicit text labels, 44px controls, a predictable default
  filter and no colour-only status. The existing civic palette and compact table
  remain suitable; no new navigation destination is needed.
- The final UI uses the same three labels in the integration contract, Data
  Integration filter, source badge, Setup field and Replay layer filter. A single
  shared label helper prevents copy drift between server and client contracts.

---

## Phase 17 — April storm 回测

- The Live situation strip is the correct secondary entry point: the operator can
  open a known-event evaluation without adding a sixth primary module or mutating
  the live snapshot state.
- The repository's packaged movement replay covers only 1–6 August 2026. No April
  transport, rainfall, river or road-impact rows are present, so the April pack
  must start as an event/evaluation contract with an empty observations array.
- The formal Greater Wellington committee paper places the Berhampore 85.9 mm
  one-hour record on Monday 20 April. A later Greater Wellington article says
  “Monday 24 April”; the ontology must retain that literal source claim, normalize
  to 20 April and preserve a correction note rather than silently overwrite it.
- The same official evidence supports an 18–22 April window: heavy rain and river
  impacts began on 18 April, the Hutt River peaked near 475 m³/s at 22:30 on 20
  April, and the NZTA bulletin records the SH2 washout closure/reopening sequence.
- Publication time is not verified for several retrospective sources. Their
  `available_at` remains null and they stay ground-truth-only until a timestamped
  archive is captured; an event time is not a publication time.
- Leak-free validation requires event-blocked time splits, out-of-fold base-model
  predictions for any stacker, and an independent calibration period. Mock data
  and post-event reporting are never training, calibration or score inputs.
- UI validation selected a visible text label with one consistent stroke SVG,
  a deep link, a 44px target and no continuous animation. The event contract is
  compact, and technical fields remain visible only where they express truth.

---

## Phase 15 — concise day-to-day operator mode

- The target user is a WCC day-to-day emergency operator with limited computer confidence; the interface must be task-first, predictable and touch-safe.
- The selected dashboard UX guidance prioritises 44px targets, immediate click feedback, visible focus, five or fewer primary destinations and progressive disclosure.
- The design-system search suggested an exaggerated-minimal marketing style; it is rejected because this is a public-sector operations dashboard. The existing civic palette and compact density remain appropriate.
- Routine pages should keep only task, current state and controls. Repeated explanations move to one optional Help menu; safety-critical truth states stay visible.
- Copy concentration is highest in the shared shell, Live source rail/inspector, Alert review details, Integration architecture, Replay captions and Setup protocol notes. Screen-reader alternatives are already separate and should remain.
- The existing navigation already uses five destinations, so Help must be a secondary header action rather than a sixth primary destination.
- The shared shell currently repeats a mode label, eyebrow, long description, environment label and three-sentence footer on every route. The long description belongs in closed Help; the routine heading only needs the page title and current mode.
- Live already has direct layer checkboxes and map selection. Remove source explanatory messages, the map-boundary paragraph and the empty-inspector tutorial; retain compact state/count labels and a keyboard-accessible observation list.
- Alert Centre's five-stage pipeline and mock LLM essay are architecture education, not daily review. Keep the candidate list, evidence buckets, authority chip and human action boundary; move model guidance to Help.
- Integration should lead with search, connector-mode select and Add source. Architecture, raw endpoints and ontology diagnostics are advanced tools and should be closed by default.
- Setup repeats the same four safety bullets after every form. Replace them with one compact activation status and keep the actual selectable fields.
- Final UX guards: one primary action per screen, native controls, click/tap as the primary interaction, 44px minimum targets, visible focus, compact empty/error states with recovery actions, no color-only status and no sixth bottom-nav item.
- Closed progressive disclosure is appropriate for Help and advanced integration diagnostics; primary source selection, alert review and setup fields must remain directly visible.
- Ontology explorer, capability preview and replay evidence ledger mix operational data with educational prose. Keep their structured labels and values, but place the technical Integration views behind one closed `Advanced` menu and shorten Replay lifecycle text to state labels.
- Replay map controls are already direct. Remove the long inspection tutorial, long map geometry caption, trend methodology paragraph and repeated cause-warning paragraph; retain short status, attribution, legend, selected evidence and accessibility-only guidance.
- The implemented routine hierarchy is now consistent: compact mode header plus Help, one short page title, then direct page controls. Raw records, API endpoints, ontology diagnostics and evidence-detail boards are closed by default.
- The final accessibility validation confirms existing loading feedback, reduced-motion handling and visible focus coverage. New Help uses the established z-index scale rather than an arbitrary extreme value.
- The compact Setup boundary initially said “Saved on this browser” before any save. That contradicts the status strip; the invariant must be “Browser draft” until client state confirms a save.

---

## Phase 13 integration, live operations and alerts

### Local architecture and UI audit

- The site now contains `site/.openai/hosting.json` with an existing Sites
  project ID and no D1/R2 bindings. This supersedes Phase 11's earlier manifest-
  absence observation and requires the Sites capability/build/hosting path.
- The current product is one long `/` page. `MovementCanvas.tsx` owns data fetch,
  replay state, map rendering, layer selection, inspection and evidence state;
  source registry data is imported separately by multiple components. There is
  no shared runtime connector-health or normalized live-observation contract.
- The correct route split is `/live`, `/alerts`, `/replay` and `/integration`,
  ordered by the operator questions “what is happening now?”, “what needs
  review?”, “what happened then?” and “which sources are connected?”.
- Preserve the existing civic ink/harbour/amber/coral system at low variance,
  subtle motion and high information density. The dashboard needs a shared
  operator shell, not a generic card redesign.
- Live and replay semantics must be structurally separate: Live has current
  source freshness and partial-failure states; Replay retains date/hour/speed
  controls, publisher cadence and historical trend. A paused live view freezes
  presentation only and must not imply ingestion stopped.
- Alert Centre should reuse the evidence lifecycle but take a prop-driven alert
  record: observation IDs, supporting/contradicting/missing/context evidence,
  ontology relations, rule basis and a human review state. LLM output remains
  inference text and never upgrades an alert or confirmed fact.
- Data Integration should render exactly one registry-driven row per source and
  keep truth, access, 2026 state and runtime health as four separate dimensions.
  Connected-zero must say “No current records”, never “All clear”.
- Mobile should use four labelled navigation destinations, full-height layer/
  detail drawers and 44px targets; the map stays the primary Live/Replay surface.
  Required distinct states are loading, connected-zero, filtered-zero, partial
  error, total error, stale, mock, restricted and paid/key-required.
- UI/UX Pro Max was queried with React, variance 3, motion 2 and density 8. Its
  loading feedback, stable-key, responsive, contrast, focus and reduced-motion
  rules are applicable. Its exaggerated-minimalist landing pattern, oversized
  type, luxury-style whitespace, red-dominant palette, Google Fonts and GSAP
  reveal are rejected because they conflict with the established WCC operations
  system, dense scanning tasks and no-new-dependency boundary.

### WorldMonitor first repository pass

- Agent Reach's GitHub route verifies `koala73/worldmonitor` is a large real-time
  intelligence dashboard with separate `api`, `server`, `workers`, `shared`,
  `src`, `data` and test surfaces. Its root publishes `ARCHITECTURE.md` and
  `CONCEPTS.md`; the repository uses a non-standard `Other` licence, so no source
  code or visual assets should be copied without a licence review.
- The tree shows useful patterns to inspect rather than transplant: versioned
  domain RPC routes, shared freshness/source-unavailable helpers, health and
  seed-envelope contracts, bounded provider proxies, CORS/rate limits,
  notification channels and domain-specific dashboards.

### WorldMonitor architecture decision

- The audited upstream commit is `0fca203`. Adopt its server-owned provider
  boundary, bounded per-feed timeouts, request coalescing, last-known-good
  fallback, source-health ledger and distinct transport-age/content-age checks.
- Each WCC adapter contract must declare source/schema version, raw provider
  format, validator, freshness target, stale budget, provenance, geographic
  scope and failure class. Deterministic fixture adapters implement the same
  contract but always stay synthetic and zero-weight.
- Health precedence must keep `unavailable`, `blocked`, `degraded`, `partial`,
  `stale`, `empty` and `live` distinct. A dashboard must not translate failed or
  stale ingestion into “no incidents”.
- Adopt a declarative map-layer registry and a server health-to-view-model
  boundary. Avoid WorldMonitor's dual-map and very large central config shapes.
- Alert ingestion, correlation, deduplication, severity policy and delivery
  belong on the server. The browser can subscribe, display and acknowledge but
  cannot create a confirmed incident or initiate life-safety notification.
- Use versioned query/command routes. Polling may provide a recovery path, but
  future high-priority operations should use a server stream with polling
  fallback. This hackathon slice implements the query/snapshot boundary only.

### Phase 13 TDD boundary

- The first RED contract covers one integration record for all 33 registered
  sources, partial source failure without blanking healthy records, official-
  envelope Mock records at zero evidence weight, and deterministic review-only
  alert candidates. The expected failure is the missing shared integration
  module, before any production code exists.

### Literal 33-source adapter audit

- Classification is complete: 13 immediately connectable source families, one
  connected empty activation feed, four static/planned context products, four
  API-key/paid fixtures, four permission/input fixtures, six terms-review
  fixtures and one stale source.
- Highest-priority current adapters are WCC road closures, public NEMA EMA CAP,
  GeoNet WLGT sea level, GeoNet shaking products and GWRC Hilltop. Existing WCC
  Transport Sensor data remains batch replay because the publisher cadence is
  at least monthly, even though its rows are hourly.
- `metservice-cap` and WCC Emergency Assistance Centres can legitimately return
  zero records. Their state is “No current records”, never an all-clear claim.
- Paid/keyed official mock envelopes are: GTFS-RT `FeedMessage` for Metlink,
  Eventfinda `events[]` with paging, Google Routes `routes[]`/matrix elements and
  Google Places top-level Place fields. NEMA authorised EMA uses CAP 1.2-shaped
  synthetic data only; no restricted record or endpoint is fetched.
- Terms-review sources (water jobs, NEMA electricity/boundaries, WCC calendar,
  airport and cruise) remain Mock/zero-weight until redistribution clearance.
  Public reachability does not change this state.
- Static schedules, facilities, boundaries and planned works are ontology
  context and never become current incident evidence without a separate,
  time-stamped operational observation.
- Live connector parsers must preserve source-specific time and geometry: NZTA
  `lastUpdated` plus event time, CAP `effective/expires`, GeoNet event/sample
  time, ArcGIS native NZTM converted through `outSR=4326`, and empty activation
  arrays without synthetic rows.

### Implemented Phase 13 runtime

- The Worker now owns three versioned read-only boundaries:
  `/api/integration/v1/contracts`, `/api/integration/v1/snapshot` and
  `/api/alerts/v1/candidates`. All provider fan-out is server-side and partial
  failure preserves healthy source results.
- Ten keyless current adapters are enabled: GWRC rainfall/Hilltop spatial view,
  NZTA road events, MetService CAP, GeoNet quakes, GeoNet WLGT Tilde, WCC road
  closures, WCC Emergency Assistance Centres, NZTA camera metadata, public NEMA
  EMA CAP and GWRC park notices. The other 23 contracts remain batch, context,
  stale or official-format Mock according to the literal matrix.
- The 2026-08-10 11:48 NZST operational check returned 61 normalized records.
  Six connectors had fresh records, three were connected-empty and one live
  connector family returned only stale records; four non-live/context contracts
  also retained their declared stale/unavailable state.
- Seven current alert candidates passed all gates in that check: six active NZTA
  road events and one approved WCC road closure. Planned NZTA events, stale
  earthquakes, the non-local public CAP record, camera/context records and every
  Mock source were excluded.
- Provider epoch seconds are normalized separately from milliseconds. CAP
  freshness is evaluated as an active feed snapshot while preserving `sent_at`,
  `effective` and `expires`; validity and Wellington locality gates are applied
  before CAP can enter the alert queue.
- `/live`, `/alerts`, `/replay` and `/integration` now share one operator shell.
  Live has selectable source layers, real OSM tiles, distinct map symbols, pan,
  zoom, fullscreen, hover/select inspection and a keyboard observation list.
  Replay retains the existing date/hour/speed/trend surface.
- Alert Centre exposes the deterministic sensor/ontology/policy boundary and a
  clearly synthetic LLM workflow preview. The live API marks LLM authority as
  explanation-only and returns no confirmed facts.


## Phase 12 map and UI audit

- The current canvas projection multiplies scale by `zoom` around a fixed city
  centre. Wheel, button and slider zoom never adjust the view centre and there
  is no pan state, so peripheral countlines leave the viewport and cannot be
  reached after zooming.
- Canvas hit targets and pointer positions are both stored in CSS pixels, so
  device-pixel ratio is not the mismatch. The selection gap is an interaction
  model problem, not a raw coordinate-unit bug.
- The transparent interaction layer supports hover only. It does not expose a
  click handler that updates `selectedSignalKey`, so the map cannot directly
  select an evidence region even when the marker is visible.
- The correct minimal fix is cursor-anchored zoom plus drag-to-pan and
  click-to-select. Pan values should stay in refs during pointer movement and
  use the existing requestAnimationFrame draw path; only drag start/end need
  React state for feedback.
- `Reset map view` currently resets zoom only. Its contract must expand to clear
  pan and restore the fitted city view.
- The current style is a recognisable sharp-edged civic operations language:
  harbour paper, civic ink, amber state accent, narrow headings and mono data.
  Preserve these tokens. Improve hierarchy by bringing the map forward,
  tightening the oversized intro, clarifying interaction guidance and extending
  focus-visible states to form controls.
- No new design-system dependency is justified. The chosen redesign-preserve
  dials are variance 3, motion 2 and density 6; motion is limited to direct
  hover, focus, pressed and drag feedback.
- The first real browser snapshot at 1440-class desktop width renders all Phase
  12 guidance and controls in the intended operator order. The map exposes a
  paused inspection layer, direct click/drag guidance, zoom controls and a
  keyboard-accessible signal list; source and replay truth labels are preserved.
- The scrolled desktop map remains legible with the source rail and evidence
  rail visible together. Marker direction arrows are distinct, the map controls
  do not cover the central signals, and the new instruction card does not
  obscure the active Wellington CBD cluster.
- A real wheel gesture over the Wellington map changed the continuous zoom from
  100% to 150%, kept the pointed CBD area in view and enabled Reset. This
  verifies the real pointer-anchored path rather than only the pure helper.
- A real drag gesture at 150% shifted the visible Wellington extent while the
  marker cluster and basemap stayed aligned. The first manual click probe landed
  outside the small marker hit radius and intentionally did not change evidence;
  selection still requires a direct marker hit, not an arbitrary map location.
- Browser screenshots are visually scaled in the tool output, so screenshot
  display pixels cannot be reused as raw CSS coordinates for precise hit tests.
  The next probe derives coordinates from the live overlay bounds and map data.
- The exact-hit harness now uses the real countline coverage bounds, the same
  Web Mercator projection and the live CSS overlay rectangle. This avoids both
  screenshot scaling and any fabricated test-only hooks in production code.
- The browser wheel gesture also moved the document by roughly 15 CSS pixels in
  this embedded test surface. The anchored marker remained stable inside the
  canvas, but its viewport coordinate shifted with the page; the final click
  probe therefore adjusts by the live overlay displacement.
- The in-app screenshot is a 1265×712 JPEG while the CSS viewport is 1667×792.
  CUA uses the rendered screenshot coordinate space, whereas locator clicks use
  CSS pixels. Precise automated selection therefore uses the zoom slider and
  CSS projection; the real wheel path remains a separate visual verification.
- Direct automation changed the range element property without firing React's
  controlled state. The exact selection check therefore uses the visible Zoom
  in buttons, matching the real user path and keeping test instrumentation out
  of the application.
- The visible Reset and Zoom in controls restore a reproducible 150% view. The
  percentage status follows application state correctly; the raw range element
  may round to its native step and is not used as the verification oracle.
- The 150% screenshot confirms several target markers remain large and visible,
  but a local reimplementation of the renderer did not reproduce their exact
  screen positions after responsive layout and scroll changes. Final selection
  verification therefore uses the visible screenshot marker itself rather than
  treating duplicate projection code as an oracle.
- The final real-browser marker probe succeeded at 150% zoom: clicking the
  visible CBD marker changed the evidence panel from `Thorndon Quay road` to
  `Ara Moana left`. This directly verifies the user's failed zoom-and-select path.
- The desktop console contains only Vite connection and React development
  notices. There are no application errors or warnings from the new pointer,
  zoom, pan or selection paths.
- At 390×844, the layer workspace remains readable with no clipped controls.
  Its prominent close control collapses the long source setup into a compact
  `Layers 1/33` button, bringing replay and map work back into the primary flow.
- The collapsed mobile view has no horizontal overflow (`scrollWidth 375` in a
  390-pixel viewport). Replay controls, zoom slider, fullscreen action, pause
  guidance, movement marker, legend and attribution remain visible and legible.
  Mobile console inspection is also free of errors and warnings.


## Phase 10 remaining-source inventory

## Phase 11 Eventfinda and Metlink contract verification

- Eventfinda's official v2 API is REST and uses HTTP Basic authentication after
  an instant developer-key application. The events resource exposes stable event
  ID, canonical URL, local start/end, timezone, location summary, optional point
  coordinates and sessions. Standard-access descriptions may be truncated.
- Eventfinda content may be displayed only in the website/application named in
  the API-key request. The public demo therefore cannot fetch or republish real
  Eventfinda records until a key is issued specifically for this application.
  Without credentials the ontology must show `api_credentials_required`, zero
  records and zero evidence; no HTML scraping fallback is allowed.
- Eventfinda events are `planned_demand_context`. A schedule may explain an
  expected increase, but it is not observed attendance, congestion or disruption.
- Metlink's official developer portal provides static and realtime Wellington
  public-transport data. Static GTFS is downloadable without a key; live APIs
  require a portal API key and must be called with the documented authentication.
- Bus-relevant realtime products are GTFS-RT `servicealerts`, `tripupdates` and
  `vehiclepositions`, plus stop predictions. Bus routes are GTFS `route_type=3`
  and school buses `route_type=712`; rail/ferry/cable car must not be silently
  included in a bus-only view.
- Bus delay is represented by trip-update delay seconds at a trip/stop/time,
  while cancellation/disruption comes from trip schedule relationship and
  service-alert validity/effect. A service alert cannot be rewritten as a
  measured movement count.
- No Metlink key is present in the project. The implementation may add a tested,
  key-gated adapter contract, but must not fetch live records or commit a key.

### Phase 11 implementation audit

- `source_registry()` is the single deterministic contract generator and
  currently emits 24 entries. It already has separate `metlink-static-gtfs` and
  `metlink-realtime` contracts plus a WCC Eventfinda-backed calendar contract,
  but no first-class Eventfinda API contract or endpoint-level Metlink bus-delay
  semantics.
- `build_city_ontology()` currently builds one case chain only: movement
  observation, countline, corridor, time window, movement state, potential
  impact, unknown access and hypothesis. It has no DataSource/DataLayer nodes,
  so the 2026 layer catalogue must be added explicitly without altering the
  existing case relationships.
- `build_ontology_demo.py` writes v2 registry/evidence/observations and the v3
  city graph from deterministic local inputs. It has no credentialed-network
  fetch path. This is the correct security boundary: build ontology contracts
  locally and use optional supplied snapshots rather than embedding secrets.
- The layer UI is registry-driven and marks only `wcc-transport-sensors` as
  playable. Adding real/context/empty source-layer ontology nodes does not need
  to make them replayable; that hard gate should remain unchanged.
- The source capability preview already counts truth states from the registry.
  It can expose a separate 2026 availability state without inventing records or
  changing map playback.
- The visible addition should extend the existing civic operations language,
  not redesign the page: a compact “2026 layer register” grouped by record
  state, with source/role/access encoded structurally. The memorable element is
  a typed provenance rail from source layer to ontology role, not decorative
  cards or new animation.
- No `.openai/hosting.json` exists in this repository, so the Sites-building
  skill is not automatically required by a project hosting manifest. Existing
  project deployment commands remain the later publishing path if authorised.
- Existing Python tests hard-code 24 registry sources and the rendered layer
  workspace asserts 24 source rows. Phase 11 must deliberately move both
  boundaries to the new literal registry size after RED proves the old contract.
- `MovementCanvas` source rows currently show role, truth, access and playable
  record state. A small additional 2026-state tag can expose `real`, `context`,
  `empty`, `credentials required`, `restricted` or `stale excluded` without any
  new map behavior.
- README still describes 24 sources and only one city-case semantic chain. It
  must document `DataLayer` as a non-evidence ontology type, the Eventfinda
  application-specific key condition, and Metlink bus alert/delay endpoints.
- The existing visual system already supplies civic ink, harbour teal, amber,
  coral, narrow display type and monospace data labels. Phase 11 should reuse
  those tokens and add one dense provenance register beneath the semantic rails;
  no new palette, font dependency or motion is warranted.
- The checked-in v2/v3 artifacts are regenerated deterministically from
  `artifacts/ontology-replay-ticket.json`, the existing v1 movement GeoJSON and
  countline `48038`. No external credentials or network calls are needed to
  publish the expanded 2026 source-layer ontology.

### Baseline and first official sweep

- The current registry has 24 contracts. It already covers WCC transport
  counts/tickets/closures/events/water jobs/tanks/emergency routes, NZTA TMS and
  delays, GWRC Hilltop, MetService CAP, GeoNet quake/Tilde/Shaking, WREMO hubs,
  NEMA CAP/electricity/CDEM boundaries, Metlink static/realtime, airport/cruise,
  and Google Routes/Places.
- The local hackathon catalogue has 74 first-class GIS datasets and a separate
  60+ source research sweep verified 2026-08-04. Most of its hazard layers are
  static context, not additional active observations.
- Official WCC/GWRC searches independently expose credible gaps not in the 24:
  WCC Street Light Outages; GWRC activation-time Incident Areas; WCC activation-
  time Emergency Assistance Centres; GWRC ambulance, fire, hospital, medical
  centre and police facility layers; NZTA traffic cameras and carriageway status.
- The same catalogue identifies additional operational candidates: FENZ active
  fires/fire-danger; Transpower GZ8 load; 2degrees outages; CentrePort harbour
  weather/tide telemetry; Interislander/Bluebridge disruptions; public Civil
  Defence EMA RSS; and selected international hazard cross-checks.
- Official catalogue evidence reconfirms NZTA TREIS/delays as verified state-
  highway incidents. It is already represented by `nzta-road-events`, so it is
  not a new source.

### Official search verification — operations and exposure

- WCC's public street-light map exposes reported time and estimated fix date.
  This is a genuine work/outage observation, but it indicates lighting/access
  safety context rather than road closure or general electricity loss.
- Transpower's official GZ8 page exposes Wellington MW, MVAR and power factor,
  normally over a 24-hour window. It is current aggregate corroboration only;
  Transpower explicitly labels it best-effort/indicative and monitored mainly
  during business hours.
- FENZ's official historical incident dataset is CAD/SMS-derived and suitable
  for baselines, but it is not a live incident feed and lacks precise public
  coordinates.
- LINZ NZ Facilities is CC BY 4.0, ongoing, machine-accessible and provides
  hospital/school polygons with source IDs, use type, last-modified date and
  estimated occupancy where known. Occupancy is static exposure context, never
  a real-time count.
- LINZ's emergency-management guidance identifies Stats NZ resident population,
  buildings, addresses, suburbs/localities, property, transport and rivers as
  authoritative context. Rapid building assessments are explicitly not yet a
  national open dataset.
- NationalMap's monthly Emergency Management Basemap includes hospitals,
  schools, retirement villages, event centres, prisons, fuel, food and medical
  facilities, but its reuse/API contract needs review before ingestion.

### Official search verification — emergency and hazard extensions

- FENZ publishes last-seven-day incident reports from ICAD on its official site,
  with an explicit incompleteness/statistical-use caveat. This is a current
  incident observation candidate, but public location precision and machine
  reuse terms must be checked before mapping. FireMapper's richer live CAD,
  appliance and coordinate layers are responder-facing and permission-gated.
- New Zealand's Public Safety Network has a cross-carrier Cellular Network
  Visibility Service with live outages/planned works, but the official material
  describes access for emergency services/coordination centres rather than an
  open public feed. Register as `permission_required`, not public data.
- GWRC's public environmental viewer confirms Hilltop covers more than rainfall
  and rivers: air quality, climate, groundwater, lakes/wetlands, tide and water
  quality. These are additional series under the existing `gwrc-hilltop` source,
  not independent evidence providers.
- GeoNet's official access docs confirm Tilde includes coastal, DART, GNSS and
  landslide series; FDSN and AWS add waveform/archive paths. These should extend
  existing GeoNet contracts rather than inflate the source count. DART normal
  packets are 15-minute samples every six hours, switching to 15-second event
  mode; stale/non-operational status must be checked.
- GeoNet strong-motion archives update recent files hourly but may contain
  non-seismic noise. Event-linked processed products remain preferable for
  evidence; raw streams are expert context.
- CentrePort confirms the fixed ferry infrastructure and two operators, but no
  additional machine-readable public disruption contract was found in search.
  Operator pages remain clearance-required HTML/GraphQL candidates.

### Direct endpoint verification — 2026-08-10

- WCC Planned Works contains 510 polygon jobs, all currently classified as
  surfacing, with proposed starts from 2025-07-01 through 2027-07-01 and expected
  completion dates extending to 2028-06-30. It is planned-access context.
- WCC Emergency Assistance Centres is a current public activation FeatureServer
  with facility, suburb and wheelchair-accessibility fields and zero rows. Empty
  is the intended peacetime state.
- GWRC Incident Areas contains one stale ICP polygon dated 2019. The adapter must
  reject it under a freshness rule while retaining the activation capability.
- NZTA cameras returned 319 national points; 26 fell inside a broad Wellington-
  region bounding box and one of those was marked offline. Camera images are
  human-review inputs, not automatic volume measurements.
- WCC Street Light Outages contains 452 points, but parsed dates end in June
  2025. It is not a current outage feed as of this review.
- Wellington Regional Transport Status holds 19,599 road, 66 rail and 3 airport
  features, but sampled status values were all open and effective record edits
  were from 2021–2024. It cannot contradict a 2026 disruption observation.
- NZTA Emergency Management Carriageway Status has 1,015 segments and useful
  network/capacity fields, but service edit metadata is from 2023. Use it for
  road entity context, not current status.
- NEMA's official CAP guidance confirms the public EMA RSS/Atom messages are
  intended for attributed redistribution. This public message feed is distinct
  from the restricted broadcast-polygon ArcGIS item.
- The final inventory classifies 53 deduplicated source groups: 8 connect-next,
  11 permission/key/terms-review, 17 context-only, 6 existing-source extensions,
  4 optional non-government corroborators and 7 exclusions.

### Official catalogue expansion discovered

- The WCC Transportation ArcGIS folder exposes `StreetLightOutages` and
  `PlannedWorks` as distinct services. Street-light faults are an operational
  safety observation; planned works are expected-access context.
- The GWRC public ArcGIS catalogue also exposes Incident Areas, public transport
  routes, park-and-ride, bus replacement stops, pedestrian-network constraints,
  regional cycleways, corridor resilience, strategic access points, freight
  routes, traffic volumes, route speeds, emergency facilities, supermarkets,
  GPs and schools.
- Most of those GWRC datasets are static or planning context. They must not be
  labelled live disruption evidence unless service metadata and record times
  establish a current operational observation.
- `Wellington_Regional_Transport_Status_V2_VIEW` and WCC `PlannedWorks` are
  priority contracts to inspect. WCC `ForwardWorksViewer` is an aggregation
  surface and should not be counted independently when it repeats component
  records.
- Final output will separate directly connectable sources, permission/key/terms
  review, context-only layers, extensions of existing contracts and exclusions.
  Catalogue breadth will not be presented as independent evidence breadth.

---

## Phase 9 zoom/fullscreen audit

- The current viewport already accepts a numeric zoom factor, but UI state is
  limited to `1–4` in fixed `0.5` button jumps. The projection itself can safely
  accept a wider bounded value without changing any source geometry.
- The transparent paused-inspection layer is the correct wheel target because it
  covers the canvas but remains below the zoom controls. A slider supplies the
  keyboard/touch path and removes dependence on discrete buttons.
- Browser fullscreen should target `.map-stage`, not the whole application, so
  replay and evidence state remain mounted. A `fullscreenchange` redraw keeps
  canvas pixels and hit targets aligned with the new dimensions.

---

## Phase 8 paused-inspection audit

- The map is a canvas, so browser-native feature hover is unavailable. The
  smallest honest interaction is to retain only the screen coordinates of
  markers actually drawn for the selected real replay layer and hit-test them
  in a transparent sibling surface.
- Inspection eligibility must reuse the same playable-source rule as replay and
  add `isPlaying=false`; otherwise contract-only layers could appear connected
  or an animated map could expose stale positions.
- The hover summary reuses fields already present on each rendered feature:
  name, class, direction, change direction, observed/expected counts and time.
  It requires no new feed, synthetic record or causal inference.
- Pointer hover is a convenience, not the only inspection path. The existing
  signal list remains the keyboard-accessible presentation of the same records.

---

## Phase 7 layer-workspace audit

- `MovementCanvas.tsx` currently has one canvas draw pipeline: OpenStreetMap
  tiles, all countline coverage, then current replay signals. The three layers
  can be gated independently without changing coordinates or data contracts.
- Playback currently advances whenever the replay artifact exists. It must also
  require the WCC movement source layer to be selected and must stop immediately
  when that layer is switched off.
- The registry contains 24 source contracts but only `wcc-transport-sensors` has
  `demo_data_status=real_replay`. The other 23 layers can be exposed for
  integration selection and state review, but all must show zero playable
  records and cannot add canvas features or evidence.
- Existing people/vehicle filters are textual and the direction marker is a
  neutral circle/arrow. Phase 7 should parameterise that marker size instead of
  reintroducing person or vehicle pictograms.
- The left rail should live inside the investigation frame so hiding it expands
  the map while preserving the separate evidence column and existing replay UI.
- The implemented policy keeps presentation separate from evidence: all 24
  contracts are independently selectable, while `sourceLayerState()` identifies
  only WCC Transport Sensors as playable. Mock/permission/paid/registry layers
  remain visible integration choices with zero records.
- Base tiles, countline coverage and movement signals are now independent draw
  flags. The canvas still uses full coverage geometry to calculate a stable
  Wellington viewport even when the coverage overlay itself is hidden.

## Phase 6 ontology-extension decision

- Preserve the existing evidence lifecycle as the epistemic spine and add a
  city-semantic projection rather than replacing the v2 graph.
- The current v2 artifact is deliberately compact but flat: one resolved
  `TransportCorridor`, observation references, one hypothesis, a decision state
  and no confirmed facts. It has no first-class sensor, time, movement-state,
  impact or access-state nodes, so those belong in the new projection.
- The existing builder already owns the explicit countline-to-corridor crosswalk
  and selected real movement feature. The v3 graph can therefore be generated
  deterministically at the same boundary without a proximity join or new input.
- The current case ledger is server-rendered and already imports static graph
  artifacts. A small dedicated server-rendered explorer can add semantics with
  no client state, network request or effect on replay/map interactions.
- The smallest useful operator path is: movement observation → countline sensor
  → explicitly named corridor/place → selected time window → increase/decrease
  state → potential access impact. Access remains `unknown` unless a separate,
  authoritative, time-aligned access observation says otherwise.
- Potential impacts are candidate inferences for investigation, never confirmed
  causes, closures, evacuation orders or accessibility facts.
- The UI signature will be a relationship-labelled semantic rail that explains
  both what each node can support and what it cannot assert.

## Phase 5 history audit

- The deployed interface hard-codes one target (`2026-08-06 12:00`) and fetches
  one movement GeoJSON. The detector itself already accepts any target hour and
  correctly excludes future rows, so the missing layer is a bounded replay
  artifact plus coordinated client state.
- The official WCC layer still identifies the source as public, hourly
  Transport Sensors data and says it refreshes no less than monthly. Its public
  S3 listing contains monthly CSVs from November 2023 through August 2026 and
  eight Parquet shards; the objects were refreshed on 9 August 2026.
- A compact static contract should keep geometry in the existing 414-countline
  coverage feed and store each replay slot's signal metrics plus its 12 prior
  matched weekday/hour observations. This supports replay and a truthful trend
  without shipping raw citywide person/vehicle records to the browser.
- The intended control is an operations-style time transport: date, hour,
  previous/next, scrub and play. The evidence panel gains one observed-versus-
  expected trend for the selected signal; map and chart always share one slot.
- The real bounded artifact contains 144 hourly slots from 1 August 00:00 to
  6 August 23:00, 929 investigation signals total, zero to 33 per slot (6.5
  average), and is 2.12 MB as readable JSON. This is small enough for one cached
  static browser request while retaining each candidate's audit history.
- The first complete generation took 218.5 seconds. Most time is repeated
  pandas filtering/grouping across 144 slots; this is an offline publishing cost,
  not browser latency, but the builder should reuse pre-grouped dates/hours in a
  later optimization if frequent refresh becomes necessary.


## Phase 4 map audit

- `MovementCanvas.tsx` currently draws both coverage and anomalies into one
  canvas over a CSS grid. Coordinates are linearly fitted to the full WCC sensor
  extent and zoomed around the viewport centre.
- Existing interaction includes zoom in/out/reset and signal filtering, but not
  map panning. Phase 4 will preserve the implemented interaction contract rather
  than silently expanding scope.
- A dependency-free tile renderer inside the existing canvas is the smallest
  compatible change: draw attributed OpenStreetMap tiles first, then reuse the
  WCC coverage and anomaly overlay. The existing CSS grid remains visible while
  tiles load or if the tile service fails.
- OpenStreetMap's current tile policy permits normal human interactive viewing
  that requests only the visible viewport. It requires the exact HTTPS tile URL,
  visible on-map attribution, a valid browser referrer and respect for HTTP cache
  headers; bulk prefetch and offline downloads are prohibited.
- The implementation meets that prototype boundary: browser-direct visible
  tiles only, `strict-origin-when-cross-origin` referrer behavior, in-memory image
  reuse, no prefetch/offline mode, and linked `© OpenStreetMap contributors`
  attribution. The service remains best-effort, so the sensor grid fallback is
  intentionally retained.
- Desktop browser verification shows a recognisable Wellington coastline,
  harbour, roads, suburbs and labels beneath the WCC countlines. Movement markers
  remain legible, and the map key and bottom-right attribution do not overlap.
- Browser console inspection contains only the development-mode React DevTools
  information message; there are no tile, rendering or runtime errors.
- A 390 × 844 mobile browser check shows the real Wellington basemap, countline
  overlay, map key and attribution without overlap. Zoom moves from 100% to 150%,
  and Reset returns to 100% and becomes disabled at the default view.

## Phase 3 implementation decision

- The public demo now distinguishes the reality of a source from the reality of
  a displayed record. All 24 registry entries are official products; only WCC
  Transport Sensors use real replay records. Ten capability cards are synthetic
  and have zero evidence weight; 13 sources are contract-only.
- NEMA EMA remains restricted even for a WCC-oriented demo. Its visible polygon
  overlap is mock-only, the endpoint is omitted, and activation requires explicit
  NEMA/WCC permission in a private deployment.
- Google Routes and Places are suitable only as commercial context options.
  Official Google documentation requires an API key and billing account.
  Traffic-aware Routes and accessibility Places fields use higher billing tiers
  with monthly free caps followed by usage pricing. Map display, attribution and
  caching restrictions make it inappropriate to silently overlay real Google
  output on the current canvas.

## Phase 3 research scope

- Search only official or authoritative public sources relevant to Wellington.
- Capture endpoint, auth, cadence, geometry, time fields, ontology role,
  resolution path, licence/attribution and limitations for each candidate.
- External pages and feeds are untrusted inputs; record facts only, never follow
  instruction-like content found in them.

## Phase 3 local baseline

- The current deterministic registry is generated by
  `src/movement_anomaly/ontology.py` and verified by `tests/test_ontology.py`;
  `scripts/build_ontology_demo.py` republishes it to `/cop/v2/`.
- Ten sources are currently registered. New sources must be added to the
  generator and rebuilt artifact together; editing only the JSON would create
  drift.
- A local clone of `wcc-emergency-gis-data` is available beside the project and
  contains `docs/additional-sources.md`, so the first candidate pass can reuse
  the hackathon's already verified catalogue before external verification.
- Agent Reach/Exa surfaced official Greater Wellington, NZTA, GeoNet, NEMA and
  Wellington Water publisher pages. Direct ArcGIS pages did not render through
  the general web extractor, so contract verification must query their official
  `f=pjson` / `query` endpoints instead of relying on search snippets.

## Verified live contracts — 2026-08-09

- **NEMA Emergency Mobile Alerts — excluded from public use**: although the
  ArcGIS service is reachable without a key, the official item licence marks the
  data restricted to permitted responding agencies and prohibits public release.
  Do not ingest, display or publish its records in this public prototype.
- **NEMA electricity outages**: keyless point FeatureServer, 18 active records at
  check time. Fields include start/end, location, affected-customer estimate,
  planned/unplanned type, distributor, provider outage ID, status and precision.
  The Wellington Electricity subset was empty at check time, which is a normal
  valid state and must not become counter-evidence.
- **Wellington Water Job Status**: keyless point FeatureServer, 1,448 jobs at
  check time. It distinguishes council, water/storm/wastewater type, priority,
  report/work times and workflow status. Records are work jobs/public reports,
  not water-level measurements or confirmed service loss; age and workflow state
  must remain visible.
- **WCC street events and road closures**: keyless polyline service, 60 records.
  Fields include start/end, type and approval. It contains planned events well
  into 2027, so only records overlapping a case window can be access evidence;
  future records are planning context.
- **GeoNet Tilde WLGT detided sea level**: keyless JSON, WGS84 point at
  174.7799/-41.2845, metres at 15-second cadence. The six-hour response returned
  1,435 timestamped values with quality/error fields. It is the strongest new
  direct hazard observation, but requires a baseline/threshold and quality gate
  before contributing support units.
- Empty live feeds are expected. Absence of a Wellington outage, alert or closure
  is `missing`/`no current record received`, never contradicting evidence.

## Phase 3 selected registry expansion

Add the selected contract-only source entries and keep the demo replay
observations unchanged:

1. GeoNet Tilde WLGT detided sea level — direct hazard measurement, CC-BY.
2. GeoNet Shaking Layers — versioned event footprint, CC-BY; exact quake ID link.
3. WCC street events/road closures — official local-access event; time/approval gated.
4. Wellington Water public jobs — workflow observation; privacy and source cap.
5. Wellington Electricity direct outages — provider observation; coarse public location.
6. NEMA electricity outages — national fallback; licence review and deduplicate against provider feed.
7. NEMA CDEM boundaries — static response-authority entity resolution only.
8. Metlink static GTFS — route/stop/schedule entity graph only, not actual service state.
9. WCC emergency water tanks — static response/lifeline capability context only.

Also add `nema-cap-alerts` as restricted metadata only, with no endpoint in the
public registry and an explicit `restricted_not_ingested` state. This records
the WCC/NEMA operational capability requested by the user without exposing the
restricted polygon feed on the public demo.

Enhance the existing GWRC Hilltop entry with its spatial current-rainfall
endpoint and freshness rule. Keep NEMA EMA restricted, traffic-camera images,
Transpower page-embedded load, airport HTML/API, telco provider data, building
footprints and Stats NZ population grid out of this public expansion for now:
they are restricted, require human interpretation, lack a stable/licensed
contract, duplicate a stronger source, or are static/key-gated lower priority.

GeoNet Shaking Layers is a materially distinct product from the quake catalogue:
it publishes versioned MMI contour GeoJSON roughly after qualifying events. It
supports spatial event-footprint resolution, never direct building-damage claims.

## User-added planned-demand context

- Verify official Wellington city/social event calendars, Wellington Airport
  flight timetable/status, and Wellington/CentrePort cruise schedules.
- Calendar/timetable rows are `planned_activity_context`; they may explain an
  expected movement rise or identify likely crowd/transport demand, but cannot
  support a disruption hypothesis merely because an event was scheduled.
- A cancellation, delay, actual arrival/departure or overlapping official road
  closure can become a separate observation with its own observed/published time.

### Verified schedule surfaces — 2026-08-09

- **WCC Eventfinda calendar**: the official WCC page responds with ten current
  event cards and links to Eventfinda. WCC explicitly notes not all listed events
  are Council initiatives. It is HTML, not an official API/ICS contract, and
  Eventfinda reuse terms still apply. Register as planned-demand context only;
  do not republish event content automatically.
- **Wellington Airport flight board API**:
  `https://www.wellingtonairport.co.nz/api/flights/?direction=A` (`D` for
  departures) returned structured JSON with board day, last-updated text and six
  current rows. Each row exposes place, scheduled/estimated time, carrier,
  domestic/international zone, flight number, gate and status. Scheduled rows are
  context; status/estimated changes are provider observations tied to the fixed
  `airport:WLG` entity. Reuse licence is not explicit, so registry-only until
  terms are confirmed.
- **CentrePort cruise/shipping**: the official cruise and live-shipping pages are
  public and link to `centric2.centreport.co.nz`. The 2026/27 cruise schedule is
  not yet a confirmed machine feed; do not substitute third-party cruise sites.
  Register the official page as pending planned context and prefer the live
  shipping dashboard for actual vessel status only after its data contract is
  verified.

## Verified supporting entity/lifeline contracts

- **Wellington Electricity direct feed** returns separate planned and unplanned
  arrays with provider IDs, status/time-based status, event/update/ETA times,
  affected-customer counts, outage point and affected streets. It is higher
  resolution than NEMA but represents the same distributor events. Use the
  provider outage ID for deduplication and a shared correlation group; never
  award evidence units to both copies of one outage. Public output should retain
  the coarse outage point/suburb and suppress the street-level area list.
- **NEMA CDEM boundaries**: 15 polygons with group name and official URL. This is
  stable authority/entity resolution (`point in polygon`), not event evidence.
- **WCC emergency water tanks**: 45 point assets with stable ID, owner, status,
  type, location and capacity. This supports lifeline/response capability and
  downstream impact, but remains static context until a status observation is
  time-stamped.
- **WCC building footprints**: 100,501 polygons with stable spatial IDs,
  approximate height and base elevation. Useful for exposure/entity context,
  not proof of occupancy, damage or affected population.
- The source registry is generated from one literal list in `source_registry()`;
  Python and rendered-artifact tests currently assume exactly ten entries.
  Phase 3 should update the generator, CLI artifact and both test boundaries,
  rather than hand-editing the published JSON.

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
# Phase 14 — easy setup findings

- The existing four-item mobile navigation can safely grow to five labelled
  destinations; five remains the recommended upper bound for bottom navigation.
- Remote MCP setup should default to Streamable HTTP. A2A discovery should begin
  with an Agent Card URL, normally `/.well-known/agent-card.json`.
- A public browser form must not accept or persist credential values. The setup
  page records only a server-side secret reference and leaves evidence weight at
  zero until activation is approved.
# Phase 16 — alert ticket workbench findings

- The alert endpoint is read-only and the current hosting contract has no review-record persistence surface; a truthful device-local draft is the smallest safe editable workflow.
- Candidate severity, source, observed time, epistemic state and evidence are system facts. Operators should edit only disposition, assignment and notes.
- The current `300px + detail` structure is usable but oversized: a 680px forced height, 28–44px headings and 145px evidence cards reduce queue scan speed.
- A master-detail queue is a better fit than a Kanban board: it keeps one case in focus, preserves keyboard selection and avoids drag-only interaction.
- Existing mock candidate data must remain visibly synthetic and zero-weight even when its local review draft is edited.
- The specialised incident-queue UX query had no database match. The applicable built-in defaults are visible form labels, read-only distinction, 44px controls, inline success feedback, preserved loading space and no reliance on drag or hover.
- The site uses React 19/vinext and has no D1 or R2 binding. Existing Setup code already establishes the browser-only draft convention to reuse without adding infrastructure.
- The broader UX search matched keyboard navigation, visible focus, submit feedback and a useful no-results recovery. Product guidance favours a data-dense drill-down layout, consistent with the selected queue/detail design.
# Phase 17 — April storm 回测 findings

- The user requests a 18–22 April 2026 storm case study with strict `available_at` replay, an 18 April training cutoff, post-event evidence withheld as ground truth, and no mock contribution to fitting or scoring.
- A single event can validate replay behavior and alert lead time but cannot establish general accuracy or train reliable fusion weights.
- The requested UI belongs as a labelled secondary action in Live Operations, not a sixth primary module, so live state and retrospective evidence remain distinct.
- The current Replay Analyzer only packages real WCC movement observations for 1–6 August 2026. An April workflow must therefore begin as an event/evaluation contract and cannot imply April movement rows already exist.
- Live Operations already has a compact action strip; adding a labelled 回测 link there preserves the five-item primary navigation and does not mutate live snapshot state.
- The Agent Reach executable is unavailable in this environment, so official pages will be read through its documented Jina/Web fallback rather than guessed.
- Official GW committee material records 85.9 mm in one hour at Berhampore on Monday 20 April, while a later GW news page says “Monday 24 April”. The event pack must retain both claims and normalize to 20 April with an explicit correction note and stronger-source basis.
- GW's monitoring article records the Hutt River at Taitā Gorge peaking near 475 m³/s at 22:30 on Monday 20 April; the same article confirms Pāuatahanui impacts beginning Saturday 18 April.
- WCC's report index describes the 20 April 2026 severe weather event and later emergency-event/rates-relief action. This is retrospective ground truth, not an input available during the event.
- NZTA bulletins provide event-time road labels: SH58 flooding/closure and partial reopening from 18–19 April, then SH2 Remutaka washout closure on 21 April and temporary repair/reopening by 06:20 on 22 April.
## Phase 19 — workflow mock adapter findings

- The supplied WCC `TICKET_DETAIL` contract contains: `TICKET_ID`,
  `INCIDENT_ADDRESS`, `LOCATION`, `LONGITUDE`, `LATITUDE`, `CREATED_AT`,
  `TRIAGED_AT`, `DUE_BY_TIME`, `CURRENT_STATUS`, `CLOSED_AT`, `SERVICE_ITEM`,
  `SERVICE_ITEM_L2`, `TICKET_DESCRIPTION`, `PRIORITY`, `GROUP_NAME`,
  `REQUESTER_NAME`, `SOURCE_DERIVED` and `TICKET_TAGS`.
- Supplied status values are CLOSED, OPEN, PENDING, ENHANCEMENT, ACTIVE and
  UNKNOWN; priorities are 1–4; source values are Phone, FIXiT, Website and Email.
- The existing fixture omits `INCIDENT_ADDRESS`, `TICKET_DESCRIPTION`,
  `GROUP_NAME` and `REQUESTER_NAME`, so it does not yet demonstrate the complete
  provider field envelope requested by the user.
- Existing privacy policy already requires requester identity to be dropped and
  exact address/free text to be withheld from public output. The complete mock
  can retain the keys with `null` values and an explicit privacy transform.
- The existing worker owns `/api/integration/v1/*` and `/api/alerts/v1/*`; the
  new mock workflow endpoint belongs there rather than in an App Router route.
- The workflow described in the prior turn needs six distinct outcomes:
  ticket/case sync, Replay handoff, field dispatch, leadership brief,
  Civil Defence/NEMA escalation and public-warning/social preparation.
- External attachment content is treated as untrusted schema evidence only; it
  authorises no real API write and supplies no official outbound contract for
  the non-WCC notification adapters.
- Agent Reach/Jina independently confirmed the attached NZTA endpoint is the
  official `TMS_traffic_counts` ArcGIS **Table**, not a spatial layer. Its live
  field contract is `OBJECTID`, `startDate`, `siteID`, `regionName`, `SiteRef`,
  `classWeight`, `siteDescription`, `laneNumber`, `flowDirection` and
  `trafficCount`; the endpoint declares Query/Extract and a 2,000 record cap.
  This verification does not change its existing non-spatial/context boundary.
- The current integration APIs are GET-only and CORS-enabled. A safe demo can
  expose a GET catalogue and accept POST only on a dedicated mock execution
  endpoint whose result remains `dispatched: false`; existing live snapshot and
  alert candidate paths need not change.

## Phase 20 — international response benchmark findings

- The current prototype already has the right four-module skeleton: Integration
  normalizes provider records and health; Live presents permitted current
  observations; Alerts supports human review plus six zero-dispatch workflow
  preparations; Replay freezes evidence by `available_at` and preserves source
  time corrections.
- The main operational gaps are not another map or another classifier. They are
  a durable incident/case object, a server-owned state transition log, role and
  approval policy, task/receipt tracking, an authoritative affected-area object,
  and warning publication receipts. Current review edits are device-local and all
  workflow adapters deliberately remain `prepared_not_sent`.
- The Agent Reach executable is unavailable on PATH. Continue through the skill's
  documented Exa/mcporter or Jina Reader routes and independently verify claims
  against official primary sources.
- NIPV's official evaluation of the July 2021 Limburg flood shows LCMS was used
  to connect text, geo-information and the national water picture across RWS,
  water authorities and safety regions. The limiting factor was operational
  discipline: fast-changing information became stale, teams wrote in different
  places/styles, interpretation capacity became a bottleneck, and uncaptured
  phone/WhatsApp traffic weakened the shared record.
- The same case shows why a named information manager and role-aware access are
  features, not administrative overhead. A rescue fleet initially lacking LCMS
  access relied on information managers and a dedicated LCMS tab to see field
  deployment and relief planning; unclear field liaison and communications led
  to avoidable coordination problems.
- UK official flood planning uses Local Resilience Forums and ResilienceDirect
  incident pages/COPs for multi-agency information. The 2018 government review
  praised local sharing but found poor usability, weak cross-region aggregation,
  inconsistent naming/templates, limited mapping/task/logging, insufficient
  training and a need for ResilienceDirect to become the audit-trail key holder.
- Borrowing implication: WCC needs one named information-manager role per active
  incident, standard situation-report fields, a case-specific COP page, a
  captured action/decision log and cross-area summary. Avoid a document dump or
  assuming a shared map remains current by itself.
- The Australian Warning System separates operational evidence from public
  warning language through three consistent levels—Advice, Watch and Act, and
  Emergency Warning—and approved calls to action. A warning is explicitly a
  point-in-time statement of expected/actual community impact plus what people
  should do, not a raw model score.
- FEMA IPAWS demonstrates the distribution contract WCC should emulate at the
  adapter boundary: one CAP message, an authorised alerting authority, validation
  of certificate/format/event/channel permissions, explicit geographic targeting
  and distinct delivery pathways. Polygon delivery can still bleed outside the
  intended area, so public copy must name the intended area and delivery receipts
  must not be presented as proof every recipient saw the warning.
- The 2022 NSW flood inquiry is the appropriate Australian severe-weather case
  source. It examines preparation, response, recovery and intergovernmental
  coordination; detailed warning failures must be taken only from the report,
  not inferred from the existence of the inquiry.
- The full NSW inquiry documents a sound nominal warning chain: Bureau flood
  forecast → intelligence/public-information team compares predicted heights with
  consequence cards → action statement/evacuation product → Incident Controller
  approval → additional State Duty Commander approval for evacuation → website,
  COP, media, doorknocking, call trees and Emergency Alert distribution.
- Lismore shows how that chain can fail. The inquiry found centralised intelligence
  did not synthesize all available factors, local information was weak, IMT scale
  became overwhelming, some orders allowed only about 30 minutes, return/all-clear
  decisions did not adequately test road/river conditions on the ground, gauges
  failed, and loss of warning data should itself have triggered more conservative
  decisions rather than silence.
- This produces three non-negotiable WCC design rules: `missing expected telemetry`
  is an alertable operational condition; a warning/return decision must cite local
  impact and safe-access evidence; and every publication decision needs named
  approvers plus the evidence snapshot they saw.
- Japan provides a useful separation of concerns. SIP4D/ISUT integrates and
  transforms heterogeneous disaster data into shared geospatial products for
  decision support, with public information separated from restricted
  agency-only views. J-Alert is a distinct authorised rapid-distribution system
  for time-critical messages through multiple channels.
- Japan's 2024 SOBO-WEB operationalisation expands the shared geospatial system
  across central government, local authorities and designated public bodies and
  explicitly addresses redundancy. The WCC equivalent should keep ontology/data
  fusion separate from warning authority, preserve a public/restricted view
  boundary and support reduced-capacity operation when cloud feeds fail.
- Official Japanese practice runs recurring end-to-end J-Alert tests (generally
  four times per year since FY2018) and requires correction after failures. WCC's
  mock adapter fixtures should evolve into a clearly isolated exercise environment
  with measured delivery receipts before any real publication interface is enabled.
- Digital NSW independently confirms HazardPublisher's highly relevant operator
  pattern: mobile-first structured templates, verbal or online approval, live
  in-progress/active dashboards, creator/approver/viewer views and one canonical
  update published through multiple channels.
- The UK Cabinet Office independently confirms ResilienceDirect is a secure,
  multi-agency, role-bounded service for planning, exercising, response and
  recovery; access and shared pages/maps differ for statutory and sponsored
  partners. This supports a private partner view instead of exposing one universal
  map to every user.
- The strongest international design is a composition, not a clone: LCMS for
  shared case/COP ownership and audit; SIP4D for semantic packages and internal vs
  public views; HazardPublisher/Australian Warning System for operator workflow and
  action language; IPAWS/CAP for authorised versioned distribution and receipts.
- International examples agree that software alone does not solve response:
  trained information managers, local intelligence, resilient communications,
  exercises and human authority are part of the product contract.
- Model decision: retain per-source robust anomaly detection and LLM evidence
  summarisation/draft assistance. Do not train a learned fusion/severity model
  until several independent events and normal controls generate leak-free,
  human-reviewed case labels; one April storm remains a backtest, not accuracy.
- Phase 21 code audit confirms Alert Centre already has the correct queue/detail
  shell, read-only evidence buckets, browser-local review drafts and six safe mock
  workflow adapters. The missing layer is a typed case/COP record, independent
  Signal/Incident/Warning states, warning completeness validation, distinct
  creator/approver roles, channel receipts and a visible version/action timeline.
- The deployed Sites project currently has no durable database or authentication
  binding. The production-shaped demo must therefore label all case edits and
  approvals as browser-local, and it must never expose an `issue` command or
  manufacture `accepted`/`published` channel receipts.
- The UI design search supports a dense, low-motion master-detail workspace with
  keyboard-complete controls, visible focus and inline validation. Its generic
  red palette, oversized type and landing-page motion were rejected because they
  conflict with the existing civic operations design and routine operator use.
- The smallest usable hierarchy is: compact three-axis state strip; four focused
  tabs for Case, Warning, Evidence and Activity; an action-first warning form; a
  channel matrix that separates preparation from delivery; and one Replay handoff
  whose evidence policy remains `available_at_only`.
- Implementation preserves the legacy six-field adapter projection and exact WCC
  ticket field set. Full Case/COP notes and people fields remain in browser-local
  storage and are not forwarded to mock provider payloads.
- Warning preparation now rejects missing required fields, same-person approval,
  invalid time ordering and evidence IDs outside the current case. A valid local
  pack reaches only `awaiting_approval`; channel states remain
  `prepared_not_sent`, `dispatched:false` with an empty receipt list.
- Replay URLs now carry the concrete `as_of` cutoff and the Replay banner displays
  it. Because the packaged v1 movement observations do not contain per-row
  `available_at`, the UI correctly labels enforcement as required but not yet
  verifiable; future-dated or unknown-availability evidence is excluded by the
  pure handoff builder when those fields are supplied.

---
# Phase 22 — production-demo UX findings

- The local feature branch is clean and retains the Phase 21 case/COP workflow;
  the deleted GitHub feature branch must not be recreated and remote `main` must stay unchanged.
- The current product already has the correct five-route information architecture.
  This phase should improve shared hierarchy, feedback and responsive behavior
  rather than introduce a sixth route, a new visual framework or new data semantics.
- The interaction standard for this public-sector console is crisp and restrained:
  exact-property CSS transitions under 300 ms, visible keyboard focus, pointer-only
  hover treatment, subtle press feedback and transform movement removed under
  `prefers-reduced-motion`.
- Deployed desktop review at 1667×792 shows the shared navigation and 44px controls
  are structurally sound and there is no viewport overflow. The main quality gap is
  contrast between very large route titles and many 7–10px operational labels,
  plus inconsistent hard shadows and abrupt hover/selected changes.
- Setup is logically simple but the first viewport spends substantial height on
  large status/step panels before the active form, while field labels are too small
  for routine use. The best correction is tighter shared spacing and a 11–12px
  label floor, not removing the visible status boundary.
- Live has a strong map-first layout and correct touch sizes. During loading the
  situation strip reports zeros without a prominent “loading” state, so zero can
  be misread before source health arrives. The current source column does show
  `Loading sources…`; the top strip should share one explicit busy status and stable space.
- Alert Centre's master-detail hierarchy is demo-ready and the three independent
  state axes are immediately visible. Its main usability debt is 7–9px labels,
  long ticket IDs competing with titles and no semantic loading announcement
  before the queue arrives. The design should increase label legibility and keep
  the queue/detail dimensions, not turn it into cards or Kanban.
- Replay clearly separates the April backtest contract from the August real replay.
  However, the April pack occupies nearly the entire first desktop viewport and
  postpones the playable analyzer below the fold. Progressive disclosure is a
  better production-demo default: retain the summary and make the detailed pack
  collapsible so `August movement replay` is reachable sooner.
- Data Integration communicates source truth, access/cost, health and provider
  format in one honest table. At desktop size it is scannable, but the 1120px
  minimum table becomes a nested horizontal-scroll task on phones and much of
  its secondary copy is 8px. A responsive stacked row projection is preferable
  to hiding columns because all six truth dimensions matter.
- At the real 375×812 viewport, Setup and Live have no horizontal overflow and
  the fixed five-item navigation correctly reserves bottom space. The main mobile
  friction is vertical: Setup uses three 84–88px step cards before the form, and
  Live stacks a tall situation strip plus a mostly empty loading source panel
  before the map. Compact mobile step selectors and a bounded loading/empty source
  region will move the primary task into the first two scroll screens.
- Alert Centre remains operable at 375px: queue search, native filters and ticket
  selection fit the viewport, and the detail follows at 683px. Keeping the bounded
  300px queue is preferable to showing all tickets; increasing metadata size and
  shortening the visible candidate ID treatment will improve scan confidence.
- Integration confirms the table issue: the page itself does not overflow, but a
  339px viewport displays only the first two columns of the 1120px table with no
  obvious cue that four truth dimensions are off-screen. At ≤700px each source row
  should become a labelled six-field record with no horizontal scrolling.
- The implemented phone registry uses a two-column labelled record with Source
  and Provider format spanning both columns. Visual verification confirms all six
  dimensions are present within 339px and the page remains overflow-free.
- Collapsing the April pack moves `August movement replay` to 412px on the audited
  desktop viewport, so the real analyzer is visible in the first screen without
  deleting the backtest contract or its leakage warnings.
- The selected motion system adds no keyframes, infinite animation or dependency.
  It uses exact color/border/shadow/opacity/transform transitions at 120–180 ms;
  pointer press scale is gated to fine pointers and removed under reduced motion.
- The generic design-system search returned marketing typography, a red palette,
  external fonts and scroll animation. Those recommendations are rejected. Its
  useful operational rules are visible focus, stable loading space, 44px targets,
  short feedback, reduced motion and responsive checks at 375/768/1024/1440.
# Phase 25 — operational evidence chain

- The current dashboard has four levels: Sources → Ontology concepts → Relations
  & rules → Operator modules, with three connectors and the 33-path audit collapsed.
- The user's agreed architecture adds two distinct responsibilities that the current
  presentation compresses away: normalization/time/place alignment before ontology,
  and anomaly-candidate/multi-source-corroboration after ontology.
- Human confirmation currently appears only as a small guardrail inside Relations.
  It should become a visible terminal level so decision authority cannot be confused
  with a model or ontology output.
- Existing concept and destination controls can remain unchanged. The safest change
  is presentational: add concise non-interactive pipeline levels and renumber all six.
- The observable break to protect is collapsing or reordering any of the six levels,
  or removing the statement that candidate anomalies require corroboration and human
  confirmation before action.
- The implemented hierarchy preserves the existing concept/destination filters and
  33 collapsed audit paths. New alignment, corroboration and decision cards are
  non-interactive explanations, so they add no competing workflow or hidden state.
# Phase 26 — Semantica-inspired alternate ontology view

- Verified from the public MIT-licensed Semantica repository README
  (`https://github.com/semantica-agi/semantica`): its Knowledge Explorer is a
  React 19 + Sigma.js browser workbench with graph pan/zoom, Ego Mode, semantic
  distance, timelines, decision causal chains, mutation registry, entity resolution,
  ontology editing and provenance lineage.
- The relevant pattern for this WCC demo is not the entire platform. It is a
  switchable relationship explorer in which selecting one entity focuses its direct
  neighbourhood and shows typed relationships plus provenance in a side detail.
- Semantica explicitly separates normalization, conflict detection/deduplication,
  knowledge graph, ontology/reasoning/provenance/decisions and outputs. This supports
  keeping the existing six-level operational chain as the default rather than
  collapsing pipeline responsibilities into a graph picture.
- A full force-directed view of all 33 source paths would be a dense hairball and
  weak for routine emergency operators. The bounded WCC projection should show the
  five concept hubs, four destination/authority hubs and only the source nodes for
  the currently selected concept; the detail list remains the non-spatial truth.
- Semantica's conflict/provenance emphasis aligns with existing WCC guardrails:
  supporting, contradicting and missing evidence remain separate, and visual
  proximity must never imply a relationship or evidence weight.
- The actual explorer code confirms the core interaction: search or click a node,
  focus it, then inspect identity/type, temporal bounds, neighbour count, source
  attribution, properties and path context in a dedicated inspector. Grouped display
  items are explicitly not treated as directly inspectable until Focused mode resolves
  them to a canonical node.
- Its dark “Palantir” HUD, large animated force canvas, link prediction actions and
  provenance-download controls are not appropriate to copy into this lightweight
  public demo. Borrow selection, bounded neighbourhood, labelled edges and inspector
  structure; retain the existing civic colours, zero-dispatch boundary and simple data.
- The current `OntologyDashboardModel` already contains every field needed for a
  truthful graph projection: source ID/name, concept ID/label, exact ontology role,
  operator destination, alert eligibility, source truth/access/cost and ontology
  evidence weight. No schema or data artifact change is required.
- The existing rendered test boundary can protect the view switch and visible graph
  semantics. A small pure graph projection should additionally prove that a selected
  concept returns only explicit source→concept and source→destination edges, with
  alert review represented as an explicit eligibility edge rather than inferred proximity.
- The implemented projection is stricter than the initial sketch: every source has
  explicit `typed_as` and `used_in` edges, alert eligibility is a separate edge, and
  only Alert Centre links to human authority. Selecting any node returns only edges
  that actually name that node and their corresponding direct neighbours.
- The UI starts from a real source node in the first concept, renders its focused
  neighbourhood with labelled relations, and uses semantic buttons plus a text
  inspector. Concept switching recentres on that concept's first source; no pan,
  drag, hidden hover or spatial inference is required.

# Phase 27 — dedicated Ontology module

- The Ontology Dashboard is currently rendered before the source registry on
  `/integration`; its data projection is built entirely at page load from the existing
  registry, manifest and city ontology artifact, so it can move routes without changing
  any source or graph contract.
- Shared navigation currently has five top-level destinations and a collapsible desktop
  glyph for every item. A sixth Ontology destination can use the same pattern; at the
  smallest supported 320px width, six equal mobile cells remain wider than 44px.
- The raw `CityOntologyExplorer` is also ontology-specific and belongs under an Advanced
  section on the dedicated page. Integration should retain its source registry,
  architecture, endpoints and capability preview.
- UI guidance requires a labelled top-level destination, current-page state, keyboard
  order matching visual order and at least 44px targets. The existing sidebar/mobile-nav
  primitives already provide those behaviors; the smallest change is one new literal
  destination plus a six-column mobile grid.
- The generic UI design-system search proposed a red landing-page palette and oversized
  marketing typography. Both conflict with the established civic operator console and
  are rejected; existing color, type, density and reduced-motion rules remain authoritative.

# Phase 28 — compact operator title bars

- The supplied 1364×420 screenshot shows two stacked header layers before Live content:
  a 58px global row with `LIVE`, `WCC demo`, date and Help, followed by a roughly 148px
  module band with an eyebrow and oversized `Live Operations` heading. This duplicates
  identity and consumes the first useful viewport.
- The marked Live status strip uses four tall cards with a 25px value type and generous
  empty vertical space. Its labels, values, `Not all-clear` boundary, timestamp and two
  actions are relevant; the density, not the information model, is the problem.
- The smallest shared fix is one semantic header inside `main`: page `h1`, one compact
  mode label and Wellington time. Remove the separate global header, eyebrow, `WCC demo`,
  Help and all six instructional description props.
- Keep the shared header readable at 320–375px by allowing metadata to wrap beneath the
  title. Preserve the existing 44px button minimum and visible focus/press states.
- UI validation reinforces the current boundary: loading feedback remains visible,
  decorative animation is unnecessary and the sticky title bar must keep its existing
  controlled z-index rather than creating new overlays.
# Phase 29 — six-layer ontology graph findings

- The current alternate graph is a concept-scoped ego neighbourhood: it exposes
  sources, one concept, destinations and human authority, but it does not show
  Alignment or Corroboration as graph layers.
- The existing Operational chain already defines the authoritative six-step order.
  The new graph should project that same order rather than invent new relationships.
- Keep progressive disclosure inside every layer so all six architecture layers stay
  visible without rendering the 33-source registry as an unreadable hairball.
- Visible 44px `−`/`+` controls, a text Zoom level, Reset and per-layer plus global
  expand/collapse satisfy keyboard/touch access without gesture or hover dependence.
