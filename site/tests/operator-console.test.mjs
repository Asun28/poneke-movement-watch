import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("operator-test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

function request(pathname, init) {
  return worker.fetch(new Request(`http://localhost${pathname}`, init), env, ctx);
}

test("opens the operator console in the operator dashboard", async () => {
  const response = await request("/");
  assert.ok([307, 308].includes(response.status));
  assert.equal(response.headers.get("location"), "/dashboard");
});

test("publishes one integration contract for all registered providers", async () => {
  const response = await request("/api/integration/v1/contracts");
  assert.equal(response.status, 200);
  const payload = await response.json();

  assert.equal(payload.schema, "wellington-integration-contracts/v1");
  assert.equal(payload.sources.length, 33);
  assert.ok(payload.runtime_states.includes("credentials_required"));
  assert.equal(
    payload.sources.find((source) => source.source_id === "google-routes-api").connector_mode,
    "mock",
  );
  assert.equal(
    payload.sources.find((source) => source.source_id === "wcc-transport-sensors").connector_mode,
    "batch",
  );
});

test("exposes the dashboard and six specialist modules with shared navigation", async () => {
  const expectations = [
    ["/dashboard", /Dashboard/, /Current picture/],
    ["/live", /Live Operations/, /Current feeds/],
    ["/alerts", /Signal Review/, /Review queue/],
    ["/replay", /Replay Analyzer/, /aria-label="Replay controls"/],
    ["/integration", /Data Integration/, /33 source contracts/],
    ["/ontology", /City Ontology/, /data-ontology-view="chain"/],
    ["/setup", /Easy setup/, /Add data source/],
  ];

  for (const [path, heading, content] of expectations) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, heading, path);
    assert.match(html, content, path);
    assert.match(html, /Dashboard/, path);
    assert.match(html, /Live Operations/, path);
    assert.match(html, /Signal Review/, path);
    assert.match(html, /Replay Analyzer/, path);
    assert.match(html, /Data Integration/, path);
    assert.match(html, /Ontology/, path);
    assert.match(html, /Setup/, path);
  }
});

test("renders a first-login dashboard that routes staff to the next operational action", async () => {
  const response = await request("/dashboard");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /data-operator-dashboard="current-picture"/);
  assert.match(html, /Current picture/);
  assert.match(html, /Needs attention/);
  assert.match(html, /Source health/);
  assert.match(html, /Recent investigations/);
  assert.match(html, /Open Signal Review/);
  assert.match(html, /Open Live map/);
  assert.match(html, /April Storm/);
  assert.match(html, /August movement review/);
  assert.match(html, /Checking current operations/);
  assert.match(html, /Not an all-clear/);
  assert.doesNotMatch(html, /AI agent|Ask anything|Latest from our changelog/);
});

test("keeps five core destinations in the mobile operator navigation", async () => {
  const html = await (await request("/dashboard")).text();
  const mobile = html.match(/<nav class="operator-mobile-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";

  assert.equal((mobile.match(/<a /g) ?? []).length, 5);
  assert.match(mobile, />Dashboard</);
  assert.match(mobile, />Live</);
  assert.match(mobile, />Review</);
  assert.match(mobile, />Replay</);
  assert.match(mobile, />Setup</);
  assert.doesNotMatch(mobile, />Integrate|>Ontology/);
});

test("keeps the ontology dashboard on one dedicated top-level page", async () => {
  const ontologyResponse = await request("/ontology");
  const integrationResponse = await request("/integration");
  assert.equal(ontologyResponse.status, 200);
  assert.equal(integrationResponse.status, 200);

  const ontology = await ontologyResponse.text();
  const integration = await integrationResponse.text();
  assert.match(ontology, /href="\/ontology" aria-current="page"/);
  assert.match(ontology, /data-ontology-view="chain"/);
  assert.match(ontology, /data-deferred-view="ontology-fusion"/);
  assert.doesNotMatch(ontology, /data-ontology-view="graph"/);
  assert.doesNotMatch(integration, /City ontology explorer/);
  assert.match(integration, /33 source contracts/);
});

test("keeps every operator route task-first without tutorial copy", async () => {
  const pages = ["/dashboard", "/live", "/alerts", "/replay", "/integration", "/ontology", "/setup"];
  const html = (await Promise.all(pages.map(async (path) => (await request(path)).text()))).join("\n");

  assert.doesNotMatch(html, /class="eyebrow"/);
  for (const phrase of [
    "See where each source fits",
    "Use + to open second-level detail",
    "Operational chain remains the default",
    "Make unlike records comparable",
    "Compare the same time and place",
    "Use the same evidence chain",
    "Staff decide whether to investigate",
    "Action-first local draft",
    "Click for details",
    "drag to move",
    "Scroll or use slider",
    "Click marker · drag map",
    "Arrow shows travel direction",
  ]) assert.doesNotMatch(html, new RegExp(phrase.replace(/[+]/g, "\\+")), phrase);

  assert.match(html, /Not all-clear/);
  assert.match(html, /Mock · zero evidence/);
  assert.match(html, /Needs server activation/);
  assert.match(html, /Call 111 for immediate danger/);
});

test("uses concise production workflows across review, integration, ontology and setup", async () => {
  const review = await (await request("/alerts")).text();
  const integration = await (await request("/integration")).text();
  const ontology = await (await request("/ontology")).text();
  const setup = await (await request("/setup")).text();

  assert.match(review, /data-operator-workflow="signal-master-detail"/);
  assert.match(review, /data-review-surface="queue"/);
  assert.match(review, /data-review-surface="evidence-workspace"/);
  assert.match(review, /role="tab" aria-selected="true"[^>]*>Evidence<\/button>/);

  assert.match(integration, /data-operator-workflow="source-master-detail"/);
  assert.match(integration, /aria-label="Source list"/);
  assert.match(integration, /aria-label="Selected source details"/);
  assert.equal((integration.match(/data-source-list-item=/g) ?? []).length, 33);

  assert.match(ontology, /data-operator-workflow="ontology-step-inspector"/);
  assert.match(ontology, /aria-label="Six ontology steps"/);
  assert.equal((ontology.match(/data-ontology-step=/g) ?? []).length, 6);
  assert.match(ontology, /data-ontology-step-panel="sources"/);

  assert.match(setup, /data-operator-workflow="guided-setup"/);
  assert.match(setup, /data-setup-progress="0\/3"/);
  assert.match(setup, />Save and continue<\/button>/);
  assert.doesNotMatch(setup, /class="setup-boundary"/);
});

test("announces live and alert loading without presenting provisional zeroes", async () => {
  const live = await (await request("/live")).text();
  const alerts = await (await request("/alerts")).text();

  assert.match(live, /aria-busy="true"/);
  assert.match(live, /Loading current feeds/);
  assert.doesNotMatch(live, /<span>Connected<\/span><strong>0<\/strong>/);
  assert.match(alerts, /aria-label="Signal review queue"[^>]*aria-busy="true"/);
  assert.match(alerts, /Loading review queue/);
});

test("offers short safe setup paths for sources, API, MCP and A2A", async () => {
  const response = await request("/setup");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Add data source/);
  assert.match(html, /Connect a system/);
  assert.match(html, /Operations settings/);
  assert.match(html, />REST API</);
  assert.match(html, />MCP</);
  assert.match(html, />A2A</);
  assert.match(html, /Source name/);
  assert.match(html, /aria-label="Map icon"/);
  assert.match(html, /Auto by data type/);
  assert.match(html, /Upload PNG or WebP/);
  assert.match(html, /Use in/);
  assert.match(html, /name="operationsTarget"/);
  assert.match(html, />Live Operations</);
  assert.match(html, />Replay Analyzer</);
  assert.match(html, />Integration only</);
  assert.match(html, /Secret reference/);
  assert.equal((html.match(/No secrets stored/g) ?? []).length, 1);
  assert.match(html, /Needs server activation/);
  assert.match(html, /Browser draft/);
  assert.doesNotMatch(html, /Saved on this browser/);
});

test("keeps replay controls out of the live module and preserves them in replay", async () => {
  const live = await (await request("/live")).text();
  const replay = await (await request("/replay")).text();

  assert.doesNotMatch(live, /aria-label="Replay speed"/);
  assert.match(live, /No current records/);
  assert.match(replay, /aria-label="Replay speed"/);
  assert.match(replay, /Batch replay/);
});

test("opens Replay as a map-first workspace with secondary panels collapsed", async () => {
  const replay = await (await request("/replay")).text();
  const mapAt = replay.indexOf('data-replay-map-first="true"');
  const playbackAt = replay.indexOf('aria-label="Replay controls"');
  const selectorAt = replay.indexOf('aria-label="Replay investigations"');

  assert.ok(mapAt > -1);
  assert.ok(playbackAt > mapAt);
  assert.ok(selectorAt > playbackAt);
  assert.match(replay, /data-replay-command-bar="unified"/);
  assert.match(replay, /class="replay-investigation-selector is-collapsed"[^>]*aria-label="Replay investigations"/);
  assert.match(replay, /aria-expanded="false" aria-label="Show investigation settings"/);
  assert.match(replay, /aria-expanded="false" aria-label="Show Investigation Layers"/);
  assert.match(replay, /aria-expanded="false" aria-label="Show signal evidence"/);
  assert.match(replay, /class="replay-layer-overlay" hidden=""/);
  assert.match(replay, /aria-label="Investigation Layers"/);
  assert.match(replay, />Investigation Layers</);
  assert.match(replay, /class="replay-map-evidence-overlay adaptive-evidence-drawer evidence-column"[^>]*data-adaptive-evidence="drawer"[^>]*hidden=""[^>]*aria-label="Signal evidence"/);
  assert.match(replay, /data-replay-dataset="movement"/);
  assert.match(replay, /aria-label="Map zoom controls"/);
});

test("keeps the desktop navigation collapse control icon-only", async () => {
  const replay = await (await request("/replay")).text();

  assert.match(replay, /class="operator-nav-toggle"[^>]*data-icon-only="true"/);
  assert.match(replay, /aria-label="Collapse navigation"/);
  assert.doesNotMatch(replay, />Hide menu</);
});

test("opens Live as one map-first workspace with readable evidence overlays", async () => {
  const live = await (await request("/live")).text();
  const review = await (await request("/alerts")).text();

  assert.match(live, /aria-label="Unified Live map workspace"/);
  assert.match(live, /data-live-map-first="true"/);
  assert.doesNotMatch(live, /aria-label="Live Operations views"/);
  assert.match(live, /class="live-map-inbox-overlay is-collapsed"[^>]*aria-label="Evidence Inbox overlay"/);
  assert.match(live, /aria-expanded="false" aria-label="Show Evidence Inbox"/);
  assert.match(live, /data-inbox-summary="review-held">Review — · Held —<\/span>/);
  assert.match(live, /aria-label="Live map overlays"/);
  assert.match(live, /class="live-mobile-filter-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="live-map-overlay-filters"[^>]*aria-label="Show map filters"/);
  assert.match(live, /class="live-mobile-inbox-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="live-evidence-inbox"[^>]*aria-label="Show Evidence Inbox"/);
  assert.match(live, /id="live-map-overlay-filters" class="live-map-overlay-bar"[^>]*data-live-filter-layout="wrapped"/);
  assert.match(live, /data-live-layer-toggle="review-evidence"/);
  assert.match(live, /data-live-layer-toggle="sensors-weather"/);
  assert.match(live, /data-live-layer-toggle="warnings-hazards"/);
  assert.match(live, /data-live-layer-toggle="access-impacts"/);
  assert.match(live, /data-live-layer-toggle="reports"/);
  assert.match(live, /data-live-layer-toggle="other-live"/);
  assert.match(live, /aria-label="Live map layers"/);
  assert.match(live, /Current feeds/);
  assert.match(live, /aria-label="City context overlay"/);
  assert.doesNotMatch(live, /aria-label="Selected evidence details"/);
  assert.doesNotMatch(live, /Select a symbol for details/);
  assert.match(live, /Search current evidence/);
  assert.match(live, /City events/);
  assert.match(live, /Flights in &amp; out/);
  assert.match(live, /Cruise calls/);
  assert.match(live, /data-event-symbol="city-event"/);
  assert.match(live, /data-event-symbol="flight"/);
  assert.match(live, /data-event-symbol="cruise"/);
  assert.match(live, /data-event-symbol="rain"/);
  assert.match(live, /data-event-symbol="warning"/);
  assert.match(live, /data-event-symbol="road"/);
  assert.match(live, /data-event-symbol="report"/);
  assert.match(live, /Mock · zero evidence/);
  assert.match(live, /class="live-inbox-truth">Checking candidates…<\/span>/);
  assert.match(live, /aria-label="Map controls"[^>]*data-max-zoom="2000%"[^>]*data-style="google-vertical"[^>]*data-corner="bottom-right"/);
  assert.match(live, /aria-label="Map zoom controls"[^>]*>[\s\S]*?aria-label="Zoom in"[\s\S]*?aria-label="Zoom out"/);
  assert.match(live, /role="application"[^>]*tabindex="0"[^>]*aria-label="Interactive evidence map"[^>]*aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter Escape"/i);
  assert.match(live, /data-wheel-zoom="modifier-required"/);
  assert.match(live, /aria-label="Map evidence markers"/);
  assert.doesNotMatch(live, /aria-label="Map zoom level"/);
  assert.doesNotMatch(live, /aria-label="Reset map view"/);
  assert.match(live, /class="ops-map-fullscreen"[^>]*aria-label="Show map fullscreen"/);
  assert.doesNotMatch(live, /class="ops-map-status"/);
  assert.match(live, /class="ops-map-attribution"[^>]*data-corner="bottom-left"[^>]*>[\s\S]*?© OpenStreetMap contributors[\s\S]*?© CARTO/);
  assert.match(live, /data-nav-icon="activity"/);
  assert.match(live, /data-nav-icon="inbox"/);
  assert.match(live, /data-nav-icon="settings"/);
  assert.doesNotMatch(live, /<span aria-hidden="true">!<\/span>Review/);
  assert.doesNotMatch(live, /<span aria-hidden="true">\+<\/span>Setup/);

  assert.ok(review.indexOf(">Evidence<") < review.indexOf("Case &amp; COP"));
  assert.doesNotMatch(review, /Live signal · unreviewed/);
});

test("routes backtest events to Replay Analyzer instead of Live Operations", async () => {
  const live = await (await request("/live")).text();
  const replay = await (await request("/replay")).text();
  const workspace = readFileSync(new URL("../app/components/ReplayWorkspaceClient.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(live, /April Storm backtest/);
  assert.doesNotMatch(live, /回测/);
  assert.doesNotMatch(replay, /id="april-storm-backtest"/);
  assert.match(workspace, /active\.id === "wellington-april-storm-2026"/);
  assert.match(workspace, /<AprilBacktestDetails/);
  assert.doesNotMatch(replay, /回测/);
  assert.match(replay, /Case handoff/);
  assert.match(replay, /available_at-only policy required in v1/);
});

test("keeps the April backtest detail collapsed after the map-first replay", async () => {
  const replay = await (await request("/replay")).text();
  const details = readFileSync(new URL("../app/components/AprilBacktestDetails.tsx", import.meta.url), "utf8");

  assert.match(replay, /data-replay-map-first="true"/);
  assert.doesNotMatch(replay, /id="april-storm-backtest"/);
  assert.match(details, /<details id="april-storm-backtest" className="backtest-pack">/);
  assert.doesNotMatch(details, /<details id="april-storm-backtest" className="backtest-pack" open/);
  assert.match(details, /<summary className="backtest-header">/);
});

test("lets an operator select April Storm or create a local Replay investigation", async () => {
  const replay = await (await request("/replay")).text();
  const selectorAt = replay.indexOf('aria-label="Replay investigations"');
  const mapAt = replay.indexOf('data-replay-map-first="true"');
  const commandBarAt = replay.indexOf('data-replay-command-bar="unified"');

  assert.ok(selectorAt > -1);
  assert.ok(commandBarAt > mapAt);
  assert.ok(selectorAt > commandBarAt);
  assert.match(replay, /aria-expanded="false" aria-label="Show investigation settings"/);
  assert.match(replay, /<label[^>]*>.*Investigation/s);
  assert.match(replay, /name="investigation"/);
  assert.match(replay, /April Storm · movement impacts · 18–22 Apr 2026/);
  assert.match(replay, /2,903 movement candidates/);
  assert.match(replay, /August movement review · 1–6 Aug 2026/);
  assert.match(replay, /929 model candidates/);
  assert.doesNotMatch(replay, />Open investigation</);
  assert.match(replay, />New investigation</);
  assert.match(replay, /aria-label="New Replay investigation"/);
  assert.match(replay, />Title</);
  assert.match(replay, />Start</);
  assert.match(replay, />Replay cutoff</);
  assert.match(replay, />Primary source</);
  assert.match(replay, />Create &amp; open</);
  assert.match(replay, /Local draft · not Incident\/COP/);
});

test("switches Replay datasets immediately and keeps playback in one compact control bar", async () => {
  const replay = await (await request("/replay")).text();

  assert.match(replay, /data-investigation-switches-dataset="true"/);
  assert.match(replay, /data-replay-command-bar="unified"/);
  assert.match(replay, /aria-label="Replay controls"/);
  assert.doesNotMatch(replay, /class="replay-compact-identity"/);
  assert.doesNotMatch(replay, /aria-label="History replay controls"/);
  assert.doesNotMatch(replay, />Open investigation</);
  assert.doesNotMatch(replay, /Paused · hover markers/);
  assert.equal((replay.match(/aria-label="Replay controls"/g) ?? []).length, 1);
});

test("renders truth, access and runtime health as separate integration dimensions", async () => {
  const response = await request("/integration");
  const html = await response.text();

  assert.match(html, /Source truth/);
  assert.match(html, /Access &amp; cost/);
  assert.match(html, /Runtime health/);
  assert.match(html, /Provider format/);
  assert.match(html, /Used in/);
  assert.match(html, /Filter by operator module/);
  assert.match(html, /Live Operations source/);
  assert.match(html, /Replay Analyzer source/);
  assert.match(html, /Integration only/);
  assert.match(html, /Mock · zero evidence weight/);
  assert.match(html, /Google Routes API/);
  assert.match(html, /NEMA Emergency Mobile Alert/);
  assert.match(html, /\/api\/integration\/v1\/workflow-adapters/);
  assert.match(html, /href="\/setup"/);
  assert.match(html, /Add source/);
});

test("shows the six-level operational evidence chain before advanced technical detail", async () => {
  const html = await (await request("/ontology")).text();
  const dashboardAt = html.indexOf('aria-label="Ontology workspace"');
  const advancedAt = html.indexOf('<details class="operator-advanced">');
  const sourcesAt = html.indexOf('data-ontology-level="sources"');
  const alignmentAt = html.indexOf('data-ontology-level="alignment"');
  const conceptsAt = html.indexOf('data-ontology-level="concepts"');
  const corroborationAt = html.indexOf('data-ontology-level="corroboration"');
  const destinationsAt = html.indexOf('data-ontology-level="destinations"');
  const decisionAt = html.indexOf('data-ontology-level="decision"');
  const pathwaysAt = html.indexOf('<details class="ontology-pathways"');

  assert.ok(dashboardAt > -1);
  assert.ok(advancedAt > dashboardAt);
  assert.ok(sourcesAt > dashboardAt);
  assert.ok(sourcesAt < alignmentAt);
  assert.ok(alignmentAt < conceptsAt);
  assert.ok(conceptsAt < corroborationAt);
  assert.ok(corroborationAt < destinationsAt);
  assert.ok(destinationsAt < decisionAt);
  assert.ok(decisionAt < pathwaysAt);
  assert.ok(pathwaysAt < advancedAt);
  assert.equal((html.match(/data-hierarchy-connector=/g) ?? []).length, 5);
  assert.doesNotMatch(html, /<details class="ontology-pathways" open/);
  assert.match(html, /Data sources &amp; access/);
  assert.match(html, /Normalize, align time &amp; place/);
  assert.match(html, /Ontology entities, relations &amp; evidence rules/);
  assert.match(html, /Anomaly candidates &amp; corroboration/);
  assert.match(html, /Live · Signal Review · Replay/);
  assert.match(html, /Human confirmation &amp; response/);
  assert.match(html, /Candidate · not incident/);
  assert.match(html, /Human approval required/);
  assert.match(html, /data-deferred-content="source-paths"/);
  assert.match(html, /Source paths/);
  assert.doesNotMatch(html, /aria-label="Filter ontology pathways by concept"/);
  assert.doesNotMatch(html, /aria-label="Filter ontology pathways by operator module"/);
  assert.equal((html.match(/data-ontology-path=/g) ?? []).length, 0);
  assert.match(html, /Movement &amp; transport/);
  assert.match(html, /Hazards &amp; warnings/);
  assert.match(html, /Access &amp; incidents/);
  assert.match(html, /Lifelines &amp; response/);
  assert.match(html, /People &amp; demand/);
  assert.match(html, /Real replay/);
  assert.doesNotMatch(html, /Mock · zero weight/);
  assert.match(html, /permission required/);
  assert.match(html, /Paid · mock only/);
  assert.match(html, /Unknown is not open/);
});

test("offers an expandable ontology-aware fusion architecture without replacing the operational chain", async () => {
  const html = await (await request("/ontology")).text();

  assert.match(html, /aria-label="Choose ontology view"/);
  assert.match(html, /aria-pressed="true">Operational chain/);
  assert.match(html, /aria-pressed="false"[^>]*aria-controls="ontology-fusion-region"[^>]*data-deferred-view="ontology-fusion">Fusion architecture/);
  assert.match(html, /data-ontology-view="chain"/);
  assert.doesNotMatch(html, /data-ontology-view="graph"/);
  assert.doesNotMatch(html, /id="ontology-fusion-region"/);
  assert.doesNotMatch(html, /data-ontology-fusion="late-fusion"/);
  assert.doesNotMatch(html, /data-fusion-stage=/);
  assert.doesNotMatch(html, /aria-label="Six-layer fusion architecture controls"/);
  assert.doesNotMatch(html, /Change timeline/);
  assert.doesNotMatch(html, /data-knowledge-timeline=/);
  assert.doesNotMatch(html, /data-timeline-entry=/);
  assert.doesNotMatch(html, /data-timeline-change=/);
  assert.doesNotMatch(html, /Operational chain remains the default/);
});

test("keeps every source reachable while showing one phone-sized source detail", async () => {
  const html = await (await request("/integration")).text();
  const labels = ["Used in", "Ontology role", "Source truth", "Access &amp; cost", "Runtime health", "Provider format"];

  for (const label of labels) assert.match(html, new RegExp(`data-detail-label="${label}"`), label);
  assert.equal((html.match(/data-source-list-item=/g) ?? []).length, 33);
  assert.doesNotMatch(html, /class="integration-table"/);
});

test("provides a friendly Replay investigation source workspace", async () => {
  const html = await (await request("/replay")).text();

  assert.match(html, /Investigation sources/);
  assert.match(html, /aria-label="Filter investigation sources by module"/);
  assert.match(html, /value="replay_analyzer" selected=""/);
  assert.match(html, /Replay Analyzer/);
  assert.match(html, /Live Operations/);
  assert.match(html, /Signal Review/);
  assert.match(html, /Add source/);
  assert.match(html, /Source name/);
  assert.match(html, /Source ID/);
  assert.match(html, /Endpoint/);
  assert.match(html, /Data status/);
  assert.match(html, /Access/);
  assert.match(html, /Use in/);
  assert.match(html, /aria-label="Map icon"/);
  assert.match(html, /Upload PNG or WebP/);
  assert.match(html, /aria-label="Edit WCC Transport Sensors"/);
  assert.match(html, /Registry/);
  assert.match(html, /This browser only/);
});

test("makes model authority and mock alert exclusion explicit", async () => {
  const response = await request("/alerts");
  const html = await response.text();

  assert.match(html, /Decision authority/);
  assert.match(html, /Human approval required/);
  assert.match(html, /Mock · zero evidence/);
  assert.match(html, /Supporting/);
  assert.match(html, /Contradicting/);
  assert.match(html, /Missing/);
  assert.match(html, /Context/);
});

test("provides a focused editable review ticket without changing system truth", async () => {
  const response = await request("/alerts");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Signal review queue"/);
  assert.match(html, /Search signals/);
  assert.match(html, /aria-label="Review queue"/);
  assert.match(html, /Review status/);
  assert.match(html, /Assigned to/);
  assert.match(html, /Review note/);
  assert.match(html, /Save local draft/);
  assert.match(html, /This browser only/);
  assert.match(html, /System severity/);
  assert.match(html, /Observed/);
  assert.doesNotMatch(html, /name="severity"/);
});

test("lays out each signal as a compact investigation with a dedicated details rail", async () => {
  const response = await request("/alerts");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Investigation content"/);
  assert.match(html, /aria-label="Signal details"/);
  assert.match(html, /aria-label="Signal details fields"/);
  assert.match(html, /Affected area/);
  assert.match(html, /Update details/);
  assert.match(html, /name="review-status"/);
  assert.match(html, /name="assignee"/);
  assert.doesNotMatch(html, /name="system-severity"/);
});

test("offers Signal Review queues and governed human outcome feedback", async () => {
  const response = await request("/alerts");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Signal Review/);
  assert.match(html, /aria-label="Review queue"/);
  assert.match(html, /data-default-queue="new"/);
  for (const queue of ["New", "Active", "Closed", "History", "All"]) {
    assert.match(html, new RegExp(`>${queue}(?: · [^<]+)?<`), queue);
  }
  assert.match(html, /aria-label="Signal review workflow"/);
  assert.match(html, /Signal[\s\S]*Candidate[\s\S]*Investigate[\s\S]*Outcome/);
  assert.match(html, /name="classification"/);
  for (const outcome of ["True Positive", "Benign Positive", "False Positive", "Undetermined"]) {
    assert.match(html, new RegExp(outcome), outcome);
  }
  assert.match(html, /Meaning/);
  assert.match(html, /Next step/);
  assert.match(html, /Not trained automatically/);
});

test("keeps Signal Review queue state, workflow and evidence presentation coherent", async () => {
  const html = await (await request("/alerts")).text();

  assert.match(html, /data-visible-review-count="1"/);
  assert.match(html, /data-queue-count-new="1"/);
  assert.doesNotMatch(html, /No current candidates/);
  assert.match(html, /data-step-state="complete"/);
  assert.match(html, /aria-hidden="true">✓</);
  assert.match(html, /data-step-state="current"/);
  assert.match(html, /data-step-state="future"/);
  assert.match(html, /data-evidence-empty="true"/);
  assert.match(html, /class="alert-detail-form alert-staff-fields"/);
});

test("renders a local case COP and warning-preparation workspace", async () => {
  const html = await (await request("/alerts")).text();

  for (const label of [
    "Signal", "Incident", "Warning", "Case &amp; COP", "Information manager",
    "Next review", "Affected area", "Situation", "Confirmed", "Unknown",
    "Current actions", "Warning preparation", "Hazard", "Warning level",
    "Public action", "Effective", "Expires", "Next update", "Evidence links",
    "Creator", "Approver", "Channel status", "Activity",
  ]) assert.match(html, new RegExp(label), label);

  assert.match(html, /Unconfirmed/);
  assert.match(html, /This browser only|Browser-local demo/);
  assert.match(html, /aria-label="Mock workflow actions; no external delivery"/);
  assert.match(html, /prepared_not_sent/);
  assert.match(html, /available_at[_-]only/);
});

test("provides the complete mock investigation workflow without sending externally", async () => {
  const html = await (await request("/alerts")).text();
  assert.match(html, /Handoffs/);
  assert.match(html, /Mock · not sent/);
  assert.match(html, /aria-label="Mock workflow actions; no external delivery"/);
  assert.match(html, />WCC ticket</);
  assert.match(html, />Replay Analyzer handoff</);
  assert.match(html, />WCC field dispatch</);
  assert.match(html, />Leadership notification</);
  assert.match(html, />Civil Defence .* NEMA escalation</);
  assert.match(html, />Public warning .* social media</);
  assert.match(html, /Prepare mock/);
});

test("serves provider-shaped workflow mocks and never reports a dispatch", async () => {
  const catalogueResponse = await request("/api/integration/v1/workflow-adapters");
  assert.equal(catalogueResponse.status, 200);
  const catalogue = await catalogueResponse.json();
  assert.deepEqual(catalogue.adapters.map((adapter) => adapter.id), [
    "wcc-ticket",
    "replay-case-handoff",
    "wcc-field-dispatch",
    "wcc-leadership-notification",
    "civil-defence-nema-escalation",
    "public-warning-social",
  ]);

  let wccTicket;
  let publicWarning;
  for (const adapter of catalogue.adapters) {
    const resultResponse = await request("/api/integration/v1/workflow-adapters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adapter_id: adapter.id,
        case: {
          case_id: "candidate:test:1",
          title: "Movement change needs investigation",
          severity: "high",
          source_id: "wcc-transport-sensors",
          observed_at: "2026-08-10T01:00:00.000Z",
          affected_area: "Berhampore",
        },
      }),
    });
    assert.equal(resultResponse.status, 200, adapter.id);
    const result = await resultResponse.json();
    assert.equal(result.adapter_id, adapter.id);
    assert.equal(result.mode, "mock");
    assert.equal(result.is_synthetic, true);
    assert.equal(result.dispatched, false);
    assert.equal(result.evidence_weight, 0);
    assert.equal(result.status, "prepared_not_sent");
    if (adapter.id === "wcc-ticket") wccTicket = result;
    if (adapter.id === "public-warning-social") publicWarning = result;
  }

  assert.deepEqual(Object.keys(wccTicket.provider_payload).sort(), [
    "CLOSED_AT", "CREATED_AT", "CURRENT_STATUS", "DUE_BY_TIME", "GROUP_NAME",
    "INCIDENT_ADDRESS", "LATITUDE", "LOCATION", "LONGITUDE", "PRIORITY",
    "REQUESTER_NAME", "SERVICE_ITEM", "SERVICE_ITEM_L2", "SOURCE_DERIVED",
    "TICKET_DESCRIPTION", "TICKET_ID", "TICKET_TAGS", "TRIAGED_AT",
  ].sort());
  assert.equal(wccTicket.provider_payload.CURRENT_STATUS, "OPEN");
  assert.equal(wccTicket.provider_payload.PRIORITY, 1);
  assert.equal(wccTicket.provider_payload.SOURCE_DERIVED, "Website");
  assert.deepEqual(wccTicket.provider_payload.TICKET_TAGS, ["Weather Event", "Berhampore", "escalation"]);
  assert.equal(wccTicket.provider_payload.REQUESTER_NAME, null);
  assert.equal(wccTicket.provider_payload.INCIDENT_ADDRESS, null);
  assert.equal(wccTicket.provider_payload.TICKET_DESCRIPTION, null);
  assert.equal(wccTicket.provider_payload.LOCATION, "Berhampore");
  assert.equal(wccTicket.privacy.requester_name, "removed");

  const severeTicketResponse = await request("/api/integration/v1/workflow-adapters", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      adapter_id: "wcc-ticket",
      case: { case_id: "candidate:severe:1", severity: "severe", affected_area: "Wellington" },
    }),
  });
  assert.equal((await severeTicketResponse.json()).provider_payload.PRIORITY, 1);
  assert.deepEqual(publicWarning.delivery_receipts, []);
  assert.ok(publicWarning.provider_payload.channel_preparations.every((channel) => channel.status === "prepared_not_sent"));
  assert.doesNotMatch(JSON.stringify(publicWarning), /"status":"(accepted|failed|published)"/);

  const invalidResponse = await request("/api/integration/v1/workflow-adapters", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      adapter_id: "send-everywhere",
      case: {
        case_id: "candidate:test:1",
      },
    }),
  });
  assert.equal(invalidResponse.status, 400);
  assert.deepEqual(await invalidResponse.json(), { error: "unknown_workflow_adapter" });
});

test("uses one compact title and status bar on every operator page", async () => {
  const pages = [
    ["/dashboard", "Dashboard", "Current picture"],
    ["/live", "Live Operations", "Live"],
    ["/alerts", "Signal Review", "Triage queue"],
    ["/replay", "Replay Analyzer", "Batch replay"],
    ["/integration", "Data Integration", "33 registered sources"],
    ["/ontology", "City Ontology", "33 ontology paths"],
    ["/setup", "Easy setup", "Draft"],
  ];

  for (const [path, title, mode] of pages) {
    const html = await (await request(path)).text();
    const titleBar = html.match(/<header class="operator-title-bar" aria-label="Page title and status">([\s\S]*?)<\/header>/)?.[1] ?? "";

    assert.match(titleBar, new RegExp(`<h1>${title}<\\/h1>`), path);
    assert.match(titleBar, new RegExp(`<span class="operator-mode-label">${mode}<\\/span>`), path);
    assert.match(titleBar, /<time>Wellington time(?:<!-- -->)? NZST<\/time>/, path);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1, path);
    assert.doesNotMatch(html, /operator-global-header|operator-module-heading|operator-help/, path);
    assert.doesNotMatch(html, /WCC demo/, path);
    assert.doesNotMatch(html, /Emergency information prototype/, path);
    assert.doesNotMatch(html, /Every candidate remains an inference/, path);
  }
});

test("keeps the compact Live status bar operationally complete", async () => {
  const html = await (await request("/live")).text();
  const component = readFileSync(new URL("../app/components/LiveOperationsClient.tsx", import.meta.url), "utf8");
  const status = html.match(/<div class="live-situation-strip" aria-label="Live source status">([\s\S]*?)<\/div>\s*<section class="live-map-workspace"/)?.[1] ?? "";

  assert.match(status, /data-live-metric="connected"[^>]*><span>Connected<\/span><strong>/);
  assert.match(status, /data-live-metric="empty"[^>]*><span>Empty<\/span><strong>/);
  assert.match(status, /data-live-metric="issues"[^>]*><span>Issues<\/span><strong>/);
  assert.match(status, /class="live-status-time"/);
  assert.match(status, /class="sr-only">No current records\. Not all-clear\.<\/span>/);
  assert.match(status, /class="live-inbox-truth">Checking candidates…<\/span>/);
  assert.match(component, /candidateCount === 0\s*\? "Zero candidates ≠ all-clear"/);
  assert.match(component, /`\$\{candidateCount\} candidate\$\{candidateCount === 1/);
  assert.match(status, /class="sr-only">Auto refresh every 60 seconds\.<\/span>/);
  assert.match(status, /type="button">Pause<\/button>/);
  assert.match(status, /type="button" disabled="">Refreshing…<\/button>/);
  assert.doesNotMatch(status, />Pause display</);
  assert.doesNotMatch(status, /<small>Not all-clear<\/small>/);
});

test("publishes a readable operator type floor", async () => {
  for (const path of ["/live", "/replay", "/integration", "/ontology"]) {
    const html = await (await request(path)).text();
    assert.match(html, /class="operator-console"[^>]*data-operator-type-floor="13px"/, path);
  }
});

test("hides advanced architecture and replay evidence until requested", async () => {
  const integration = await (await request("/integration")).text();
  const replay = await (await request("/replay")).text();

  assert.match(integration, /<details class="operator-advanced"><summary>Advanced<\/summary>/);
  assert.doesNotMatch(integration, /<details class="operator-advanced" open/);
  assert.match(replay, /<details class="operator-advanced"><summary>Evidence review<\/summary>/);
  assert.doesNotMatch(replay, /<details class="operator-advanced" open/);
});
