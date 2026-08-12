import { buildReplayHandoff } from "./caseWorkflow.mjs";
import {
  buildCaseName,
  buildCaseReference,
  buildSignalReference,
  buildTicketName,
  buildTicketReference,
  OPERATIONAL_REFERENCE_CONVENTIONS,
} from "./operationalIdentifiers.mjs";

export const WORKFLOW_ADAPTERS = [
  { id: "wcc-ticket", name: "WCC ticket", target: "WCC ticket system", contract_status: "supplied_field_contract" },
  { id: "replay-case-handoff", name: "Replay Analyzer handoff", target: "Replay Analyzer", contract_status: "internal_demo_contract" },
  { id: "wcc-field-dispatch", name: "WCC field dispatch", target: "WCC field response", contract_status: "authorised_interface_required" },
  { id: "wcc-leadership-notification", name: "Leadership notification", target: "WCC leadership", contract_status: "authorised_interface_required" },
  { id: "civil-defence-nema-escalation", name: "Civil Defence / NEMA escalation", target: "Authorised agency coordination", contract_status: "authorised_interface_required" },
  { id: "public-warning-social", name: "Public warning / social media", target: "WCC public communications", contract_status: "authorised_interface_required" },
];

export const WCC_TICKET_EVENT_TYPES = Object.freeze([
  "created",
  "triaged",
  "status_changed",
  "linked_to_situation",
  "link_prepared",
  "closed",
]);

const WCC_TICKET_FIELDS = Object.freeze([
  "TICKET_ID", "INCIDENT_ADDRESS", "LOCATION", "LONGITUDE", "LATITUDE",
  "CREATED_AT", "TRIAGED_AT", "DUE_BY_TIME", "CURRENT_STATUS", "CLOSED_AT",
  "SERVICE_ITEM", "SERVICE_ITEM_L2", "TICKET_DESCRIPTION", "PRIORITY", "GROUP_NAME",
  "REQUESTER_NAME", "SOURCE_DERIVED", "TICKET_TAGS",
]);

function cleanText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normaliseCase(input = {}, preparedAt) {
  const observedAt = cleanText(input.observed_at, preparedAt.toISOString());
  const caseId = cleanText(input.case_id, "mock-case");
  const title = cleanText(input.title, "Potential city disruption requires investigation");
  const affectedArea = cleanText(input.affected_area, "Wellington impact area");
  const caseRef = buildCaseReference({ canonicalId: caseId, occurredAt: observedAt });
  return {
    case_id: caseId,
    case_ref: caseRef,
    case_name: buildCaseName({ title, affectedArea }),
    title,
    severity: cleanText(input.severity, "unassigned"),
    source_id: cleanText(input.source_id, "unknown-source"),
    observed_at: observedAt,
    affected_area: affectedArea,
    as_of: cleanText(input.as_of, null),
  };
}

function wccPriority(severity) {
  if (["high", "critical", "severe", "extreme"].includes(severity)) return 1;
  if (severity === "moderate") return 2;
  if (severity === "low") return 3;
  return 4;
}

function buildProviderPayload(adapterId, caseRecord, now, references) {
  if (adapterId === "wcc-ticket") {
    return {
      TICKET_ID: `MOCK-${references.ticket}`,
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
    return buildReplayHandoff({
      case_id: caseRecord.case_id,
      source_id: caseRecord.source_id,
      starts_at: caseRecord.observed_at,
      as_of: caseRecord.as_of ?? now.toISOString(),
      evidence: [],
    });
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
    channel_preparations: ["WCC website", "WCC social media"].map((label) => ({
      label,
      status: "prepared_not_sent",
      dispatched: false,
      receipt_at: null,
      external_reference: null,
    })),
    approval_required: ["Incident Controller", "Communications lead"],
    publication_state: "DRAFT_NOT_SENT",
  };
}

export function workflowAdapterCatalog() {
  return {
    schema: "wellington-workflow-adapters/v1",
    reference_conventions: OPERATIONAL_REFERENCE_CONVENTIONS,
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

export function wccTicketEventContract() {
  return {
    schema: "wellington-wcc-ticket-event-contract/v1",
    mode: "mock",
    connector_state: "disconnected_demo",
    directions: ["inbound", "outbound"],
    event_types: WCC_TICKET_EVENT_TYPES,
    provider_fields: WCC_TICKET_FIELDS,
    execution: "browser_or_request_scoped_simulation",
    external_effect: "none",
    limitations: [
      "No WCC endpoint, authentication, receipt or external write is available.",
      "Provider fields use the supplied contract; simulator metadata stays outside the provider snapshot.",
      "Mock events have zero evidence weight and cannot become training labels.",
    ],
  };
}

export function simulateWccTicketEvent(input = {}, now = new Date()) {
  const direction = cleanText(input.direction, "");
  const eventType = cleanText(input.event_type, "");
  if (!["inbound", "outbound"].includes(direction)) {
    const error = new TypeError("invalid_wcc_ticket_direction");
    error.code = "invalid_wcc_ticket_direction";
    throw error;
  }
  if (!WCC_TICKET_EVENT_TYPES.includes(eventType)) {
    const error = new TypeError("invalid_wcc_ticket_event_type");
    error.code = "invalid_wcc_ticket_event_type";
    throw error;
  }
  if (!input.provider_payload || typeof input.provider_payload !== "object" || Array.isArray(input.provider_payload)) {
    const error = new TypeError("invalid_wcc_ticket_provider_payload");
    error.code = "invalid_wcc_ticket_provider_payload";
    throw error;
  }
  const occurredAt = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
  const providerSnapshot = JSON.parse(JSON.stringify(input.provider_payload));
  return {
    schema: "wellington-wcc-ticket-event/v1",
    event_id: `mock-wcc-ticket-event:${occurredAt.getTime()}:${direction}:${eventType}`,
    occurred_at: occurredAt.toISOString(),
    direction,
    event_type: eventType,
    situation_id: cleanText(input.situation_id, null),
    case_id: cleanText(input.case_id, null),
    previous_event_id: cleanText(input.previous_event_id, null),
    mode: "mock",
    is_synthetic: true,
    connector_state: "disconnected_demo",
    status: direction === "outbound" ? "prepared_not_sent" : "simulated_received",
    provider_snapshot: providerSnapshot,
    dispatched: false,
    external_effect: "none",
    evidence_weight: 0,
    training_use: "excluded",
    authority: { decision: "human_only", external_action: "not_authorised" },
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
  const caseRecord = normaliseCase(input, preparedAt);
  const referenceTime = caseRecord.observed_at ?? preparedAt.toISOString();
  const references = {
    signal: buildSignalReference({ canonicalId: caseRecord.case_id, occurredAt: referenceTime }),
    case: caseRecord.case_ref,
    ...(adapter.id === "wcc-ticket" ? {
      ticket: buildTicketReference({ canonicalId: caseRecord.case_id, occurredAt: preparedAt.toISOString() }),
    } : {}),
  };
  const names = {
    case: caseRecord.case_name,
    ...(references.ticket ? {
      ticket: buildTicketName({ caseReference: references.case, service: "Weather Event / Flooding" }),
    } : {}),
  };
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
    delivery_receipts: [],
    prepared_at: preparedAt.toISOString(),
    references,
    names,
    case: caseRecord,
    provider_payload: buildProviderPayload(adapter.id, caseRecord, preparedAt, references),
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
