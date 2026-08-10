import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("operator-test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

function request(pathname, init) {
  return worker.fetch(new Request(`http://localhost${pathname}`, init), env, ctx);
}

test("opens the operator console in Live Operations", async () => {
  const response = await request("/");
  assert.ok([307, 308].includes(response.status));
  assert.equal(response.headers.get("location"), "/live");
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

test("exposes five distinct operator modules with shared navigation", async () => {
  const expectations = [
    ["/live", /Live Operations/, /Current feeds/],
    ["/alerts", /Alert Centre/, /Human review queue/],
    ["/replay", /Replay Analyzer/, /History replay/],
    ["/integration", /Data Integration/, /33 source contracts/],
    ["/setup", /Easy setup/, /Add data source/],
  ];

  for (const [path, heading, content] of expectations) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, heading, path);
    assert.match(html, content, path);
    assert.match(html, /Live Operations/, path);
    assert.match(html, /Alert Centre/, path);
    assert.match(html, /Replay Analyzer/, path);
    assert.match(html, /Data Integration/, path);
    assert.match(html, /Setup/, path);
  }
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

test("routes backtest events to Replay Analyzer instead of Live Operations", async () => {
  const live = await (await request("/live")).text();
  const replay = await (await request("/replay")).text();

  assert.doesNotMatch(live, /April Storm backtest/);
  assert.doesNotMatch(live, /回测/);
  assert.match(replay, /Backtest events/);
  assert.match(replay, /Replay Analyzer input/);
  assert.match(replay, /id="april-storm-backtest"/);
  assert.doesNotMatch(replay, /回测/);
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

test("defaults Replay Analyzer source layers to replay sources with explicit module filters", async () => {
  const html = await (await request("/replay")).text();

  assert.match(html, /Replay source layers/);
  assert.match(html, /Show sources for/);
  assert.match(html, /aria-label="Filter replay source layers by operator module"/);
  assert.match(html, /value="replay_analyzer" selected=""/);
  assert.match(html, /Replay Analyzer/);
  assert.match(html, /Live Operations/);
  assert.match(html, /Integration only/);
});

test("makes model authority and mock alert exclusion explicit", async () => {
  const response = await request("/alerts");
  const html = await response.text();

  assert.match(html, /Models can propose and explain/);
  assert.match(html, /Mock · zero evidence/);
  assert.match(html, /Human review required/);
  assert.match(html, /Supporting/);
  assert.match(html, /Contradicting/);
  assert.match(html, /Missing/);
  assert.match(html, /Context/);
});

test("provides a focused editable review ticket without changing system truth", async () => {
  const response = await request("/alerts");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /aria-label="Alert ticket queue"/);
  assert.match(html, /Search tickets/);
  assert.match(html, /Filter by review status/);
  assert.match(html, /Review status/);
  assert.match(html, /Assigned to/);
  assert.match(html, /Review note/);
  assert.match(html, /Save local draft/);
  assert.match(html, /This browser only/);
  assert.match(html, /System severity/);
  assert.match(html, /Observed/);
  assert.doesNotMatch(html, /name="severity"/);
});

test("provides the complete mock investigation workflow without sending externally", async () => {
  const html = await (await request("/alerts")).text();
  assert.match(html, /Workflow actions/);
  assert.match(html, /Mock only · nothing is sent/);
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

test("keeps routine screens concise and moves guidance into closed help", async () => {
  for (const path of ["/live", "/alerts", "/replay", "/integration", "/setup"]) {
    const html = await (await request(path)).text();
    const heading = html.match(/<section class="operator-module-heading">([\s\S]*?)<\/section>/)?.[1] ?? "";

    assert.match(html, /<details class="operator-help"><summary>Help<\/summary>/, path);
    assert.doesNotMatch(html, /<details class="operator-help" open/, path);
    assert.match(heading, /<h1>/, path);
    assert.equal((heading.match(/<p/g) ?? []).length, 1, path);
    assert.doesNotMatch(html, /Emergency information prototype/, path);
    assert.doesNotMatch(html, /Every candidate remains an inference/, path);
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
