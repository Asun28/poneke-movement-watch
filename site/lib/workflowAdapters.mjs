export const WORKFLOW_ADAPTERS = [
  { id: "wcc-ticket", name: "WCC ticket", target: "WCC ticket system", contract_status: "supplied_field_contract" },
  { id: "replay-case-handoff", name: "Replay Analyzer handoff", target: "Replay Analyzer", contract_status: "internal_demo_contract" },
  { id: "wcc-field-dispatch", name: "WCC field dispatch", target: "WCC field response", contract_status: "authorised_interface_required" },
  { id: "wcc-leadership-notification", name: "Leadership notification", target: "WCC leadership", contract_status: "authorised_interface_required" },
  { id: "civil-defence-nema-escalation", name: "Civil Defence / NEMA escalation", target: "Authorised agency coordination", contract_status: "authorised_interface_required" },
  { id: "public-warning-social", name: "Public warning / social media", target: "WCC public communications", contract_status: "authorised_interface_required" },
];

function cleanText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normaliseCase(input = {}) {
  return {
    case_id: cleanText(input.case_id, "mock-case"),
    title: cleanText(input.title, "Potential city disruption requires investigation"),
    severity: cleanText(input.severity, "unassigned"),
    source_id: cleanText(input.source_id, "unknown-source"),
    observed_at: cleanText(input.observed_at, null),
    affected_area: cleanText(input.affected_area, "Wellington impact area"),
  };
}

function wccPriority(severity) {
  if (severity === "high" || severity === "critical") return 1;
  if (severity === "moderate") return 2;
  if (severity === "low") return 3;
  return 4;
}

function ticketId(caseId) {
  return `MOCK-WCC-${caseId.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase()}`;
}

function buildProviderPayload(adapterId, caseRecord, now) {
  if (adapterId === "wcc-ticket") {
    return {
      TICKET_ID: ticketId(caseRecord.case_id),
      INCIDENT_ADDRESS: null,
      LOCATION: caseRecord.affected_area,
      LONGITUDE: null,
      LATITUDE: null,
      CREATED_AT: now.toISOString(),
      TRIAGED_AT: now.toISOString(),
      DUE_BY_TIME: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      CURRENT_STATUS: "OPEN",
      CLOSED_AT: null,
      SERVICE_ITEM: "Weather Event",
      SERVICE_ITEM_L2: "Flooding",
      TICKET_DESCRIPTION: null,
      PRIORITY: wccPriority(caseRecord.severity),
      GROUP_NAME: "Emergency Management (mock)",
      REQUESTER_NAME: null,
      SOURCE_DERIVED: "Website",
      TICKET_TAGS: ["Weather Event", caseRecord.affected_area, "escalation"],
    };
  }
  if (adapterId === "replay-case-handoff") {
    return {
      case_id: caseRecord.case_id,
      mode: "case_investigation",
      replay_url: `/replay?case=${encodeURIComponent(caseRecord.case_id)}&source=${encodeURIComponent(caseRecord.source_id)}#history-replay`,
      window: { starts_at: caseRecord.observed_at, ends_at: now.toISOString() },
      selected_sources: [caseRecord.source_id],
      evidence_policy: "available_at_only",
    };
  }
  if (adapterId === "wcc-field-dispatch") {
    return {
      case_id: caseRecord.case_id,
      queue: "WCC emergency field response",
      priority: wccPriority(caseRecord.severity),
      affected_area: caseRecord.affected_area,
      requested_action: "Inspect, record conditions and report evidence",
      dispatch_state: "DRAFT_NOT_SENT",
    };
  }
  if (adapterId === "wcc-leadership-notification") {
    return {
      case_id: caseRecord.case_id,
      audience: ["Duty Controller", "WCC leadership"],
      subject: `[MOCK] ${caseRecord.title}`,
      affected_area: caseRecord.affected_area,
      approval_required: true,
      notification_state: "DRAFT_NOT_SENT",
    };
  }
  if (adapterId === "civil-defence-nema-escalation") {
    return {
      case_id: caseRecord.case_id,
      coordination_targets: ["Civil Defence", "NEMA"],
      affected_area: caseRecord.affected_area,
      authority_status: "NOT_AUTHORISED",
      authorised_channel_required: true,
      escalation_state: "DRAFT_NOT_SENT",
    };
  }
  return {
    case_id: caseRecord.case_id,
    warning: {
      headline: `[MOCK] ${caseRecord.title}`,
      affected_area: caseRecord.affected_area,
      instruction: "Draft only. Await authorised incident and communications approval.",
    },
    channels: ["WCC website", "WCC social media"],
    approval_required: ["Incident Controller", "Communications lead"],
    publication_state: "DRAFT_NOT_SENT",
  };
}

export function workflowAdapterCatalog() {
  return {
    schema: "wellington-workflow-adapters/v1",
    execution: "mock_prepare_only",
    adapters: WORKFLOW_ADAPTERS.map((adapter) => ({
      ...adapter,
      mode: "mock",
      dispatched: false,
      evidence_weight: 0,
    })),
    limitations: [
      "Preparing a mock never creates a ticket, sends a notification or publishes a warning.",
      "Non-WCC provider interfaces require an authorised specification before activation.",
    ],
  };
}

export function prepareWorkflowMock(adapterId, input, now = new Date()) {
  const adapter = WORKFLOW_ADAPTERS.find((item) => item.id === adapterId);
  if (!adapter) {
    const error = new Error("unknown_workflow_adapter");
    error.code = "unknown_workflow_adapter";
    throw error;
  }
  const preparedAt = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
  const caseRecord = normaliseCase(input);
  return {
    schema: "wellington-workflow-adapter-result/v1",
    adapter_id: adapter.id,
    adapter_name: adapter.name,
    target: adapter.target,
    contract_status: adapter.contract_status,
    mode: "mock",
    is_synthetic: true,
    dispatched: false,
    evidence_weight: 0,
    status: "prepared_not_sent",
    prepared_at: preparedAt.toISOString(),
    case: caseRecord,
    provider_payload: buildProviderPayload(adapter.id, caseRecord, preparedAt),
    privacy: {
      requester_name: "removed",
      incident_address: "withheld",
      unrestricted_description: "withheld",
    },
    authority: {
      decision: "human_only",
      external_action: "not_authorised",
    },
  };
}
