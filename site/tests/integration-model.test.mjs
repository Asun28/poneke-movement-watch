import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildEvidenceInbox,
  buildLiveSnapshot,
  buildSourceContracts,
  createAlertCandidates,
} from "../lib/dataIntegration.mjs";
import { isActiveProviderEvent, normaliseProviderTime, parseRssObservations } from "../lib/liveAdapters.mjs";
import { PROVIDER_FIXTURES } from "../lib/providerFixtures.mjs";

let liveMapWorkspace = {};
try {
  liveMapWorkspace = await import("../lib/liveMapWorkspace.mjs");
} catch {
  // The contract tests stay readable during the initial RED step.
}

let replayDataWorkspace = {};
try {
  replayDataWorkspace = await import("../lib/replayDataWorkspace.mjs");
} catch {
  // The contract tests stay readable during the initial RED step.
}

const registry = JSON.parse(
  await readFile(new URL("../public/cop/v2/source-registry.json", import.meta.url), "utf8"),
);

const cityOntology = JSON.parse(
  await readFile(new URL("../public/cop/v3/city-ontology.json", import.meta.url), "utf8"),
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

const validWarningDraft = {
  case_id: "candidate:test:1",
  hazard: "Surface flooding",
  affected_area: "Berhampore",
  warning_level: "protective_action",
  community_impact: "Road access may become unsafe.",
  public_action: "Avoid floodwater and use another route.",
  effective_at: "2026-08-10T01:00:00.000Z",
  expires_at: "2026-08-10T04:00:00.000Z",
  next_update_at: "2026-08-10T02:00:00.000Z",
  evidence_ids: ["nzta:event:1", "gwrc:rain:1"],
  creator_id: "operator:maya",
  approver_id: "operator:ana",
};

test("classifies live evidence into honest overlapping map layers", () => {
  assert.equal(typeof liveMapWorkspace.classifyLiveObservationLayers, "function");
  const classify = liveMapWorkspace.classifyLiveObservationLayers;
  const source = (role) => ({ source_id: `source:${role}`, role });
  const observation = (id, kind) => ({ id, source_id: "source:test", kind, properties: {} });

  assert.deepEqual(
    classify(observation("sensor:rain:1", "rainfall_observation"), source("natural_hazard_sensor"), new Set(["sensor:rain:1"])),
    ["review-evidence", "sensors-weather"],
  );
  assert.deepEqual(classify(observation("quake:1", "earthquake"), source("official_hazard"), new Set()), ["warnings-hazards"]);
  assert.deepEqual(classify(observation("road:1", "road_access_event"), source("access_context"), new Set()), ["access-impacts"]);
  assert.deepEqual(classify(observation("report:1", "public_report"), source("community_report"), new Set()), ["reports"]);
  assert.deepEqual(classify(observation("other:1", "unknown"), source("unknown"), new Set()), ["other-live"]);
});

test("filters the live map without changing source truth or evidence eligibility", () => {
  assert.equal(typeof liveMapWorkspace.filterLiveMapObservations, "function");
  const observations = [
    { id: "rain:1", source_id: "rain", kind: "rainfall_observation", properties: { name: "Karori rain" } },
    { id: "road:1", source_id: "road", kind: "road_access_event", properties: { headline: "Ngauranga closure" } },
  ];
  const sources = [
    { source_id: "rain", name: "Hilltop", role: "natural_hazard_sensor" },
    { source_id: "road", name: "Road events", role: "access_context" },
  ];

  assert.deepEqual(liveMapWorkspace.filterLiveMapObservations({
    observations,
    sources,
    selectedSourceIds: new Set(["rain", "road"]),
    activeLayerIds: new Set(["sensors-weather"]),
    candidateEvidenceIds: new Set(),
    query: "karori",
  }).map(({ id }) => id), ["rain:1"]);
});

test("searches the operational values shown on Live evidence cards", () => {
  const observations = [
    {
      id: "camera:1",
      source_id: "camera",
      kind: "traffic_camera_observation",
      properties: { name: "Ngauranga Gorge", offline: true, direction: "southbound" },
    },
    {
      id: "rain:1",
      source_id: "rain",
      kind: "rainfall_observation",
      properties: { site_id: "Karori", latest_rainfall: 7.4, rainfall_6h: 42.1, unit: "mm" },
    },
  ];
  const sources = [
    { source_id: "camera", name: "NZTA cameras", role: "access_context" },
    { source_id: "rain", name: "Hilltop", role: "natural_hazard_sensor" },
  ];
  const filter = (query) => liveMapWorkspace.filterLiveMapObservations({
    observations,
    sources,
    selectedSourceIds: new Set(["camera", "rain"]),
    activeLayerIds: new Set(["access-impacts", "sensors-weather"]),
    candidateEvidenceIds: new Set(),
    query,
  }).map(({ id }) => id);

  assert.deepEqual(filter("offline"), ["camera:1"]);
  assert.deepEqual(filter("southbound"), ["camera:1"]);
  assert.deepEqual(filter("42.1 mm"), ["rain:1"]);
});

test("maps operational event families to distinct accessible symbols", () => {
  assert.equal(typeof liveMapWorkspace.eventSymbolFor, "function");
  const symbolFor = liveMapWorkspace.eventSymbolFor;
  const examples = [
    [{ source_id: "gwrc-hilltop", kind: "rainfall_measurement", properties: {} }, "rain"],
    [{ source_id: "geonet-tilde-wlgt", kind: "sea_level_measurement", properties: {} }, "water"],
    [{ source_id: "geonet-quakes", kind: "earthquake_observation", properties: {} }, "earthquake"],
    [{ source_id: "nzta-road-events", kind: "road_event_observation", properties: {} }, "road"],
    [{ source_id: "metlink-gtfs-rt", kind: "bus_delay", properties: {} }, "transit"],
    [{ source_id: "wellington-airport-flights", kind: "flight_status", properties: {} }, "flight"],
    [{ source_id: "centreport-cruise-schedule", kind: "cruise_call", properties: {} }, "cruise"],
    [{ source_id: "wcc-event-calendar", kind: "city_event", properties: {} }, "city-event"],
    [{ source_id: "wcc-ticket", kind: "community_report", properties: {} }, "report"],
  ];

  const symbols = examples.map(([observation, expectedId]) => {
    const symbol = symbolFor(observation);
    assert.equal(symbol.id, expectedId);
    assert.ok(symbol.label.length > 2);
    assert.ok(symbol.glyph.length > 0);
    return symbol;
  });
  assert.equal(new Set(symbols.map(({ id }) => id)).size, examples.length);
});

test("builds an available-at-safe April sensor replay for the selected investigation", async () => {
  assert.equal(typeof replayDataWorkspace.buildSensorReplayDataset, "function");
  assert.equal(typeof replayDataWorkspace.sensorReplayFrame, "function");
  const pack = JSON.parse(await readFile(
    new URL("../public/cop/v4/april-storm-hilltop-observations.json", import.meta.url),
    "utf8",
  ));
  const detectorPack = JSON.parse(await readFile(
    new URL("../public/cop/v4/april-storm-hydro-detector.json", import.meta.url),
    "utf8",
  ));
  const investigation = {
    id: "wellington-april-storm-2026",
    title: "April Storm · 18–22 Apr 2026",
    source_id: "gwrc-hilltop",
    starts_at: "2026-04-18T00:00:00+12:00",
    as_of: "2026-04-22T23:59:59+12:00",
  };
  const dataset = replayDataWorkspace.buildSensorReplayDataset(pack, investigation, detectorPack);

  assert.equal(dataset.kind, "sensor");
  assert.equal(dataset.total_record_count, 10098);
  assert.equal(dataset.playable_record_count, 10062);
  assert.equal(dataset.series.length, 18);
  assert.deepEqual(dataset.layer_groups.map(({ id }) => id), ["rainfall", "river-flow", "detector-candidates"]);
  assert.ok(dataset.detector_candidate_count > 0);
  assert.equal(dataset.slots.length, 1439);
  assert.equal(dataset.available_from, "2026-04-18T00:05:00+12:00");
  assert.equal(dataset.available_to, "2026-04-22T23:55:00+12:00");

  const frame = replayDataWorkspace.sensorReplayFrame(dataset, 0);
  assert.equal(frame.target_at, dataset.available_from);
  assert.ok(frame.readings.length >= 1);
  assert.ok(frame.readings.every((reading) => new Date(reading.available_at) <= new Date(frame.target_at)));
});

test("filters Replay sensor layers without changing the source frame", () => {
  assert.equal(typeof replayDataWorkspace.filterSensorReplayReadings, "function");
  const readings = [
    { id: "rain:berhampore:1", series_id: "rain:berhampore", measurement: "Rainfall" },
    { id: "rain:newtown:1", series_id: "rain:newtown", measurement: "Rainfall" },
    { id: "flow:hutt:1", series_id: "flow:hutt", measurement: "Flow" },
  ];
  const visible = replayDataWorkspace.filterSensorReplayReadings(readings, {
    visibleSeriesIds: new Set(["rain:berhampore", "flow:hutt"]),
    measurementFilter: "all",
  });

  assert.deepEqual(visible.map(({ id }) => id), ["rain:berhampore:1", "flow:hutt:1"]);
  assert.equal(readings.length, 3);
  assert.deepEqual(replayDataWorkspace.filterSensorReplayReadings(readings, {
    visibleSeriesIds: new Set(readings.map(({ series_id }) => series_id)),
    measurementFilter: "flow",
  }).map(({ id }) => id), ["flow:hutt:1"]);
  assert.deepEqual(replayDataWorkspace.filterSensorReplayReadings([
    ...readings,
    { id: "rain:alert:1", series_id: "rain:berhampore", measurement: "Rainfall", detector_candidate: true },
  ], {
    visibleSeriesIds: new Set(["rain:berhampore", "rain:newtown", "flow:hutt"]),
    measurementFilter: "anomaly",
  }).map(({ id }) => id), ["rain:alert:1"]);
});

test("updates a Replay sensor selection from a captured checkbox value", () => {
  assert.equal(typeof replayDataWorkspace.updateVisibleSensorSeries, "function");
  const original = new Set(["rain:berhampore", "flow:hutt"]);
  const hidden = replayDataWorkspace.updateVisibleSensorSeries(original, "flow:hutt", false);
  const restored = replayDataWorkspace.updateVisibleSensorSeries(hidden, "flow:hutt", true);

  assert.deepEqual([...hidden], ["rain:berhampore"]);
  assert.deepEqual([...restored], ["rain:berhampore", "flow:hutt"]);
  assert.deepEqual([...original], ["rain:berhampore", "flow:hutt"]);
});

test("keeps April movement and official-impact layers operator-controlled", async () => {
  assert.equal(typeof replayDataWorkspace.defaultSensorReplayLayers, "function");
  assert.deepEqual(replayDataWorkspace.defaultSensorReplayLayers(), {
    movement_outcomes: true,
    hilltop_observations: true,
    official_impacts: false,
  });

  const component = await readFile(
    new URL("../app/components/SensorReplayCanvas.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /aria-label="Toggle official impact evidence"/);
  assert.match(component, /aria-pressed=\{showMovementOutcomes\}/);
  assert.match(component, /fetch\("\/cop\/v4\/april-storm-movement-outcomes\.json"\)/);
  assert.match(component, /evidence_weight: 0/);
});

test("keeps mobile Replay controls clear of the fixed operator navigation", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.sensor-replay-workspace \.ops-map-controls \{ top: 88px; right: 8px; bottom: auto; \}/);
  assert.match(css, /\.sensor-reading-strip \{ top: 282px; right: 8px; bottom: auto; \}/);
  assert.match(css, /\.sensor-replay-workspace \.ops-map-legend \{ top: 239px; right: auto; bottom: auto;/);
  assert.match(css, /\.sensor-replay-workspace \.ops-map-attribution \{ top: 88px; right: auto; bottom: auto; left: 8px;/);
});

test("clusters overlapping evidence only at broad map zoom", () => {
  assert.equal(typeof liveMapWorkspace.clusterMapPoints, "function");
  const points = [
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 112, y: 105 },
    { id: "c", x: 420, y: 300 },
  ];

  assert.deepEqual(liveMapWorkspace.clusterMapPoints(points, 1).map(({ count }) => count), [2, 1]);
  assert.deepEqual(liveMapWorkspace.clusterMapPoints(points, 4).map(({ count }) => count), [1, 1, 1]);
});

test("keeps one Live map panel open at a time", () => {
  assert.equal(typeof liveMapWorkspace.toggleLiveMapPanel, "function");
  assert.equal(liveMapWorkspace.toggleLiveMapPanel(null, "filters"), "filters");
  assert.equal(liveMapWorkspace.toggleLiveMapPanel("filters", "inbox"), "inbox");
  assert.equal(liveMapWorkspace.toggleLiveMapPanel("inbox", "inbox"), null);
});

test("expands every Live map hit target to at least 44 pixels", () => {
  assert.equal(typeof liveMapWorkspace.liveMapHitRadius, "function");
  assert.equal(liveMapWorkspace.liveMapHitRadius(8), 22);
  assert.equal(liveMapWorkspace.liveMapHitRadius(13), 22);
  assert.equal(liveMapWorkspace.liveMapHitRadius(20), 27);
});

test("keeps Live mobile map details in one clear bottom sheet", async () => {
  const [css, component] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/LiveOperationsClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(component, /data-mobile-surface="bottom-sheet"/);
  assert.match(component, /tabIndex=\{-1\} className="live-map-detail-overlay" role="dialog" aria-modal="false" aria-label="Selected evidence details"/);
  assert.ok(css.includes(".live-map-inbox-overlay.is-collapsed { display: none; }"));
  assert.ok(css.includes("border-radius: 16px 16px 0 0;"));
  assert.ok(css.includes(".live-map-workspace .ops-map-controls { top: auto; right: 8px; bottom: 82px; }"));
});

test("projects every live map record into a compact label and value card", () => {
  assert.equal(typeof liveMapWorkspace.buildLiveMapCard, "function");
  const card = liveMapWorkspace.buildLiveMapCard({
    id: "rain:karori:1",
    source_id: "gwrc-hilltop",
    kind: "hazard_measurement_observation",
    observed_at: "2026-08-10T08:20:00.000Z",
    freshness_state: "fresh",
    evidence_weight: 2,
    properties: {
      site_id: "Karori Reservoir",
      latest_rainfall: 7.4,
      rainfall_6h: 42.1,
      unit: "mm",
    },
  }, { name: "Greater Wellington rainfall" });

  assert.deepEqual(card, {
    title: "Karori Reservoir",
    state: "Fresh",
    value: "7.4 mm now · 42.1 mm / 6h",
    source: "Greater Wellington rainfall",
    observed_at: "2026-08-10T08:20:00.000Z",
    evidence: "Weight 2",
  });
});

test("summarises overlapping live records with tidy values", () => {
  assert.equal(typeof liveMapWorkspace.buildLiveMapClusterCard, "function");
  const card = liveMapWorkspace.buildLiveMapClusterCard([
    { id: "quake:1", source_id: "geonet-quakes", kind: "earthquake_observation", properties: { locality: "Cook Strait", magnitude: 4.2, depth_km: 18 } },
    { id: "sea:1", source_id: "geonet-tilde-wlgt", kind: "sea_level_measurement", properties: { value: 0.31, unit: "m" } },
    { id: "road:1", source_id: "nzta-road-events", kind: "road_event_observation", properties: { name: "SH2 Petone", status: "Open", impact: "Caution" } },
    { id: "rain:1", source_id: "gwrc-hilltop", kind: "hazard_measurement_observation", properties: { site_id: "Karori", latest_rainfall: 3, unit: "mm" } },
  ]);

  assert.equal(card.title, "4 nearby records");
  assert.deepEqual(card.items, [
    { title: "Cook Strait", value: "M4.2 · 18 km deep", source: "geonet quakes" },
    { title: "sea level measurement", value: "0.31 m", source: "geonet tilde wlgt" },
    { title: "SH2 Petone", value: "Open · Caution", source: "nzta road events" },
  ]);
  assert.equal(card.remaining, 1);
});

test("keeps Signal, Incident and Warning states independently human-controlled", async () => {
  const { createCaseWorkflow } = await import("../lib/caseWorkflow.mjs");
  const workflow = createCaseWorkflow({
    case_id: "candidate:critical:1",
    severity: "critical",
    incident_state: "confirmed",
    warning_state: "issued",
  }, new Date("2026-08-10T01:05:00.000Z"));

  assert.deepEqual(workflow.state, {
    signal: "candidate",
    incident: "unconfirmed",
    warning: "none",
  });
  assert.equal(workflow.authority.incident_confirmation, "human_only");
  assert.equal(workflow.authority.warning_issue, "human_only");
  assert.equal(workflow.storage, "browser_local_demo");
});

test("groups review statuses into New, Active, Closed and all-record History views", async () => {
  const { queueForReviewStatus, reviewQueueIncludesStatus } = await import("../lib/signalReview.mjs");

  assert.equal(queueForReviewStatus("open"), "new");
  assert.equal(queueForReviewStatus("investigating"), "active");
  assert.equal(queueForReviewStatus("needs_action"), "active");
  assert.equal(queueForReviewStatus("closed"), "closed");
  assert.equal(reviewQueueIncludesStatus("history", "open"), true);
  assert.equal(reviewQueueIncludesStatus("history", "closed"), true);
  assert.equal(reviewQueueIncludesStatus("closed", "investigating"), false);
});

test("keeps human classifications governed and excludes mock or undetermined feedback", async () => {
  const { classificationFeedback } = await import("../lib/signalReview.mjs");

  assert.deepEqual(classificationFeedback("true_positive", { is_mock: false }), {
    id: "true_positive",
    label: "True Positive",
    meaning: "A real disruption occurred as detected.",
    next_step: "Escalate the response and preserve verified evidence.",
    training_use: "review_candidate",
  });
  assert.equal(classificationFeedback("undetermined", { is_mock: false }).training_use, "excluded");
  assert.equal(classificationFeedback("false_positive", { is_mock: true }).training_use, "excluded");
});

test("requires complete warning fields and a distinct approver", async () => {
  const { prepareWarningApproval } = await import("../lib/caseWorkflow.mjs");
  const required = [
    "hazard",
    "affected_area",
    "warning_level",
    "public_action",
    "effective_at",
    "expires_at",
    "next_update_at",
    "evidence_ids",
  ];

  for (const field of required) {
    const draft = structuredClone(validWarningDraft);
    delete draft[field];
    const result = prepareWarningApproval(draft, new Date("2026-08-10T01:05:00.000Z"));
    assert.equal(result.ready, false, field);
    assert.ok(result.errors.includes(`required:${field}`), field);
    assert.equal(result.warning.state, "draft", field);
    assert.ok(result.channels.every((channel) => channel.status === "not_prepared"), field);
  }

  const samePerson = prepareWarningApproval({
    ...validWarningDraft,
    creator_id: " Operator:MAYA ",
    approver_id: "operator:maya",
  });
  assert.equal(samePerson.ready, false);
  assert.ok(samePerson.errors.includes("distinct_approver_required"));

  const unrelatedEvidence = prepareWarningApproval({
    ...validWarningDraft,
    evidence_ids: ["unrelated:claim"],
    allowed_evidence_ids: validWarningDraft.evidence_ids,
  });
  assert.equal(unrelatedEvidence.ready, false);
  assert.ok(unrelatedEvidence.errors.includes("invalid:evidence_ids"));
});

test("prepares a local approval package without issuing or fabricating delivery", async () => {
  const { prepareWarningApproval } = await import("../lib/caseWorkflow.mjs");
  const result = prepareWarningApproval(validWarningDraft, new Date("2026-08-10T01:05:00.000Z"));

  assert.equal(result.ready, true);
  assert.equal(result.warning.state, "awaiting_approval");
  assert.equal(result.mode, "mock");
  assert.equal(result.is_synthetic, true);
  assert.equal(result.dispatched, false);
  assert.equal(result.authority.external_action, "not_authorised");
  assert.deepEqual(result.delivery_receipts, []);
  assert.ok(result.channels.every((channel) => channel.status === "prepared_not_sent"));
  assert.ok(result.channels.every((channel) => !["accepted", "failed", "published"].includes(channel.status)));
  assert.notEqual(result.approval.creator_id, result.approval.approver_id);
  assert.equal(result.timeline.at(-1).action, "approval_pack_prepared");
  assert.equal(result.timeline.at(-1).case_version, 2);
});

test("cuts Replay evidence at available_at rather than observed_at", async () => {
  const { buildReplayHandoff } = await import("../lib/caseWorkflow.mjs");
  const handoff = buildReplayHandoff({
    case_id: "storm:1",
    source_id: "nzta-road-events",
    as_of: "2026-04-20T12:00:00.000Z",
    evidence: [
      { id: "in-time", observed_at: "2026-04-20T09:00:00.000Z", available_at: "2026-04-20T11:59:00.000Z" },
      { id: "future", observed_at: "2026-04-20T09:00:00.000Z", available_at: "2026-04-20T12:01:00.000Z" },
      { id: "unknown-time", observed_at: "2026-04-20T08:00:00.000Z", available_at: null },
    ],
  });

  assert.equal(handoff.evidence_policy, "available_at_only");
  assert.equal(handoff.as_of, "2026-04-20T12:00:00.000Z");
  assert.deepEqual(handoff.selected_evidence_ids, ["in-time"]);
  assert.equal(handoff.window.ends_at, handoff.as_of);
  assert.match(handoff.replay_url, /as_of=2026-04-20T12%3A00%3A00.000Z/);
});

test("builds selectable packaged Replay investigations with an auditable April cutoff", async () => {
  let investigationModel = {};
  try {
    investigationModel = await import("../lib/replayInvestigations.mjs");
  } catch {
    // RED until the production investigation model exists.
  }
  assert.equal(typeof investigationModel.buildReplayInvestigationCatalog, "function");
  assert.equal(typeof investigationModel.buildReplayInvestigationUrl, "function");

  const catalog = investigationModel.buildReplayInvestigationCatalog({
    movementReplay: {
      available_from: "2026-08-01T00:00:00+12:00",
      available_to: "2026-08-06T23:00:00+12:00",
      data_as_of: "2026-08-06T23:00:00+12:00",
      model: { id: "movement-seasonal-mad-v1" },
      input_observation_count: 284556,
      candidate_count: 929,
      slots: Array.from({ length: 144 }),
    },
    aprilStorm: {
      event_id: "wellington-april-storm-2026",
      title: "April Storm 2026",
      mode: "retrospective_case_study",
      window: {
        start_at: "2026-04-18T00:00:00+12:00",
        end_at: "2026-04-22T23:59:59+12:00",
      },
    },
    hilltopPack: {
      source_id: "gwrc-hilltop",
      record_count: 1683,
      truth: "official_historical_observations",
    },
  });

  assert.deepEqual(catalog.map((item) => item.id), [
    "wellington-april-storm-2026",
    "august-movement-review-2026",
  ]);
  const april = catalog[0];
  assert.equal(april.title, "April Storm · movement impacts · 18–22 Apr 2026");
  assert.equal(april.source_id, "gwrc-hilltop");
  assert.equal(april.primary_source_id, "wcc-transport-sensors");
  assert.deepEqual(april.supporting_source_ids, ["gwrc-hilltop"]);
  assert.equal(april.record_count, 1683);
  assert.equal(april.scope, "packaged");
  assert.equal(april.editable, false);
  assert.equal(april.as_of, "2026-04-22T23:59:59+12:00");
  const august = catalog[1];
  assert.equal(august.record_count, 284556);
  assert.equal(august.candidate_count, 929);
  assert.equal(august.model_id, "movement-seasonal-mad-v1");
  assert.equal(august.data_label, "929 model candidates");
  assert.equal(august.truth_label, "Model output · real batch replay");
  assert.equal(
    investigationModel.buildReplayInvestigationUrl(april),
    "/replay?investigation=wellington-april-storm-2026&case=wellington-april-storm-2026&source=gwrc-hilltop&from=2026-04-18T00%3A00%3A00%2B12%3A00&as_of=2026-04-22T23%3A59%3A59%2B12%3A00#april-storm-backtest",
  );
});

test("creates bounded local Replay drafts without creating an Incident or overriding a packaged case", async () => {
  let investigationModel = {};
  try {
    investigationModel = await import("../lib/replayInvestigations.mjs");
  } catch {
    // RED until the production investigation model exists.
  }
  assert.equal(typeof investigationModel.prepareReplayInvestigationDraft, "function");
  assert.equal(typeof investigationModel.mergeReplayInvestigations, "function");

  const sourceWindows = [{
    source_id: "gwrc-hilltop",
    starts_at: "2026-04-18T00:00:00+12:00",
    as_of: "2026-04-22T23:59:59+12:00",
    target_hash: "april-storm-backtest",
  }];
  const result = investigationModel.prepareReplayInvestigationDraft({
    title: "Berhampore rainfall review",
    source_id: "gwrc-hilltop",
    starts_at: "2026-04-19T00:00:00+12:00",
    as_of: "2026-04-21T12:00:00+12:00",
  }, sourceWindows, ["wellington-april-storm-2026"]);

  assert.equal(result.ready, true);
  assert.equal(result.investigation.scope, "local_draft");
  assert.equal(result.investigation.incident_created, false);
  assert.equal(result.investigation.external_effect, "none");
  assert.match(result.investigation.id, /^local:berhampore-rainfall-review:/);
  assert.match(result.replay_url, /scope=local_draft/);
  assert.match(result.replay_url, /as_of=2026-04-21T12%3A00%3A00%2B12%3A00/);

  const outsideWindow = investigationModel.prepareReplayInvestigationDraft({
    title: "Unsupported time",
    source_id: "gwrc-hilltop",
    starts_at: "2026-04-17T23:00:00+12:00",
    as_of: "2026-04-21T12:00:00+12:00",
  }, sourceWindows, []);
  assert.equal(outsideWindow.ready, false);
  assert.deepEqual(outsideWindow.errors, ["outside_source_window"]);

  const collision = investigationModel.prepareReplayInvestigationDraft({
    id: "wellington-april-storm-2026",
    title: "Attempted overwrite",
    source_id: "gwrc-hilltop",
    starts_at: "2026-04-19T00:00:00+12:00",
    as_of: "2026-04-21T12:00:00+12:00",
  }, sourceWindows, ["wellington-april-storm-2026"]);
  assert.equal(collision.ready, false);
  assert.deepEqual(collision.errors, ["canonical_id_reserved"]);

  const canonical = [{ id: "wellington-april-storm-2026", title: "Canonical", scope: "packaged" }];
  const merged = investigationModel.mergeReplayInvestigations(canonical, [
    result.investigation,
    { ...result.investigation, id: "wellington-april-storm-2026", title: "Overwrite" },
    { id: "broken" },
  ]);
  assert.deepEqual(merged.map((item) => item.id), [
    "wellington-april-storm-2026",
    result.investigation.id,
  ]);
  assert.equal(merged[0].title, "Canonical");
});

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

test("builds editable investigation sources without changing canonical truth", async () => {
  const {
    mergeInvestigationSources,
    upsertInvestigationSource,
  } = await import("../lib/replaySourceWorkspace.mjs");
  const canonical = [
    {
      id: "wcc-transport-sensors",
      name: "WCC Transport Sensors",
      role: "movement_observation",
      demo_data_status: "real_replay",
      access_status: "public_free",
      operations_target: "replay_analyzer",
      alert_eligible: false,
      data_2026: { status: "real_records", active: true },
    },
    {
      id: "gwrc-hilltop",
      name: "Greater Wellington Hilltop",
      role: "hazard_observation",
      demo_data_status: "registered_only",
      access_status: "public_free",
      operations_target: "live_operations",
      alert_eligible: true,
      data_2026: { status: "available_not_ingested", active: true },
    },
  ];

  const seeded = mergeInvestigationSources(canonical);
  assert.deepEqual(seeded[0].assigned_modules, ["replay_analyzer"]);
  assert.deepEqual(seeded[1].assigned_modules, ["live_operations", "alert_centre"]);
  assert.ok(seeded.every((source) => source.record_origin === "canonical"));

  const added = upsertInvestigationSource(seeded, {
    id: "operator-field-notes",
    name: "Operator field notes",
    endpoint: "https://example.govt.nz/field-notes",
    demo_data_status: "mock_preview",
    access_status: "permission_required",
    assigned_modules: ["replay_analyzer", "alert_centre"],
  });
  assert.equal(added.ok, true);
  assert.equal(added.saved.record_origin, "local_draft");
  assert.deepEqual(added.saved.assigned_modules, ["replay_analyzer", "alert_centre"]);
  assert.equal(added.saved.data_2026.status, "input_required");

  const overridden = upsertInvestigationSource(added.sources, {
    id: "wcc-transport-sensors",
    name: "Movement counters for case",
    endpoint: "https://unverified.example/replacement",
    demo_data_status: "mock_preview",
    access_status: "paid_key_required",
    assigned_modules: ["replay_analyzer", "alert_centre"],
  });
  assert.equal(overridden.ok, true);
  assert.equal(overridden.saved.record_origin, "local_override");
  assert.equal(overridden.saved.name, "Movement counters for case");
  assert.equal(overridden.saved.demo_data_status, "real_replay");
  assert.equal(overridden.saved.access_status, "public_free");
  assert.equal(overridden.saved.endpoint, null);
  assert.deepEqual(overridden.saved.data_2026, canonical[0].data_2026);
});

test("rejects incomplete or unsafe investigation source drafts", async () => {
  const { mergeInvestigationSources, upsertInvestigationSource } = await import(
    "../lib/replaySourceWorkspace.mjs"
  );
  const sources = mergeInvestigationSources([]);

  const missingModules = upsertInvestigationSource(sources, {
    id: "new-source",
    name: "New source",
    demo_data_status: "registered_only",
    access_status: "public_free",
    assigned_modules: [],
  });
  assert.equal(missingModules.ok, false);
  assert.deepEqual(missingModules.errors, ["required:assigned_modules"]);

  const invalidId = upsertInvestigationSource(sources, {
    id: "New Source!",
    name: "New source",
    demo_data_status: "registered_only",
    access_status: "public_free",
    assigned_modules: ["replay_analyzer"],
  });
  assert.equal(invalidId.ok, false);
  assert.deepEqual(invalidId.errors, ["invalid:id"]);

  const invalidModule = upsertInvestigationSource(sources, {
    id: "new-source",
    name: "New source",
    demo_data_status: "registered_only",
    access_status: "public_free",
    assigned_modules: ["send_everywhere"],
  });
  assert.equal(invalidModule.ok, false);
  assert.deepEqual(invalidModule.errors, ["invalid:assigned_modules"]);

  const unverifiedHistory = upsertInvestigationSource(sources, {
    id: "declared-history",
    name: "Declared history",
    demo_data_status: "real_replay",
    access_status: "public_free",
    assigned_modules: ["replay_analyzer"],
  });
  assert.equal(unverifiedHistory.ok, false);
  assert.deepEqual(unverifiedHistory.errors, ["invalid:demo_data_status"]);
});

test("joins every source to one readable ontology concept and operator module", async () => {
  const integration = await import("../lib/dataIntegration.mjs");
  assert.equal(typeof integration.buildOntologyDashboardModel, "function");

  const contracts = buildSourceContracts(registry, manifest);
  const model = integration.buildOntologyDashboardModel(contracts, cityOntology);

  assert.equal(model.schema, "wellington-ontology-dashboard/v1");
  assert.equal(model.paths.length, 33);
  assert.equal(new Set(model.paths.map((path) => path.source_id)).size, 33);
  assert.deepEqual(model.concepts.map((concept) => concept.id), [
    "movement_transport",
    "hazards_warnings",
    "access_incidents",
    "lifelines_response",
    "people_demand",
  ]);
  assert.equal(model.summary.ontology_roles, 28);
  assert.equal(model.summary.operator_modules, 3);
  assert.deepEqual(model.guardrails, cityOntology.assertion_rules);

  const movement = model.paths.find((path) => path.source_id === "wcc-transport-sensors");
  assert.equal(movement.concept_id, "movement_transport");
  assert.equal(movement.ontology_role, "movement_observation");
  assert.equal(movement.operations_target, "replay_analyzer");
  assert.equal(movement.ontology_evidence_weight, 2);
  assert.equal(movement.data_2026_status, "real_records");

  const restricted = model.paths.find((path) => path.source_id === "nema-cap-alerts");
  assert.equal(restricted.concept_id, "hazards_warnings");
  assert.equal(restricted.access_status, "permission_required");
  assert.equal(restricted.ontology_evidence_weight, 0);

  const paidMock = model.paths.find((path) => path.source_id === "google-routes-api");
  assert.equal(paidMock.concept_id, "access_incidents");
  assert.equal(paidMock.operations_target, "integration_only");
  assert.equal(paidMock.demo_data_status, "mock_preview");
  assert.equal(paidMock.cost, "paid");
  assert.equal(paidMock.ontology_evidence_weight, 0);
});

test("projects only explicit ontology paths into a bounded selectable ego graph", async () => {
  const integration = await import("../lib/dataIntegration.mjs");
  assert.equal(typeof integration.buildOntologyEgoGraph, "function");
  assert.equal(typeof integration.selectOntologyGraphNode, "function");

  const graph = integration.buildOntologyEgoGraph({
    concepts: [{
      id: "movement_transport",
      label: "Movement & transport",
      description: "Counts and network status.",
      source_count: 2,
      role_count: 2,
    }],
    paths: [
      {
        source_id: "counter-1",
        source_name: "City counter",
        concept_id: "movement_transport",
        concept_label: "Movement & transport",
        ontology_role: "movement_observation",
        operations_target: "live_operations",
        alert_eligible: true,
        demo_data_status: "real_replay",
        data_2026_status: "real_records",
        access_status: "public_free",
        cost: "free",
        ontology_evidence_weight: 2,
      },
      {
        source_id: "route-mock",
        source_name: "Commercial route preview",
        concept_id: "movement_transport",
        concept_label: "Movement & transport",
        ontology_role: "movement_context",
        operations_target: "integration_only",
        alert_eligible: false,
        demo_data_status: "mock_preview",
        data_2026_status: "mock_only",
        access_status: "key_required",
        cost: "paid",
        ontology_evidence_weight: 0,
      },
    ],
  }, "movement_transport");

  assert.equal(graph.schema, "wellington-ontology-ego-graph/v1");
  assert.deepEqual(graph.nodes.map((node) => node.id).sort(), [
    "authority:human_decision",
    "concept:movement_transport",
    "destination:alert_centre",
    "destination:integration_only",
    "destination:live_operations",
    "source:counter-1",
    "source:route-mock",
  ]);
  assert.deepEqual(graph.edges.map((edge) => `${edge.source}|${edge.relation}|${edge.target}`).sort(), [
    "destination:alert_centre|reviewed_by|authority:human_decision",
    "source:counter-1|eligible_for_review|destination:alert_centre",
    "source:counter-1|typed_as|concept:movement_transport",
    "source:counter-1|used_in|destination:live_operations",
    "source:route-mock|typed_as|concept:movement_transport",
    "source:route-mock|used_in|destination:integration_only",
  ]);
  assert.ok(graph.edges.every((edge) => edge.basis === "explicit_contract"));

  const selected = integration.selectOntologyGraphNode(graph, "source:route-mock");
  assert.equal(selected.node.label, "Commercial route preview");
  assert.equal(selected.node.evidence_weight, 0);
  assert.deepEqual(selected.edges.map((edge) => edge.relation).sort(), ["typed_as", "used_in"]);
  assert.deepEqual(selected.neighbors.map((node) => node.id).sort(), [
    "concept:movement_transport",
    "destination:integration_only",
  ]);
});

test("projects ontology-aware late fusion with fixed training and authority boundaries", async () => {
  const integration = await import("../lib/dataIntegration.mjs");
  assert.equal(typeof integration.buildOntologyFusionArchitecture, "function");

  const model = integration.buildOntologyDashboardModel(
    buildSourceContracts(registry, manifest),
    cityOntology,
  );
  const graph = integration.buildOntologyFusionArchitecture(model, "movement_transport");

  assert.equal(graph.schema, "wellington-ontology-fusion-architecture/v1");
  assert.deepEqual(graph.layers.map((layer) => layer.id), [
    "experts",
    "alignment",
    "ontology",
    "fusion",
    "candidate",
    "decision",
  ]);
  const experts = graph.layers[0].nodes.filter((node) => node.kind === "expert");
  assert.deepEqual(experts.map((node) => [
    node.id,
    node.training_mode,
    node.fusion_role,
  ]), [
    ["expert:hydrology", "train_domain_model", "eligible"],
    ["expert:movement", "train_domain_model", "eligible"],
    ["expert:official-status", "rules_not_training", "eligible"],
    ["expert:reports", "train_after_labels", "human_review"],
  ]);
  assert.ok(!graph.layers[0].nodes.some((node) => node.id === "expert:planned-context"));
  assert.ok(!graph.layers[0].nodes.some((node) => node.id === "expert:post-event-news"));
  assert.ok(graph.layers[0].nodes.some((node) => node.id === "source:wcc-transport-sensors"));
  assert.ok(graph.layers[2].nodes.some((node) => (
    node.id === "ontology:semantic-contract"
      && node.training_mode === "not_trainable"
      && node.score_weight === null
  )));
  assert.ok(graph.layers[3].nodes.some((node) => (
    node.id === "model:late-fusion"
      && node.training_mode === "out_of_fold_event_blocked"
      && node.status === "prototype_not_trained"
  )));
  assert.ok(graph.layers[4].nodes.some((node) => (
    node.id === "llm:explanation"
      && node.score_weight === 0
      && node.fusion_role === "explanation_only"
  )));
  assert.ok(graph.layers[4].nodes.some((node) => (
    node.id === "expert:planned-context"
      && node.fusion_role === "context_only"
  )));
  assert.ok(graph.layers[4].nodes.some((node) => (
    node.id === "expert:post-event-news"
      && node.fusion_role === "ground_truth_only"
  )));
  assert.deepEqual(graph.guardrails, {
    ontology_training: "not_trainable",
    llm_score_weight: 0,
    mock_training: "excluded",
    post_event_input: "ground_truth_only",
    release_authority: "human_only",
  });
  assert.deepEqual(graph.connections.map((connection) => (
    `${connection.source}|${connection.target}|${connection.basis}`
  )), [
    "experts|alignment|ontology_aware_fusion",
    "alignment|ontology|ontology_aware_fusion",
    "ontology|fusion|ontology_aware_fusion",
    "fusion|candidate|ontology_aware_fusion",
    "candidate|decision|ontology_aware_fusion",
  ]);
  assert.ok(graph.layers.every((layer) => layer.nodes.length > 0));
  assert.ok(graph.layers[2].nodes.some((node) => node.id === "concept:movement_transport"));
  assert.ok(graph.layers[5].nodes.some((node) => node.id === "authority:human_decision"));
});

test("keeps ontology graph zoom on usable ten-percent steps", async () => {
  const integration = await import("../lib/dataIntegration.mjs");
  assert.equal(typeof integration.clampOntologyGraphZoom, "function");
  assert.equal(typeof integration.stepOntologyGraphZoom, "function");

  assert.equal(integration.clampOntologyGraphZoom(41), 60);
  assert.equal(integration.clampOntologyGraphZoom(166), 160);
  assert.equal(integration.clampOntologyGraphZoom(Number.NaN), 100);
  assert.equal(integration.stepOntologyGraphZoom(100, -1), 90);
  assert.equal(integration.stepOntologyGraphZoom(100, 1), 110);
  assert.equal(integration.stepOntologyGraphZoom(60, -1), 60);
  assert.equal(integration.stepOntologyGraphZoom(160, 1), 160);
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

test("promotes report and sensor corroboration while suppressing standalone road noise", () => {
  const snapshot = {
    schema: "wellington-live-snapshot/v1",
    generated_at: "2026-08-10T01:02:00.000Z",
    sources: [
      { source_id: "wcc-ticket-detail", name: "WCC reports", role: "public_report_observation", runtime_state: "live", alert_eligible: true },
      { source_id: "gwrc-hilltop", name: "Greater Wellington Hilltop", role: "hazard_observation", runtime_state: "live", alert_eligible: true },
      { source_id: "nzta-road-events", name: "NZTA road events", role: "official_event_observation", runtime_state: "live", alert_eligible: true },
      { source_id: "wcc-event-calendar", name: "WCC event calendar", role: "planned_demand_context", runtime_state: "mock", alert_eligible: false, provider_envelope: PROVIDER_FIXTURES["wcc-event-calendar"] },
      { source_id: "wellington-airport-flights", name: "Wellington Airport", role: "transport_status_observation", runtime_state: "mock", alert_eligible: false, provider_envelope: PROVIDER_FIXTURES["wellington-airport-flights"] },
      { source_id: "centreport-cruise-schedule", name: "CentrePort cruise", role: "planned_demand_context", runtime_state: "mock", alert_eligible: false, provider_envelope: PROVIDER_FIXTURES["centreport-cruise-schedule"] },
    ],
    observations: [
      {
        id: "report:1", source_id: "wcc-ticket-detail", kind: "public_report_observation",
        observed_at: "2026-08-10T01:00:00.000Z", received_at: "2026-08-10T01:02:00.000Z",
        freshness_state: "fresh", evidence_weight: 1, is_synthetic: false,
        geometry: { type: "Point", coordinates: [174.776, -41.286] }, properties: { category: "Flooding", title: "Flooding reported" },
      },
      {
        id: "sensor:1", source_id: "gwrc-hilltop", kind: "sensor_anomaly",
        observed_at: "2026-08-10T00:58:00.000Z", received_at: "2026-08-10T01:02:00.000Z",
        freshness_state: "fresh", evidence_weight: 1, is_synthetic: false,
        geometry: { type: "Point", coordinates: [174.777, -41.286] }, properties: { candidate: true, title: "Rainfall sensor change" },
      },
      {
        id: "road:1", source_id: "nzta-road-events", kind: "road_event_observation",
        observed_at: "2026-08-10T00:59:00.000Z", received_at: "2026-08-10T01:02:00.000Z",
        freshness_state: "fresh", evidence_weight: 2, is_synthetic: false,
        geometry: { type: "Point", coordinates: [174.9, -41.2] }, properties: { name: "Unplanned road delay", impact: "Delays", is_planned: false },
      },
    ],
  };

  const alerts = createAlertCandidates(snapshot);
  assert.equal(alerts.candidates.length, 1);
  assert.equal(alerts.candidates[0].triage.promotion_reason, "report_and_sensor");
  assert.deepEqual(alerts.candidates[0].evidence.supporting, ["report:1", "sensor:1"]);
  assert.doesNotMatch(JSON.stringify(alerts), /road:1/);

  const inbox = buildEvidenceInbox(snapshot);
  assert.equal(inbox.schema, "wellington-evidence-inbox/v1");
  assert.equal(inbox.review_candidate_count, 1);
  assert.equal(inbox.raw_observation_count, 3);
  assert.equal(inbox.suppressed_observation_count, 1);
  assert.deepEqual(inbox.context_cards.map((card) => card.source_id), [
    "wcc-event-calendar",
    "wellington-airport-flights",
    "centreport-cruise-schedule",
  ]);
  assert.ok(inbox.context_cards.every((card) => card.evidence_weight === 0));
  assert.equal(inbox.monitoring_groups.find((group) => group.id === "sensors_weather").record_count, 1);
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

test("publishes the complete privacy-safe WCC TICKET_DETAIL mock envelope", () => {
  const [ticket] = PROVIDER_FIXTURES["wcc-ticket-detail"];
  assert.deepEqual(Object.keys(ticket).filter((key) => !key.startsWith("_")).sort(), [
    "CLOSED_AT", "CREATED_AT", "CURRENT_STATUS", "DUE_BY_TIME", "GROUP_NAME",
    "INCIDENT_ADDRESS", "LATITUDE", "LOCATION", "LONGITUDE", "PRIORITY",
    "REQUESTER_NAME", "SERVICE_ITEM", "SERVICE_ITEM_L2", "SOURCE_DERIVED",
    "TICKET_DESCRIPTION", "TICKET_ID", "TICKET_TAGS", "TRIAGED_AT",
  ].sort());
  assert.equal(ticket.REQUESTER_NAME, null);
  assert.equal(ticket.INCIDENT_ADDRESS, null);
  assert.equal(ticket.TICKET_DESCRIPTION, null);
});
