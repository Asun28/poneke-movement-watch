import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildLiveSnapshot,
  buildSourceContracts,
  createAlertCandidates,
} from "../lib/dataIntegration.mjs";
import { isActiveProviderEvent, normaliseProviderTime, parseRssObservations } from "../lib/liveAdapters.mjs";

const registry = JSON.parse(
  await readFile(new URL("../public/cop/v2/source-registry.json", import.meta.url), "utf8"),
);

const manifest = {
  "geonet-quakes": {
    connector_mode: "live",
    raw_format: "GeoJSON FeatureCollection",
    alert_eligible: true,
    freshness_seconds: 600,
  },
  "nzta-road-events": {
    connector_mode: "live",
    raw_format: "GeoJSON FeatureCollection",
    alert_eligible: true,
    freshness_seconds: 300,
  },
  "google-routes-api": {
    connector_mode: "mock",
    raw_format: "Google Routes v2 ComputeRoutes JSON",
    alert_eligible: false,
  },
};

test("builds one versioned integration contract for every registered source", () => {
  const contracts = buildSourceContracts(registry, manifest);

  assert.equal(contracts.schema, "wellington-integration-contracts/v1");
  assert.equal(contracts.sources.length, 33);
  assert.equal(new Set(contracts.sources.map((source) => source.source_id)).size, 33);

  const live = contracts.sources.find((source) => source.source_id === "geonet-quakes");
  assert.equal(live.connector_mode, "live");
  assert.equal(live.runtime_default, "empty");
  assert.equal(live.access.cost, "free");
  assert.equal(live.alert_eligible, true);

  const paid = contracts.sources.find((source) => source.source_id === "google-routes-api");
  assert.equal(paid.connector_mode, "mock");
  assert.equal(paid.runtime_default, "mock");
  assert.equal(paid.access.cost, "paid");
  assert.equal(paid.access.credentials_required, true);
  assert.equal(paid.alert_eligible, false);

  const replay = contracts.sources.find((source) => source.source_id === "wcc-transport-sensors");
  assert.equal(live.operations_target, "live_operations");
  assert.equal(replay.operations_target, "replay_analyzer");
  assert.equal(paid.operations_target, "integration_only");
  assert.ok(contracts.sources.every((source) => [
    "live_operations",
    "replay_analyzer",
    "integration_only",
  ].includes(source.operations_target)));
});

test("builds a partial live snapshot without hiding healthy, empty or mock sources", async () => {
  const contracts = buildSourceContracts(registry, manifest);
  const adapters = {
    "geonet-quakes": async () => ({
      raw_record_count: 1,
      observations: [{
        id: "geonet:quake:1",
        kind: "earthquake_observation",
        observed_at: "2026-08-10T01:00:00.000Z",
        geometry: { type: "Point", coordinates: [174.78, -41.29] },
        properties: { magnitude: 5.2, mmi: 5 },
      }],
    }),
    "nzta-road-events": async () => {
      throw new Error("upstream timeout");
    },
  };
  const mockFixtures = {
    "google-routes-api": {
      routes: [{ distanceMeters: 1240, duration: "312s" }],
    },
  };

  const snapshot = await buildLiveSnapshot({
    contracts,
    adapters,
    mockFixtures,
    now: new Date("2026-08-10T01:02:00.000Z"),
  });

  assert.equal(snapshot.schema, "wellington-live-snapshot/v1");
  assert.equal(snapshot.observations.length, 1);
  assert.equal(snapshot.summary.live, 1);
  assert.ok(snapshot.summary.unavailable >= 1);
  assert.ok(snapshot.summary.mock >= 1);

  const healthy = snapshot.sources.find((source) => source.source_id === "geonet-quakes");
  assert.equal(healthy.runtime_state, "live");
  assert.equal(healthy.record_count, 1);

  const failed = snapshot.sources.find((source) => source.source_id === "nzta-road-events");
  assert.equal(failed.runtime_state, "unavailable");
  assert.match(failed.message, /temporarily unavailable/i);

  const paid = snapshot.sources.find((source) => source.source_id === "google-routes-api");
  assert.equal(paid.runtime_state, "mock");
  assert.equal(paid.evidence_weight, 0);
  assert.deepEqual(paid.provider_envelope, mockFixtures["google-routes-api"]);
});

test("creates review-only alert candidates from fresh real evidence, never mock data", () => {
  const snapshot = {
    schema: "wellington-live-snapshot/v1",
    generated_at: "2026-08-10T01:02:00.000Z",
    sources: [
      { source_id: "geonet-quakes", runtime_state: "live", alert_eligible: true },
      { source_id: "nzta-road-events", runtime_state: "live", alert_eligible: true },
      { source_id: "nema-public-ema-cap", runtime_state: "live", alert_eligible: true },
      { source_id: "google-routes-api", runtime_state: "mock", alert_eligible: false },
    ],
    observations: [
      {
        id: "geonet:quake:1",
        source_id: "geonet-quakes",
        kind: "earthquake_observation",
        observed_at: "2026-08-10T01:00:00.000Z",
        received_at: "2026-08-10T01:02:00.000Z",
        freshness_state: "fresh",
        evidence_weight: 2,
        is_synthetic: false,
        geometry: { type: "Point", coordinates: [174.78, -41.29] },
        properties: { magnitude: 5.2, mmi: 5 },
      },
      {
        id: "nzta:planned:1",
        source_id: "nzta-road-events",
        kind: "road_event_observation",
        observed_at: "2026-08-10T01:00:00.000Z",
        received_at: "2026-08-10T01:02:00.000Z",
        freshness_state: "fresh",
        evidence_weight: 2,
        is_synthetic: false,
        geometry: { type: "Point", coordinates: [174.77, -41.28] },
        properties: { name: "Planned maintenance", is_planned: true, impact: "Delays" },
      },
      {
        id: "nema:outside-wellington",
        source_id: "nema-public-ema-cap",
        kind: "official_alert_observation",
        observed_at: "2026-08-10T01:00:00.000Z",
        received_at: "2026-08-10T01:02:00.000Z",
        freshness_state: "fresh",
        evidence_weight: 2,
        is_synthetic: false,
        geometry: null,
        properties: { headline: "Alert outside region", area_description: "Auckland" },
      },
      {
        id: "google:route:mock",
        source_id: "google-routes-api",
        kind: "route_delay_context",
        observed_at: "2026-08-10T01:00:00.000Z",
        received_at: "2026-08-10T01:02:00.000Z",
        freshness_state: "fresh",
        evidence_weight: 0,
        is_synthetic: true,
        geometry: null,
        properties: { duration: "312s" },
      },
    ],
  };

  const alerts = createAlertCandidates(snapshot);

  assert.equal(alerts.schema, "wellington-alert-candidates/v1");
  assert.equal(alerts.candidates.length, 1);
  assert.equal(alerts.candidates[0].review_state, "unreviewed");
  assert.equal(alerts.candidates[0].epistemic_state, "inference");
  assert.equal(alerts.candidates[0].decision_authority, "human");
  assert.equal(alerts.candidates[0].llm.authority, "explanation_only");
  assert.deepEqual(alerts.candidates[0].evidence.supporting, ["geonet:quake:1"]);
  assert.doesNotMatch(JSON.stringify(alerts), /google:route:mock/);
});

test("normalizes provider epoch seconds and evaluates active CAP at snapshot time", () => {
  assert.equal(normaliseProviderTime(1_700_000_000), "2023-11-14T22:13:20.000Z");
  assert.equal(normaliseProviderTime(1_700_000_000_000), "2023-11-14T22:13:20.000Z");

  const now = new Date("2026-08-10T01:00:00.000Z");
  const rss = `
    <rss><channel><item>
      <title>Active official warning</title>
      <guid>warning-1</guid>
      <pubDate>Sun, 09 Aug 2026 20:00:00 GMT</pubDate>
      <content:encoded><![CDATA[
        <alert><identifier>warning-1</identifier>
          <sent>2026-08-09T20:00:00Z</sent>
          <info><severity>Severe</severity><effective>2026-08-09T20:00:00Z</effective>
          <expires>2026-08-10T02:00:00Z</expires></info>
        </alert>
      ]]></content:encoded>
    </item></channel></rss>`;
  const [observation] = parseRssObservations(
    rss,
    "nema-public-ema-cap",
    "official_alert_observation",
    now,
  );

  assert.equal(observation.observed_at, now.toISOString());
  assert.equal(observation.properties.sent_at, "2026-08-09T20:00:00.000Z");
  assert.equal(observation.properties.expires, "2026-08-10T02:00:00.000Z");
});

test("keeps only road events that overlap the current snapshot window", () => {
  const now = new Date("2026-08-10T01:00:00.000Z");
  assert.equal(isActiveProviderEvent({ StartDate: "2026-08-10T00:00:00Z", EndDate: "2026-08-10T02:00:00Z", Status: "Active" }, now), true);
  assert.equal(isActiveProviderEvent({ StartDate: "2026-08-11T00:00:00Z", Status: "Scheduled" }, now), false);
  assert.equal(isActiveProviderEvent({ StartDate: "2026-08-09T00:00:00Z", Status: "Resolved" }, now), false);
});
