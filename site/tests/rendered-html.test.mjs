import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/replay") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the movement investigation surface with truthful batch status", async () => {
  const response = await render("/replay");
  assert.equal(response.status, 200);
  const integrationResponse = await render("/integration");
  assert.equal(integrationResponse.status, 200);
  const html = `${await response.text()}\n${await integrationResponse.text()}`;

  assert.ok(html.includes("<title>Pōneke movement watch</title>"));
  assert.ok(
    html.includes(
      '<meta property="og:image" content="http://localhost:3000/og-ontology-v2.png"',
    ),
  );
  assert.match(html, /Replay Analyzer/);
  assert.match(html, /Batch replay/);
  assert.match(html, /data-investigation-switches-dataset="true"/);
  assert.match(html, /data-replay-dataset="movement"/);
  assert.match(html, /class="replay-compact-count"/);
  assert.doesNotMatch(html, /aria-label="Replay dataset summary"/);
  assert.match(html, /6 Aug 2026/);
  assert.match(html, /Evidence review/);
  assert.match(html, /Observation/);
  assert.match(html, /Inference/);
  assert.match(html, /Human decision/);
  assert.match(html, /Confirmed fact/);
  assert.match(html, /None received/);
  assert.match(html, /Mock · zero evidence/);
  assert.match(html, /high baseline/);
  assert.match(html, /33 sources registered/);
  assert.match(html, /Source capabilities/);
  assert.match(html, /REAL REPLAY/);
  assert.match(html, /MOCK · ZERO WEIGHT/);
  assert.match(html, /NEEDS PERMISSION/);
  assert.match(html, /PAID API/);
  assert.match(html, /NEMA Emergency Mobile Alert/);
  assert.match(html, /Google Routes API/);
  assert.match(html, /Google Places API/);
  assert.ok(html.includes("/cop/v1/movement-signals.geojson"));
  assert.ok(html.includes("/cop/v1/movement-health.json"));
  assert.ok(html.includes("/cop/v2/observations.geojson"));
  assert.ok(html.includes("/cop/v2/evidence-graph.json"));
  assert.ok(html.includes("/cop/v2/source-registry.json"));
  assert.match(html, /Call 111 for immediate danger/);
  assert.doesNotMatch(html, /Requester|probability/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|taking shape/i);
});

test("publishes a privacy-safe ontology replay without treating fixtures as evidence", async () => {
  const [observationsText, graphText, registryText] = await Promise.all([
    readFile(new URL("../public/cop/v2/observations.geojson", import.meta.url), "utf8"),
    readFile(new URL("../public/cop/v2/evidence-graph.json", import.meta.url), "utf8"),
    readFile(new URL("../public/cop/v2/source-registry.json", import.meta.url), "utf8"),
  ]);
  const observations = JSON.parse(observationsText);
  const graph = JSON.parse(graphText);
  const registry = JSON.parse(registryText);
  const hypothesis = graph.hypotheses[0];

  assert.equal(observations.schema, "wellington-observations/v1");
  assert.equal(graph.mode, "ontology_replay");
  assert.equal(hypothesis.epistemic_state, "inference");
  assert.equal(hypothesis.support_units, 2);
  assert.equal(hypothesis.evidence_state, "single_source_signal");
  assert.equal(graph.decision_state.status, "unreviewed");
  assert.deepEqual(graph.confirmed_facts, []);
  assert.equal(registry.sources.length, 33);
  assert.deepEqual(
    [
      "centreport-cruise-schedule",
      "geonet-tilde-wlgt",
      "nema-cap-alerts",
      "wcc-event-calendar",
      "wellington-airport-flights",
      "google-routes-api",
      "google-places-api",
    ].filter((sourceId) => !registry.sources.some((source) => source.id === sourceId)),
    [],
  );
  assert.match(observationsText, /"fixture_mode": "synthetic"/);

  const publicPayload = `${observationsText}\n${graphText}\n${registryText}`;
  assert.doesNotMatch(publicPayload, /REQUESTER_NAME|INCIDENT_ADDRESS|TICKET_DESCRIPTION|GROUP_NAME/);
  assert.doesNotMatch(publicPayload, /probability/i);
});

test("renders a city ontology explorer with explicit semantic and truth boundaries", async () => {
  const response = await render("/ontology");
  assert.equal(response.status, 200);
  const html = await response.text();
  const city = JSON.parse(
    await readFile(new URL("../public/cop/v3/city-ontology.json", import.meta.url), "utf8"),
  );

  assert.match(html, /Ontology graph/);
  assert.match(html, /Infrastructure/);
  assert.match(html, /Time window/);
  assert.match(html, /Movement state/);
  assert.match(html, /Potential impact/);
  assert.match(html, /Access state/);
  assert.match(html, /measured by/);
  assert.match(html, /located on/);
  assert.match(html, /may affect/);
  assert.match(html, /Inference only/);
  assert.match(html, /Unknown is not open/);
  assert.match(html, /2026 data layers/);
  assert.match(html, /Eventfinda events/);
  assert.match(html, /Metlink bus delays &amp; disruptions/);
  assert.match(html, /Credentials required/);
  assert.match(html, /Empty activation feed/);
  assert.match(html, /Stale · excluded/);
  assert.match(html, /weight (?:<!-- -->)?0/);
  assert.ok(html.includes("/cop/v3/city-ontology.json"));

  assert.equal(city.schema, "wellington-city-ontology/v1");
  const nodeIds = new Set(city.nodes.map((node) => node.id));
  assert.ok(city.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to)));
  assert.ok(city.edges.every((edge) => city.allowed_relation_types.includes(edge.type)));
  const access = city.nodes.find((node) => node.type === "AccessState");
  assert.equal(access.value, "unknown");
  assert.equal(city.confirmed_facts.length, 0);
  assert.equal(city.nodes.filter((node) => node.type === "DataLayer").length, 33);
});

test("renders a unified Investigation Layers workspace with selected-data replay controls", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Investigation Layers/);
  assert.match(html, /aria-label="Hide Investigation Layers"/);
  assert.match(html, /Street basemap/);
  assert.match(html, /Sensor coverage/);
  assert.match(html, /Search source layers/);
  assert.match(html, /Replay source only/);
  assert.match(html, /Clear sources/);
  assert.match(html, /\+ Add data source/);
  assert.match(html, /Map symbol size/);
  assert.match(html, /1(?:<!-- -->)? playable/);
  assert.match(html, /Real replay/);
  assert.match(html, /Replay Analyzer/);
  assert.doesNotMatch(html, /0 playable records/);
  assert.equal((html.match(/data-source-layer=/g) ?? []).length, 1);
  assert.equal((html.match(/data-playable="true"/g) ?? []).length, 1);
  assert.match(html, /data-selected="true"/);
  assert.match(html, /class="source-layer-toggle is-selected"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-label="Remove WCC Transport Sensors source layer"/);
  assert.doesNotMatch(html, /id="source-layer-wcc-transport-sensors"/);
});

test("renders a paused-only map inspection layer with a keyboard alternative", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Paused map inspection layer"/);
  assert.match(html, /Paused/);
  assert.match(html, /Inspection is off during playback/);
  assert.match(html, /The signal list remains available for keyboard inspection/);
  assert.doesNotMatch(html, /Click marker/);
  assert.doesNotMatch(html, /drag map/);
  assert.match(html, /data-map-selectable="true"/);
});

test("renders clear people and vehicle filter icons while preserving direction", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Zoom in"/);
  assert.match(html, /aria-label="Zoom out"/);
  assert.match(html, /aria-label="Reset map view"/);
  assert.match(html, /data-movement-icon="people"/);
  assert.match(html, /data-movement-icon="vehicle"/);
  assert.match(html, /Travel direction/);
  assert.match(html, /data-map-legend="floating-card"/);
});

test("offers compact Google-style map controls without a zoom slider", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Map controls"[^>]*data-max-zoom="1000%"[^>]*data-style="google-vertical"/);
  assert.match(html, /aria-label="Map zoom controls"[^>]*>[\s\S]*?aria-label="Zoom in"[\s\S]*?aria-label="Zoom out"/);
  assert.doesNotMatch(html, /aria-label="Map zoom level"/);
  assert.doesNotMatch(html, />100(?:<!-- -->)?% zoom</);
  assert.match(html, /aria-label="Reset map view"/);
  assert.match(html, /aria-label="Show map fullscreen"/);
});

test("separates Replay playback from layers and renders an operable timeline", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /data-replay-toolbar-layout="two-tier"/);
  assert.match(html, /aria-label="Playback header"/);
  assert.match(html, /aria-label="Replay filters and layers"/);
  assert.match(html, /class="replay-timeline"/);
  assert.match(html, /aria-label="Replay timeline ticks"/);
  assert.match(html, /data-replay-clustering="screen-space"/);
});

test("keeps the travel-direction legend concise", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Travel direction"/);
  assert.doesNotMatch(html, /Arrow shows travel direction/);
  assert.doesNotMatch(html, /Direction arrows show travel direction/);
});

test("keeps basemap attribution without coaching copy", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /© OpenStreetMap contributors/);
  assert.match(html, /href="https:\/\/www\.openstreetmap\.org\/copyright"/);
  assert.match(html, /OpenStreetMap contributors/);
  assert.doesNotMatch(html, /Real Wellington street basemap/);
});

test("removes routine teaching paragraphs while preserving operational states", async () => {
  const html = ["/live", "/alerts", "/replay", "/setup"]
    .map(async (path) => (await render(path)).text());
  const combined = (await Promise.all(html)).join("\n");

  assert.doesNotMatch(combined, /Connector health stays visible even when a layer is hidden/);
  assert.doesNotMatch(combined, /Visible only to demonstrate the review workflow/);
  assert.doesNotMatch(combined, /Geometry is the WCC sensor countline itself/);
  assert.doesNotMatch(combined, /Optional OpenAPI contract can be added/);
  assert.match(combined, /Mock · zero evidence/);
  assert.match(combined, /Needs server activation/);
});

test("offers historical date-hour replay and a matched-hour trend view", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Replay controls"/);
  assert.doesNotMatch(html, /History replay/);
  assert.match(html, /aria-label="Replay date"/);
  assert.match(html, /aria-label="Replay hour"/);
  assert.match(html, /aria-label="Previous replay hour"/);
  assert.match(html, /aria-label="Next replay hour"/);
  assert.match(html, /aria-label="Play replay"/);
  assert.match(html, /aria-label="Replay speed"/);
  assert.match(html, />0\.5×</);
  assert.match(html, />1×</);
  assert.match(html, />2×</);
  assert.match(html, />4×</);
  assert.match(html, /Matched-hour trend/);
  assert.match(html, /Observed count/);
  assert.match(html, /Expected baseline/);
  assert.match(html, /\/cop\/v1\/movement-replay\.json/);
});

test("renders the April storm as a leakage-safe retrospective case study", async () => {
  const response = await render("/replay");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /id="april-storm-backtest"/);
  assert.match(html, /Replay Analyzer input/);
  assert.match(html, /April Storm · movement impacts · 18–22 Apr 2026/);
  assert.match(html, /Primary · city movement/);
  assert.match(html, /2,903 movement candidates/);
  assert.match(html, /209,334 count records/);
  assert.match(html, /Supporting · weather and river/);
  assert.match(html, /18 gauges · 10,098 readings/);
  assert.match(html, /10,098/);
  assert.match(html, /12 rain gauges/);
  assert.match(html, /6 river gauges/);
  assert.match(html, /Hydro detector/);
  assert.match(html, /Investigation only/);
  assert.match(html, /Movement outcomes/);
  assert.match(html, /Retrospective only/);
  assert.match(html, /Official impact evidence/);
  assert.match(html, /Post-event · withheld/);
  assert.match(html, /event-time weight 0/);
  assert.match(html, /Train before 18 Apr/);
  assert.match(html, /5 or 15 min/);
  assert.match(html, /source_claimed_time/);
  assert.match(html, /normalized_event_time/);
  assert.match(html, /correction_note/);
  assert.match(html, /available_at/);
  assert.match(html, /Mock excluded/);
  assert.match(html, /One event cannot establish general accuracy/);
  assert.match(html, /\/cop\/v4\/april-storm-event-pack\.json/);
  assert.match(html, /\/cop\/v4\/april-storm-hilltop-observations\.json/);
  assert.match(html, /\/cop\/v4\/april-storm-hydro-detector\.json/);
  assert.match(html, /\/cop\/v4\/april-storm-movement-outcomes\.json/);
});

test("ships a machine-readable April storm pack without invented replay observations", async () => {
  const eventPack = JSON.parse(await readFile(
    new URL("../public/cop/v4/april-storm-event-pack.json", import.meta.url),
    "utf8",
  ));

  assert.equal(eventPack.schema, "wellington-backtest-event-pack/v1");
  assert.equal(eventPack.event_id, "wellington-april-storm-2026");
  assert.equal(eventPack.mode, "retrospective_case_study");
  assert.equal(eventPack.window.start_at, "2026-04-18T00:00:00+12:00");
  assert.equal(eventPack.window.end_at, "2026-04-22T23:59:59+12:00");
  assert.deepEqual(eventPack.window.replay_step_minutes, [5, 15]);
  assert.equal(eventPack.training_policy.training_data_before, "2026-04-18T00:00:00+12:00");
  assert.equal(eventPack.training_policy.meta_model_input, "out_of_fold_predictions_only");
  assert.equal(eventPack.training_policy.mock_policy, "excluded_from_training_calibration_and_scoring");
  assert.equal(eventPack.availability_policy.input_time_field, "available_at");
  assert.equal(eventPack.evaluation.general_accuracy_claim_allowed, false);
  assert.equal(eventPack.coverage.wcc_transport_countlines.reported_active, 411);
  assert.equal(eventPack.coverage.wcc_transport_countlines.total, 414);
  assert.equal(eventPack.replay_inputs.status, "packaged");
  assert.equal(eventPack.replay_inputs.observations[0].records, 10098);
  assert.deepEqual(eventPack.evidence_layers.map(({ id }) => id), [
    "movement-outcomes",
    "rainfall-observations",
    "river-flow-observations",
    "hydro-detector-candidates",
    "official-impact-ground-truth",
  ]);
  assert.equal(eventPack.evidence_layers[0].role, "retrospective_outcome_only");
  assert.equal(eventPack.evidence_layers[0].presentation_role, "primary_investigation_subject");
  assert.equal(eventPack.evidence_layers.at(-1).role, "withheld_ground_truth");
  assert.equal(eventPack.coverage.wcc_transport_countlines.window_record_count, 209334);
  assert.equal(eventPack.coverage.wcc_transport_countlines.availability_role, "retrospective_outcome_only");
  assert.ok(eventPack.time_claims.some((claim) =>
    claim.source_claimed_time.includes("24 April")
      && claim.normalized_event_time === "2026-04-20"
      && claim.correction_note,
  ));
  assert.ok(eventPack.ground_truth.every((item) => Object.hasOwn(item, "available_at")));
});

test("ships official Hilltop observations for the April replay without mock or publication-time claims", async () => {
  const pack = JSON.parse(await readFile(
    new URL("../public/cop/v4/april-storm-hilltop-observations.json", import.meta.url),
    "utf8",
  ));

  assert.equal(pack.schema, "wellington-hilltop-replay-observations/v1");
  assert.equal(pack.source_id, "gwrc-hilltop");
  assert.equal(pack.truth, "official_historical_observations");
  assert.equal(pack.record_count, 10098);
  assert.equal(pack.series_count, 18);
  assert.equal(pack.availability_policy.provider_publication_time_observed, false);
  assert.equal(pack.training_policy.mock_excluded, true);
  assert.equal(pack.series.filter((series) => series.measurement.includes("Rainfall")).length, 12);
  assert.equal(pack.series.filter((series) => series.measurement === "Flow").length, 6);
  assert.ok(pack.series.every((series) => series.record_count > 0));
  assert.equal(pack.series[0].peak.value, 77.10347);
  assert.equal(pack.series.find((series) => series.series_id === "hutt-river-taita-flow").peak.value, 474.664);
});

test("ships a cutoff-safe hydro detector pack without automatic decision authority", async () => {
  const pack = JSON.parse(await readFile(
    new URL("../public/cop/v4/april-storm-hydro-detector.json", import.meta.url),
    "utf8",
  ));

  assert.equal(pack.schema, "wellington-hydro-anomaly-candidates/v1");
  assert.equal(pack.series_count, 18);
  assert.ok(pack.candidate_count > 0);
  assert.equal(pack.model.calibration_status, "uncalibrated_case_study");
  assert.equal(pack.training_policy.movement_model_reused, false);
  assert.equal(pack.training_policy.mock_excluded, true);
  assert.equal(pack.training_policy.post_event_ground_truth_excluded, true);
  assert.ok(pack.series.every((series) => series.baseline.available_before === "2026-04-18T00:00:00+12:00"));
  assert.ok(pack.episodes.every((episode) => episode.decision_role === "investigation_only"));
  assert.ok(pack.episodes.every((episode) => episode.incident_created === false));
});

test("ships April movement-model outputs only as retrospective investigation context", async () => {
  const pack = JSON.parse(await readFile(
    new URL("../public/cop/v4/april-storm-movement-outcomes.json", import.meta.url),
    "utf8",
  ));

  assert.equal(pack.schema, "movement-replay/v1");
  assert.equal(pack.model.id, "movement-seasonal-mad-v1");
  assert.equal(pack.availability_role, "retrospective_outcome_only");
  assert.equal(pack.event_time_evidence, false);
  assert.equal(pack.automatic_incident, false);
  assert.equal(pack.slots.length, 120);
  assert.ok(pack.slots.reduce((total, slot) => total + slot.candidate_count, 0) > 0);
  const signals = pack.slots.flatMap((slot) => slot.signals);
  assert.equal(signals.length, 2903);
  assert.ok(signals.every((signal) => Array.isArray(signal.matched_history) && signal.matched_history.length > 0));
  assert.ok(signals.every((signal) => signal.signal_confidence?.history_samples === signal.matched_history.length));
  assert.ok(signals.every((signal) => signal.matched_history.every((point) => point.observed_at < signal.observed_at)));
});

test("ships internally consistent COP artifacts with WGS84 line geometry", async () => {
  const [healthText, signalsText, coverageText, replayText] = await Promise.all([
    readFile(new URL("../public/cop/v1/movement-health.json", import.meta.url), "utf8"),
    readFile(new URL("../public/cop/v1/movement-signals.geojson", import.meta.url), "utf8"),
    readFile(new URL("../public/cop/v1/countline-coverage.geojson", import.meta.url), "utf8"),
    readFile(new URL("../public/cop/v1/movement-replay.json", import.meta.url), "utf8"),
  ]);
  const health = JSON.parse(healthText);
  const signals = JSON.parse(signalsText);
  const coverage = JSON.parse(coverageText);
  const replay = JSON.parse(replayText);

  assert.equal(signals.type, "FeatureCollection");
  assert.equal(signals.features.length, health.candidate_count);
  assert.equal(health.publisher_mode, "batch replay");
  assert.equal(health.publisher_cadence, "at least monthly");
  assert.equal(health.data_gap_groups, 207);
  assert.equal(coverage.features.length, 414);
  assert.ok(
    signals.features.every(
      (feature) =>
        feature.geometry.type === "LineString" &&
        feature.geometry.coordinates.every(
          ([longitude, latitude]) => longitude > 170 && latitude < -40,
        ),
    ),
  );
  assert.deepEqual(
    [...new Set(signals.features.map((feature) => feature.properties.attribution))],
    ["Wellington City Council Transport Sensors"],
  );
  assert.equal(replay.schema, "movement-replay/v1");
  assert.equal(replay.model.id, "movement-seasonal-mad-v1");
  assert.equal(replay.input_observation_count, 284556);
  assert.equal(replay.candidate_count, 929);
  assert.equal(replay.input_role, "canonical_sensor_observations");
  assert.equal(replay.output_role, "movement_anomaly_candidates");
  assert.equal(
    replay.slots.reduce((total, slot) => total + slot.observed_groups, 0),
    replay.input_observation_count,
  );
  assert.equal(
    replay.slots.reduce((total, slot) => total + slot.candidate_count, 0),
    replay.candidate_count,
  );
  assert.ok(replay.slots.length > 1);
  assert.ok(replay.available_from < replay.available_to);
  assert.ok(
    replay.slots.every((slot) =>
      slot.signals.every((signal) =>
        signal.matched_history.every((point) => point.observed_at < signal.observed_at),
      ),
    ),
  );
});

test("removes the disposable starter preview and its dependency", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|Geist/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
