import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildLiveSnapshot,
  buildSourceContracts,
  createAlertCandidates,
} from "../lib/dataIntegration.mjs";
import { isActiveProviderEvent, normaliseProviderTime, parseRssObservations } from "../lib/liveAdapters.mjs";
import { PROVIDER_FIXTURES } from "../lib/providerFixtures.mjs";

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

test("projects one concept through six ordered display layers without creating evidence", async () => {
  const integration = await import("../lib/dataIntegration.mjs");
  assert.equal(typeof integration.buildOntologyLayerGraph, "function");

  const model = integration.buildOntologyDashboardModel(
    buildSourceContracts(registry, manifest),
    cityOntology,
  );
  const graph = integration.buildOntologyLayerGraph(model, "movement_transport");

  assert.equal(graph.schema, "wellington-ontology-layer-graph/v1");
  assert.deepEqual(graph.layers.map((layer) => layer.id), [
    "sources",
    "alignment",
    "ontology",
    "corroboration",
    "destinations",
    "decision",
  ]);
  assert.deepEqual(graph.layers.map((layer) => layer.change), [
    "Records enter with source truth",
    "Records become comparable",
    "Records gain shared meaning",
    "Signals become review candidates",
    "Candidates reach operator modules",
    "Staff decide and authorise response",
  ]);
  assert.deepEqual(graph.connections.map((connection) => (
    `${connection.source}|${connection.target}|${connection.basis}`
  )), [
    "sources|alignment|display_pipeline",
    "alignment|ontology|display_pipeline",
    "ontology|corroboration|display_pipeline",
    "corroboration|destinations|display_pipeline",
    "destinations|decision|display_pipeline",
  ]);
  assert.ok(graph.layers.every((layer) => layer.nodes.length > 0));
  assert.ok(graph.layers[0].nodes.every((node) => node.kind === "source"));
  assert.ok(graph.layers[0].nodes.some((node) => node.id === "source:wcc-transport-sensors"));
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
