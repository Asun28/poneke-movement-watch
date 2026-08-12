import assert from "node:assert/strict";
import test from "node:test";

test("publishes a restrictive application CSP without blocking the operational basemap", async () => {
  const nextConfig = (await import("../next.config.ts")).default;
  const rules = typeof nextConfig.headers === "function" ? await nextConfig.headers() : [];
  const rootRule = rules.find((rule) => rule.source === "/(.*)");
  const headers = new Map((rootRule?.headers ?? []).map((header) => [header.key.toLowerCase(), header.value]));
  const csp = headers.get("content-security-policy") ?? "";

  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /img-src[^;]*https:\/\/\*\.basemaps\.cartocdn\.com/);
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
});

test("allows public reads but never grants wildcard CORS to POST", async () => {
  let corsPolicy;
  try {
    corsPolicy = await import("../lib/corsPolicy.mjs");
  } catch {
    corsPolicy = undefined;
  }
  assert.equal(typeof corsPolicy?.resolveCorsPolicy, "function");

  const publicRead = corsPolicy.resolveCorsPolicy(
    new Request("https://watch.example/api/integration/v1/contracts"),
  );
  assert.deepEqual(publicRead, { allowed: true, allowOrigin: "*", allowMethods: "GET, OPTIONS" });

  const sameOriginPost = corsPolicy.resolveCorsPolicy(new Request(
    "https://watch.example/api/integration/v1/workflow-adapters",
    { method: "POST", headers: { origin: "https://watch.example" } },
  ));
  assert.deepEqual(sameOriginPost, {
    allowed: true,
    allowOrigin: "https://watch.example",
    allowMethods: "GET, POST, OPTIONS",
  });

  const configuredPost = corsPolicy.resolveCorsPolicy(new Request(
    "https://watch.example/api/integration/v1/workflow-adapters",
    { method: "POST", headers: { origin: "https://operations.wcc.govt.nz" } },
  ), "https://operations.wcc.govt.nz");
  assert.equal(configuredPost.allowed, true);
  assert.equal(configuredPost.allowOrigin, "https://operations.wcc.govt.nz");

  const rejectedPost = corsPolicy.resolveCorsPolicy(new Request(
    "https://watch.example/api/integration/v1/workflow-adapters",
    { method: "POST", headers: { origin: "https://untrusted.example" } },
  ));
  assert.deepEqual(rejectedPost, {
    allowed: false,
    allowOrigin: null,
    allowMethods: "GET, POST, OPTIONS",
  });
});

test("projects replay signals through the extracted movement canvas model", async () => {
  let movementModel;
  try {
    movementModel = await import("../app/movementCanvasModel.ts");
  } catch {
    movementModel = undefined;
  }
  assert.equal(typeof movementModel?.replaySignalFeature, "function");

  const coverage = {
    id: "countline:42",
    geometry: { type: "LineString", coordinates: [[174.77, -41.29], [174.78, -41.28]] },
    properties: { countline_id: "42" },
  };
  const signal = {
    id: "movement:42:Car:N:2026-08-06T12:00:00",
    countline_id: "42",
    viewpoint_id: "7",
    name: "Test road",
    transport_class: "Car",
    direction: "N",
    change_direction: "decrease",
    observed_count: 20,
    expected_count: 40,
    robust_z: -5,
    observed_at: "2026-08-06T12:00:00+12:00",
    matched_history: [],
    signal_confidence: { level: "high", history_samples: 12, basis: "matched hour" },
  };

  assert.deepEqual(
    movementModel.replaySignalFeature(signal, new Map([["42", coverage]])),
    { type: "Feature", id: signal.id, geometry: coverage.geometry, properties: signal },
  );
  assert.equal(movementModel.replaySignalFeature({ ...signal, countline_id: "missing" }, new Map()), null);
});
