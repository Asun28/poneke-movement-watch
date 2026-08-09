import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the movement investigation surface with truthful batch status", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.ok(html.includes("<title>Pōneke movement watch</title>"));
  assert.ok(
    html.includes(
      '<meta property="og:image" content="http://localhost:3000/og-ontology-v2.png"',
    ),
  );
  assert.match(html, /Movement changes worth investigating/);
  assert.match(html, /Batch replay/);
  assert.match(html, /12 signals/);
  assert.match(html, /207 data gaps/);
  assert.match(html, /Data through/);
  assert.match(html, /6 Aug 2026/);
  assert.match(html, /From movement change to an evidence trail/);
  assert.match(html, /Observation/);
  assert.match(html, /Inference/);
  assert.match(html, /Human decision/);
  assert.match(html, /Confirmed fact/);
  assert.match(html, /None received in this replay/);
  assert.match(html, /Synthetic format fixture · no evidence weight/);
  assert.match(html, /Baseline strength/);
  assert.match(html, /24 sources registered/);
  assert.match(html, /Source capability preview/);
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
  assert.match(html, /Not live emergency information/);
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
  assert.equal(registry.sources.length, 24);
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
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  const city = JSON.parse(
    await readFile(new URL("../public/cop/v3/city-ontology.json", import.meta.url), "utf8"),
  );

  assert.match(html, /City ontology explorer/);
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
  assert.ok(html.includes("/cop/v3/city-ontology.json"));

  assert.equal(city.schema, "wellington-city-ontology/v1");
  const nodeIds = new Set(city.nodes.map((node) => node.id));
  assert.ok(city.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to)));
  assert.ok(city.edges.every((edge) => city.allowed_relation_types.includes(edge.type)));
  const access = city.nodes.find((node) => node.type === "AccessState");
  assert.equal(access.value, "unknown");
  assert.equal(city.confirmed_facts.length, 0);
});

test("renders a collapsible per-source layer workspace with selected-data replay controls", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Layer workspace/);
  assert.match(html, /aria-label="Hide layer panel"/);
  assert.match(html, /Street basemap/);
  assert.match(html, /Sensor coverage/);
  assert.match(html, /Search source layers/);
  assert.match(html, /Replay source only/);
  assert.match(html, /Clear sources/);
  assert.match(html, /Map symbol size/);
  assert.match(html, /Only selected sources with real replay records are played/);
  assert.match(html, /Real replay/);
  assert.match(html, /0 playable records/);
  assert.match(html, /Needs permission/);
  assert.match(html, /Paid API/);
  assert.equal((html.match(/data-source-layer=/g) ?? []).length, 24);
  assert.equal((html.match(/data-playable="true"/g) ?? []).length, 1);
});

test("renders zoom controls with text-only people and vehicle filters", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Zoom in"/);
  assert.match(html, /aria-label="Zoom out"/);
  assert.match(html, /aria-label="Reset map view"/);
  assert.doesNotMatch(html, /aria-label="Person signal"/);
  assert.doesNotMatch(html, /aria-label="Vehicle signal"/);
  assert.match(html, />100(?:<!-- -->)?% zoom</);
});

test("explains that map arrows show travel direction", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Travel direction"/);
  assert.match(html, /Arrow shows travel direction/);
  assert.match(html, /Direction arrows show travel direction/);
});

test("identifies the real Wellington street basemap and its attribution", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Real Wellington street basemap/);
  assert.match(html, /© OpenStreetMap contributors/);
  assert.match(html, /href="https:\/\/www\.openstreetmap\.org\/copyright"/);
  assert.match(html, /Sensor overlay remains available if map tiles cannot load/);
});

test("offers historical date-hour replay and a matched-hour trend view", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /History replay/);
  assert.match(html, /aria-label="Replay date"/);
  assert.match(html, /aria-label="Replay hour"/);
  assert.match(html, /aria-label="Previous replay hour"/);
  assert.match(html, /aria-label="Next replay hour"/);
  assert.match(html, /aria-label="Play replay"/);
  assert.match(html, /Matched-hour trend/);
  assert.match(html, /Observed count/);
  assert.match(html, /Expected baseline/);
  assert.match(html, /\/cop\/v1\/movement-replay\.json/);
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
