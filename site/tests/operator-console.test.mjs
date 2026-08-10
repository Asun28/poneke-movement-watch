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

test("renders truth, access and runtime health as separate integration dimensions", async () => {
  const response = await request("/integration");
  const html = await response.text();

  assert.match(html, /Source truth/);
  assert.match(html, /Access &amp; cost/);
  assert.match(html, /Runtime health/);
  assert.match(html, /Provider format/);
  assert.match(html, /Mock · zero evidence weight/);
  assert.match(html, /Google Routes API/);
  assert.match(html, /NEMA Emergency Mobile Alert/);
  assert.match(html, /href="\/setup"/);
  assert.match(html, /Add source/);
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
