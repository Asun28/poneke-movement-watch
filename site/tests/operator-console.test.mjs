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
    ["/live", /Live Operations/, /What is happening now/],
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
  assert.match(html, /No secrets stored here/);
  assert.match(html, /Needs server activation/);
  assert.match(html, /Saved on this browser/);
});

test("keeps replay controls out of the live module and preserves them in replay", async () => {
  const live = await (await request("/live")).text();
  const replay = await (await request("/replay")).text();

  assert.doesNotMatch(live, /aria-label="Replay speed"/);
  assert.match(live, /No current records is not an all-clear/);
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
  assert.match(html, /Add or connect/);
});

test("makes model authority and mock alert exclusion explicit", async () => {
  const response = await request("/alerts");
  const html = await response.text();

  assert.match(html, /Pre-trained sensor monitor/);
  assert.match(html, /Ontology correlation/);
  assert.match(html, /LLM explanation only/);
  assert.match(html, /Mock data cannot create an alert candidate/);
  assert.match(html, /Supporting/);
  assert.match(html, /Contradicting/);
  assert.match(html, /Missing/);
  assert.match(html, /Context/);
});
