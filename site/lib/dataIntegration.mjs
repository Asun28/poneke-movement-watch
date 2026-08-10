import { operationsTargetForConnectorMode } from "./sourceOperations.mjs";

const RUNTIME_STATES = [
  "live",
  "mock",
  "empty",
  "stale",
  "credentials_required",
  "permission_required",
  "unavailable",
];

const ONTOLOGY_CONCEPTS = [
  {
    id: "movement_transport",
    label: "Movement & transport",
    description: "Counts, public transport and network status.",
    roles: [
      "movement_observation",
      "movement_context",
      "public_transport_observation",
      "transport_network_context",
      "transport_status_observation",
    ],
  },
  {
    id: "hazards_warnings",
    label: "Hazards & warnings",
    description: "Measurements, footprints and official alerts.",
    roles: [
      "hazard_observation",
      "hazard_alert_observation",
      "hazard_measurement_observation",
      "hazard_footprint_observation",
      "official_alert_observation",
    ],
  },
  {
    id: "access_incidents",
    label: "Access & incidents",
    description: "Road, rail, place and incident-area access.",
    roles: [
      "official_event_observation",
      "official_access_event_observation",
      "planned_access_context",
      "official_incident_area_observation",
      "visual_access_context",
      "official_access_notice_context",
      "planned_rail_access_context",
      "commercial_route_context",
      "place_accessibility_context",
    ],
  },
  {
    id: "lifelines_response",
    label: "Lifelines & response",
    description: "Community reports, lifelines and response capability.",
    roles: [
      "public_report_observation",
      "lifeline_work_observation",
      "lifeline_impact_observation",
      "response_authority_context",
      "lifeline_capability_context",
      "response_capability_observation",
      "emergency_response_context",
    ],
  },
  {
    id: "people_demand",
    label: "People & demand",
    description: "Potential impact and planned city demand.",
    roles: [
      "impact_context",
      "planned_demand_context",
    ],
  },
];

function accessContract(source) {
  const status = source.access_status ?? "unknown";
  const paid = status === "paid_key_required";
  const credentialsRequired = paid || status === "key_required";
  const permissionRequired = [
    "permission_required",
    "publisher_clearance_required",
    "council_input_required",
  ].includes(status);

  return {
    status,
    cost: paid ? "paid" : status === "public_free" ? "free" : "unknown",
    credentials_required: credentialsRequired,
    permission_required: permissionRequired,
  };
}

function inferConnectorMode(source) {
  if (source.availability === "batch_replay") return "batch";
  if (source.data_2026?.status === "stale_excluded") return "stale";
  if (source.access_status === "public_free" && source.endpoint) return "registered";
  if (source.demo_data_status === "mock_preview") return "mock";
  return "context";
}

function runtimeDefault(mode, access) {
  if (mode === "live") return "empty";
  if (mode === "mock") return "mock";
  if (mode === "batch" || mode === "stale") return "stale";
  if (access.credentials_required) return "credentials_required";
  if (access.permission_required) return "permission_required";
  return "unavailable";
}

export function buildSourceContracts(registry, manifest = {}) {
  const sources = registry.sources.map((source) => {
    const declared = manifest[source.id] ?? {};
    const access = accessContract(source);
    const connectorMode = declared.connector_mode ?? inferConnectorMode(source);
    const alertEligible = connectorMode === "live" && declared.alert_eligible === true;

    return {
      schema: "wellington-provider-contract/v1",
      source_id: source.id,
      name: source.name,
      role: source.role,
      source_version: declared.source_version ?? "2026-08-10",
      connector_mode: connectorMode,
      operations_target: operationsTargetForConnectorMode(connectorMode),
      runtime_default: runtimeDefault(connectorMode, access),
      access,
      endpoint: declared.endpoint ?? source.endpoint ?? null,
      raw_format: declared.raw_format ?? "Not connected",
      freshness_seconds: declared.freshness_seconds ?? null,
      stale_budget_seconds: declared.stale_budget_seconds
        ?? (declared.freshness_seconds ? declared.freshness_seconds * 2 : null),
      spatial_scope: declared.spatial_scope ?? "Wellington region or provider-defined scope",
      geometry_type: declared.geometry_type ?? "provider_defined",
      alert_eligible: alertEligible,
      evidence_weight: alertEligible ? (declared.evidence_weight ?? 1) : 0,
      attribution: declared.attribution ?? source.name,
      licence: source.licence ?? declared.licence ?? "not_stated",
      truth: {
        source_reality: source.source_reality,
        demo_data_status: source.demo_data_status,
        data_2026_status: source.data_2026?.status ?? "unknown",
      },
      notes: declared.notes ?? source.temporal_alignment ?? null,
    };
  });

  return {
    schema: "wellington-integration-contracts/v1",
    generated_from: registry.schema,
    verified_at: registry.verified_at,
    runtime_states: RUNTIME_STATES,
    sources,
  };
}

export function buildOntologyDashboardModel(contracts, ontology) {
  const layers = ontology.nodes.filter((node) => node.type === "DataLayer");
  const layerBySource = new Map(layers.map((layer) => [layer.source_id, layer]));
  const conceptByRole = new Map(
    ONTOLOGY_CONCEPTS.flatMap((concept) => concept.roles.map((role) => [role, concept])),
  );

  const paths = contracts.sources.map((contract) => {
    const layer = layerBySource.get(contract.source_id);
    if (!layer) throw new Error(`Ontology dashboard requires DataLayer ${contract.source_id}`);
    const concept = conceptByRole.get(layer.ontology_role);
    if (!concept) throw new Error(`Ontology dashboard requires a concept for ${layer.ontology_role}`);

    return {
      source_id: contract.source_id,
      source_name: contract.name,
      concept_id: concept.id,
      concept_label: concept.label,
      ontology_role: layer.ontology_role,
      operations_target: contract.operations_target,
      alert_eligible: contract.alert_eligible,
      connector_mode: contract.connector_mode,
      runtime_default: contract.runtime_default,
      source_reality: layer.source_reality,
      demo_data_status: layer.demo_data_status,
      data_2026_status: layer.data_2026?.status ?? "unknown",
      access_status: layer.access_status,
      cost: contract.access.cost,
      ontology_evidence_weight: layer.evidence_weight ?? 0,
      can_support: layer.can_support ?? [],
      cannot_assert: layer.cannot_assert ?? [],
    };
  });

  const pathCounts = Object.fromEntries(
    ONTOLOGY_CONCEPTS.map((concept) => [
      concept.id,
      paths.filter((path) => path.concept_id === concept.id).length,
    ]),
  );

  return {
    schema: "wellington-ontology-dashboard/v1",
    generated_from: {
      source_contracts: contracts.schema,
      city_ontology: ontology.schema,
    },
    summary: {
      sources: paths.length,
      ontology_roles: new Set(paths.map((path) => path.ontology_role)).size,
      concepts: ONTOLOGY_CONCEPTS.length,
      operator_modules: 3,
      real_record_layers: paths.filter((path) => path.data_2026_status === "real_records").length,
      zero_weight_layers: paths.filter((path) => path.ontology_evidence_weight === 0).length,
    },
    concepts: ONTOLOGY_CONCEPTS.map(({ roles, ...concept }) => ({
      ...concept,
      role_count: roles.length,
      source_count: pathCounts[concept.id],
    })),
    semantic_relations: ontology.allowed_relation_types,
    guardrails: ontology.assertion_rules,
    paths,
  };
}

const ONTOLOGY_GRAPH_DESTINATIONS = {
  live_operations: {
    label: "Live Operations",
    description: "Current permitted records",
  },
  alert_centre: {
    label: "Alert Centre",
    description: "Review-eligible candidates",
  },
  replay_analyzer: {
    label: "Replay Analyzer",
    description: "Packaged historical records",
  },
  integration_only: {
    label: "Integration only",
    description: "Context, gated or mock",
  },
};

export function buildOntologyEgoGraph(model, conceptId) {
  const concept = model?.concepts?.find((item) => item.id === conceptId);
  if (!concept) throw new Error(`Ontology ego graph requires concept ${conceptId}`);

  const paths = model.paths.filter((path) => path.concept_id === concept.id);
  const destinationIds = new Set(paths.map((path) => path.operations_target));
  if (paths.some((path) => path.alert_eligible)) destinationIds.add("alert_centre");

  const nodes = [
    {
      id: `concept:${concept.id}`,
      kind: "concept",
      label: concept.label,
      description: concept.description,
      source_count: paths.length,
      role_count: concept.role_count,
    },
    ...paths.map((path) => ({
      id: `source:${path.source_id}`,
      kind: "source",
      label: path.source_name,
      source_id: path.source_id,
      ontology_role: path.ontology_role,
      demo_data_status: path.demo_data_status,
      data_2026_status: path.data_2026_status,
      access_status: path.access_status,
      cost: path.cost,
      evidence_weight: path.ontology_evidence_weight,
      alert_eligible: path.alert_eligible,
    })),
    ...[...destinationIds].map((id) => ({
      id: `destination:${id}`,
      kind: "destination",
      destination_id: id,
      label: ONTOLOGY_GRAPH_DESTINATIONS[id]?.label ?? id,
      description: ONTOLOGY_GRAPH_DESTINATIONS[id]?.description ?? "Registered destination",
      source_count: paths.filter((path) => (
        id === "alert_centre" ? path.alert_eligible : path.operations_target === id
      )).length,
    })),
    {
      id: "authority:human_decision",
      kind: "authority",
      label: "Human confirmation & response",
      description: "Staff confirm incidents and authorise external actions.",
    },
  ];

  const edges = paths.flatMap((path) => {
    const source = `source:${path.source_id}`;
    const explicitEdges = [
      {
        id: `${source}|typed_as|concept:${concept.id}`,
        source,
        target: `concept:${concept.id}`,
        relation: "typed_as",
        label: `typed as ${path.ontology_role.replaceAll("_", " ")}`,
        basis: "explicit_contract",
      },
      {
        id: `${source}|used_in|destination:${path.operations_target}`,
        source,
        target: `destination:${path.operations_target}`,
        relation: "used_in",
        label: "used in",
        basis: "explicit_contract",
      },
    ];
    if (path.alert_eligible) {
      explicitEdges.push({
        id: `${source}|eligible_for_review|destination:alert_centre`,
        source,
        target: "destination:alert_centre",
        relation: "eligible_for_review",
        label: "eligible for review",
        basis: "explicit_contract",
      });
    }
    return explicitEdges;
  });

  if (destinationIds.has("alert_centre")) {
    edges.push({
      id: "destination:alert_centre|reviewed_by|authority:human_decision",
      source: "destination:alert_centre",
      target: "authority:human_decision",
      relation: "reviewed_by",
      label: "reviewed by",
      basis: "explicit_contract",
    });
  }

  return {
    schema: "wellington-ontology-ego-graph/v1",
    concept_id: concept.id,
    nodes,
    edges,
  };
}

const ONTOLOGY_GRAPH_ZOOM = Object.freeze({ min: 60, max: 160, step: 10, initial: 100 });

export function clampOntologyGraphZoom(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return ONTOLOGY_GRAPH_ZOOM.initial;
  const stepped = Math.round(numeric / ONTOLOGY_GRAPH_ZOOM.step) * ONTOLOGY_GRAPH_ZOOM.step;
  return Math.min(ONTOLOGY_GRAPH_ZOOM.max, Math.max(ONTOLOGY_GRAPH_ZOOM.min, stepped));
}

export function stepOntologyGraphZoom(current, direction) {
  const delta = Math.sign(Number(direction)) * ONTOLOGY_GRAPH_ZOOM.step;
  return clampOntologyGraphZoom(clampOntologyGraphZoom(current) + delta);
}

export function buildOntologyLayerGraph(model, conceptId) {
  const concept = model?.concepts?.find((item) => item.id === conceptId);
  if (!concept) throw new Error(`Ontology layer graph requires concept ${conceptId}`);

  const paths = model.paths.filter((path) => path.concept_id === concept.id);
  const destinations = new Set(paths.map((path) => path.operations_target));
  if (paths.some((path) => path.alert_eligible)) destinations.add("alert_centre");
  const roles = [...new Set(paths.map((path) => path.ontology_role))];

  const layers = [
    {
      id: "sources",
      number: "01",
      label: "Sources",
      description: "Access and source truth",
      change: "Records enter with source truth",
      nodes: paths.map((path) => ({
        id: `source:${path.source_id}`,
        kind: "source",
        label: path.source_name,
        detail: path.ontology_role.replaceAll("_", " "),
      })),
    },
    {
      id: "alignment",
      number: "02",
      label: "Alignment",
      description: "Normalize time and place",
      change: "Records become comparable",
      nodes: [
        { id: "alignment:schema", kind: "alignment", label: "Schema", detail: "Common fields and units" },
        { id: "alignment:time", kind: "alignment", label: "Time", detail: "Observed · available · valid" },
        { id: "alignment:place", kind: "alignment", label: "Place", detail: "WGS84 · area · asset" },
      ],
    },
    {
      id: "ontology",
      number: "03",
      label: "Ontology",
      description: "Entities, relations and rules",
      change: "Records gain shared meaning",
      nodes: [
        { id: `concept:${concept.id}`, kind: "concept", label: concept.label, detail: concept.description },
        ...roles.map((role) => ({
          id: `role:${role}`,
          kind: "role",
          label: role.replaceAll("_", " "),
          detail: "Explicit source role",
        })),
      ],
    },
    {
      id: "corroboration",
      number: "04",
      label: "Corroboration",
      description: "Candidate and evidence states",
      change: "Signals become review candidates",
      nodes: [
        { id: "corroboration:candidate", kind: "candidate", label: "Candidate", detail: "Not a confirmed incident" },
        { id: "corroboration:supporting", kind: "evidence", label: "Supporting", detail: "Same time and place" },
        { id: "corroboration:contradicting", kind: "evidence", label: "Contradicting", detail: "Keep disagreement visible" },
        { id: "corroboration:missing", kind: "evidence", label: "Missing", detail: "Absence is not contradiction" },
      ],
    },
    {
      id: "destinations",
      number: "05",
      label: "Modules",
      description: "Live, Alerts and Replay",
      change: "Candidates reach operator modules",
      nodes: [...destinations].map((id) => ({
        id: `destination:${id}`,
        kind: "destination",
        label: ONTOLOGY_GRAPH_DESTINATIONS[id]?.label ?? id,
        detail: ONTOLOGY_GRAPH_DESTINATIONS[id]?.description ?? "Registered destination",
      })),
    },
    {
      id: "decision",
      number: "06",
      label: "Human decision",
      description: "Confirmation and response",
      change: "Staff decide and authorise response",
      nodes: [
        { id: "decision:review", kind: "decision", label: "Investigate", detail: "Review the case" },
        { id: "authority:human_decision", kind: "authority", label: "Confirm", detail: "Set incident status" },
        { id: "decision:act", kind: "decision", label: "Authorise", detail: "Approve external response" },
      ],
    },
  ];

  return {
    schema: "wellington-ontology-layer-graph/v1",
    concept_id: concept.id,
    layers,
    connections: layers.slice(0, -1).map((layer, index) => ({
      source: layer.id,
      target: layers[index + 1].id,
      basis: "display_pipeline",
    })),
  };
}

export function selectOntologyGraphNode(graph, nodeId) {
  const node = graph.nodes.find((item) => item.id === nodeId);
  if (!node) return null;
  const edges = graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
  const neighborIds = new Set(edges.map((edge) => (
    edge.source === nodeId ? edge.target : edge.source
  )));
  return {
    node,
    edges,
    neighbors: graph.nodes.filter((item) => neighborIds.has(item.id)),
  };
}

function freshnessState(observedAt, now, freshnessSeconds) {
  if (!observedAt || !freshnessSeconds) return "unknown";
  const ageMs = now.getTime() - new Date(observedAt).getTime();
  if (!Number.isFinite(ageMs)) return "unknown";
  return ageMs <= freshnessSeconds * 1000 ? "fresh" : "stale";
}

function unavailableSource(contract, message) {
  return {
    source_id: contract.source_id,
    name: contract.name,
    connector_mode: contract.connector_mode,
    runtime_state: "unavailable",
    record_count: 0,
    evidence_weight: 0,
    alert_eligible: false,
    observed_at: null,
    received_at: null,
    message: `${contract.name} is temporarily unavailable. ${message}`.trim(),
  };
}

function dormantSource(contract, mockFixtures) {
  const messageByState = {
    mock: "Provider-shaped demonstration data only; zero evidence weight.",
    stale: "The available source is outside its current freshness window.",
    credentials_required: "An API credential is required before this connector can run.",
    permission_required: "Authorised access or publisher clearance is required.",
    unavailable: "The source contract is registered but no live connector is enabled.",
  };
  const state = contract.runtime_default;
  return {
    source_id: contract.source_id,
    name: contract.name,
    connector_mode: contract.connector_mode,
    runtime_state: state,
    record_count: 0,
    evidence_weight: 0,
    alert_eligible: false,
    observed_at: null,
    received_at: null,
    message: messageByState[state] ?? "No current records.",
    ...(state === "mock" && mockFixtures[contract.source_id]
      ? { provider_envelope: mockFixtures[contract.source_id] }
      : {}),
  };
}

export async function buildLiveSnapshot({
  contracts,
  adapters = {},
  mockFixtures = {},
  now = new Date(),
}) {
  const receivedAt = now.toISOString();
  const results = await Promise.all(contracts.sources.map(async (contract) => {
    if (contract.connector_mode !== "live") {
      return { source: dormantSource(contract, mockFixtures), observations: [] };
    }

    const adapter = adapters[contract.source_id];
    if (!adapter) {
      return {
        source: unavailableSource(contract, "No adapter is configured."),
        observations: [],
      };
    }

    try {
      const result = await adapter({ contract, now });
      const observations = (result.observations ?? []).map((observation) => ({
        ...observation,
        source_id: contract.source_id,
        received_at: receivedAt,
        freshness_state: freshnessState(
          observation.observed_at,
          now,
          contract.freshness_seconds,
        ),
        evidence_weight: contract.evidence_weight,
        is_synthetic: false,
      }));
      const stale = observations.length > 0
        && observations.every((observation) => observation.freshness_state === "stale");
      const runtimeState = stale ? "stale" : observations.length > 0 ? "live" : "empty";
      const observedTimes = observations
        .map((observation) => observation.observed_at)
        .filter(Boolean)
        .sort();

      return {
        source: {
          source_id: contract.source_id,
          name: contract.name,
          connector_mode: contract.connector_mode,
          runtime_state: runtimeState,
          record_count: observations.length,
          raw_record_count: result.raw_record_count ?? observations.length,
          evidence_weight: runtimeState === "live" ? contract.evidence_weight : 0,
          alert_eligible: runtimeState === "live" && contract.alert_eligible,
          observed_at: observedTimes.at(-1) ?? null,
          received_at: receivedAt,
          message: runtimeState === "empty"
            ? "No current records from this connected source."
            : runtimeState === "stale"
              ? "Records were received but are outside the source freshness window."
              : "Current records received.",
          ...(result.health ? { provider_health: result.health } : {}),
        },
        observations,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown upstream error.";
      return { source: unavailableSource(contract, detail), observations: [] };
    }
  }));

  const sources = results.map((result) => result.source);
  const observations = results.flatMap((result) => result.observations);
  const summary = Object.fromEntries(RUNTIME_STATES.map((state) => [state, 0]));
  for (const source of sources) summary[source.runtime_state] += 1;

  return {
    schema: "wellington-live-snapshot/v1",
    generated_at: receivedAt,
    source_count: sources.length,
    summary,
    sources,
    observations,
    limitations: [
      "Source unavailable or stale does not mean no incident.",
      "Mock records preserve provider shape but carry zero evidence weight.",
      "Alert candidates require human review and are not confirmed incidents.",
    ],
  };
}

function alertRule(observation) {
  if (observation.kind === "earthquake_observation") {
    const magnitude = Number(observation.properties?.magnitude ?? 0);
    const mmi = Number(observation.properties?.mmi ?? 0);
    if (magnitude < 4 && mmi < 4) return null;
    return {
      rule_id: "earthquake-investigation-v1",
      title: `Earthquake signal M${magnitude.toFixed(1)}`,
      severity: magnitude >= 6 || mmi >= 6 ? "high" : "moderate",
      missing: ["movement_sensor_change", "official_access_change"],
    };
  }
  if (["official_alert_observation", "hazard_alert_observation"].includes(observation.kind)) {
    const area = String(observation.properties?.area_description ?? "").toLowerCase();
    const namesLocalArea = ["wellington", "porirua", "lower hutt", "upper hutt", "kapiti"]
      .some((name) => area.includes(name));
    if (!observation.geometry && !namesLocalArea) return null;
    return {
      rule_id: "official-alert-active-v1",
      title: observation.properties?.headline ?? "Active official alert",
      severity: String(observation.properties?.severity ?? "moderate").toLowerCase(),
      missing: ["local_impact_observation"],
    };
  }
  if (["official_access_event_observation", "road_event_observation"].includes(observation.kind)) {
    if (observation.properties?.is_planned === true) return null;
    return {
      rule_id: "official-access-change-v1",
      title: observation.properties?.name ?? "Official access change",
      severity: observation.properties?.impact === "Road Closed" ? "high" : "moderate",
      missing: ["movement_sensor_change"],
    };
  }
  if (observation.kind === "sensor_anomaly" && observation.properties?.candidate === true) {
    return {
      rule_id: "pretrained-sensor-monitor-v1",
      title: observation.properties?.title ?? "Movement sensor change",
      severity: observation.properties?.severity ?? "moderate",
      missing: ["independent_current_source"],
    };
  }
  return null;
}

export function createAlertCandidates(snapshot) {
  const sourceState = new Map(snapshot.sources.map((source) => [source.source_id, source]));
  const candidates = [];

  for (const observation of snapshot.observations) {
    const source = sourceState.get(observation.source_id);
    if (
      source?.runtime_state !== "live"
      || source.alert_eligible !== true
      || observation.is_synthetic
      || observation.evidence_weight <= 0
      || observation.freshness_state !== "fresh"
    ) continue;

    const rule = alertRule(observation);
    if (!rule) continue;
    candidates.push({
      id: `candidate:${observation.id}`,
      alert_schema: "wellington-alert-candidate/v1",
      created_at: snapshot.generated_at,
      observed_at: observation.observed_at,
      source_id: observation.source_id,
      title: rule.title,
      severity: rule.severity,
      rule_id: rule.rule_id,
      review_state: "unreviewed",
      epistemic_state: "inference",
      decision_authority: "human",
      geometry: observation.geometry ?? null,
      evidence: {
        supporting: [observation.id],
        contradicting: [],
        missing: rule.missing,
        context: [],
      },
      ontology: {
        subject: observation.kind,
        relation: "may_affect",
        object: "city_access_or_movement",
      },
      sensor_monitor: {
        state: observation.kind === "sensor_anomaly" ? "candidate" : "not_applicable",
        authority: "candidate_only",
      },
      llm: {
        state: "not_configured",
        authority: "explanation_only",
        can_publish: false,
      },
      confirmed_facts: [],
    });
  }

  return {
    schema: "wellington-alert-candidates/v1",
    generated_at: snapshot.generated_at,
    count: candidates.length,
    candidates,
  };
}
