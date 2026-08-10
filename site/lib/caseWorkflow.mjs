export const CASE_STATE_AXES = {
  signal: ["candidate", "under_review", "dismissed", "promoted"],
  incident: ["unconfirmed", "investigating", "confirmed", "controlled", "recovery", "closed"],
  warning: ["none", "draft", "awaiting_approval", "issued", "updated", "cancelled"],
};

export const CHANNEL_STATES = [
  "not_prepared",
  "prepared_not_sent",
  "accepted",
  "failed",
  "published",
];

const CHANNELS = [
  { channel_id: "wcc_website", label: "WCC website", boundary: "No external delivery" },
  { channel_id: "wcc_social", label: "WCC social", boundary: "No external delivery" },
  { channel_id: "cdem_nema", label: "Civil Defence / NEMA", boundary: "Authorisation required" },
  { channel_id: "ema", label: "Emergency Mobile Alert", boundary: "NEMA authority required" },
];

const REQUIRED_WARNING_FIELDS = [
  "hazard",
  "affected_area",
  "warning_level",
  "public_action",
  "effective_at",
  "expires_at",
  "next_update_at",
  "evidence_ids",
];

function cleanText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 4000) : fallback;
}

function cleanList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item)).filter(Boolean))].slice(0, 100);
}

function safeNow(now) {
  return now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
}

function validTime(value) {
  const date = new Date(value);
  return typeof value === "string" && value.trim() && Number.isFinite(date.getTime());
}

function channelPreparations(status, preparedAt = null) {
  return CHANNELS.map((channel) => ({
    ...channel,
    status,
    prepared_at: status === "prepared_not_sent" ? preparedAt : null,
    receipt_at: null,
    external_reference: null,
    error_code: null,
    mode: "mock",
    dispatched: false,
  }));
}

export function caseWorkflowContract() {
  return {
    schema: "wellington-case-workflow-contract/v1",
    storage: "browser_local_demo",
    execution: "mock_prepare_only",
    state_axes: CASE_STATE_AXES,
    channel_states: CHANNEL_STATES,
    locally_reachable_channel_states: ["not_prepared", "prepared_not_sent"],
    authority: {
      incident_confirmation: "human_only",
      warning_issue: "human_only",
      external_action: "not_authorised",
    },
  };
}

export function createCaseWorkflow(input = {}, now = new Date()) {
  const createdAt = safeNow(now).toISOString();
  const caseId = cleanText(input.case_id, "mock-preview");
  return {
    schema: "wellington-case-cop/v1",
    case_id: caseId,
    version: 1,
    storage: "browser_local_demo",
    execution: "mock_prepare_only",
    external_effect: "none",
    state: {
      signal: "candidate",
      incident: "unconfirmed",
      warning: "none",
    },
    candidate_snapshot: {
      id: caseId,
      title: cleanText(input.title, "Potential disruption requires review"),
      source_id: cleanText(input.source_id, "unknown-source"),
      observed_at: cleanText(input.observed_at, null),
      source_severity: cleanText(input.severity, "unassigned"),
      epistemic_state: cleanText(input.epistemic_state, "inference"),
      decision_authority: "human",
      captured_at: createdAt,
    },
    cop: {
      information_manager: "",
      next_review_at: null,
      affected_area: { label: "", geometry: null, authority: "working_area" },
      situation: "",
      confirmed_items: [],
      unknown_items: [],
      current_actions: [],
    },
    evidence_snapshot: {
      captured_at: createdAt,
      linked_ids: cleanList(input.evidence_ids),
      replay_policy: "available_at_only",
      replay_policy_status: "requires_available_at",
    },
    warning: null,
    timeline: [{
      schema: "wellington-case-timeline-event/v1",
      event_id: `${caseId}:v1:case_created`,
      case_id: caseId,
      case_version: 1,
      occurred_at: createdAt,
      action: "case_created",
      actor: { role: "operator", label: "Browser operator" },
      summary: "Browser-local case draft created",
      external_effect: "none",
    }],
    authority: {
      incident_confirmation: "human_only",
      warning_issue: "human_only",
      external_action: "not_authorised",
    },
  };
}

export function prepareWarningApproval(input = {}, now = new Date()) {
  const preparedAt = safeNow(now).toISOString();
  const errors = [];

  for (const field of REQUIRED_WARNING_FIELDS) {
    const value = input[field];
    const missing = field === "evidence_ids"
      ? cleanList(value).length === 0
      : !cleanText(value);
    if (missing) errors.push(`required:${field}`);
  }

  const creatorId = cleanText(input.creator_id);
  const approverId = cleanText(input.approver_id);
  if (!creatorId) errors.push("required:creator_id");
  if (!approverId) errors.push("required:approver_id");
  if (creatorId && approverId && creatorId.toLocaleLowerCase("en-NZ") === approverId.toLocaleLowerCase("en-NZ")) {
    errors.push("distinct_approver_required");
  }

  const effectiveAt = cleanText(input.effective_at);
  const nextUpdateAt = cleanText(input.next_update_at);
  const expiresAt = cleanText(input.expires_at);
  if (effectiveAt && !validTime(effectiveAt)) errors.push("invalid:effective_at");
  if (nextUpdateAt && !validTime(nextUpdateAt)) errors.push("invalid:next_update_at");
  if (expiresAt && !validTime(expiresAt)) errors.push("invalid:expires_at");
  if (validTime(effectiveAt) && validTime(nextUpdateAt) && new Date(effectiveAt) >= new Date(nextUpdateAt)) {
    errors.push("time_order:effective_before_next_update");
  }
  if (validTime(nextUpdateAt) && validTime(expiresAt) && new Date(nextUpdateAt) > new Date(expiresAt)) {
    errors.push("time_order:next_update_before_expiry");
  }

  const evidenceIds = cleanList(input.evidence_ids);
  const allowedEvidenceIds = cleanList(input.allowed_evidence_ids);
  if (allowedEvidenceIds.length && evidenceIds.some((id) => !allowedEvidenceIds.includes(id))) {
    errors.push("invalid:evidence_ids");
  }

  const ready = errors.length === 0;
  const status = ready ? "prepared_not_sent" : "not_prepared";
  return {
    schema: "wellington-warning-package/v1",
    ready,
    errors,
    mode: "mock",
    is_synthetic: true,
    dispatched: false,
    evidence_weight: 0,
    prepared_at: ready ? preparedAt : null,
    warning: {
      case_id: cleanText(input.case_id, "mock-preview"),
      state: ready ? "awaiting_approval" : "draft",
      hazard: cleanText(input.hazard),
      affected_area: cleanText(input.affected_area),
      warning_level: cleanText(input.warning_level),
      community_impact: cleanText(input.community_impact),
      public_action: cleanText(input.public_action),
      effective_at: effectiveAt || null,
      expires_at: expiresAt || null,
      next_update_at: nextUpdateAt || null,
      evidence_ids: evidenceIds,
    },
    approval: {
      state: ready ? "awaiting_approval" : "not_requested",
      creator_id: creatorId || null,
      approver_id: approverId || null,
      requested_at: ready ? preparedAt : null,
    },
    channels: channelPreparations(status, preparedAt),
    delivery_receipts: [],
    authority: {
      decision: "human_only",
      external_action: "not_authorised",
    },
    timeline: ready ? [{
      schema: "wellington-case-timeline-event/v1",
      event_id: `${cleanText(input.case_id, "mock-preview")}:warning:${preparedAt}`,
      case_id: cleanText(input.case_id, "mock-preview"),
      case_version: 2,
      occurred_at: preparedAt,
      action: "approval_pack_prepared",
      actor: { role: "creator", label: creatorId },
      summary: "Local approval package prepared; nothing sent",
      external_effect: "none",
    }] : [],
  };
}

export function buildReplayHandoff(input = {}) {
  const asOfDate = new Date(input.as_of);
  const asOf = Number.isFinite(asOfDate.getTime()) ? asOfDate.toISOString() : null;
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const selectedEvidenceIds = asOf ? evidence
    .filter((item) => validTime(item?.available_at) && new Date(item.available_at) <= asOfDate)
    .map((item) => cleanText(item?.id))
    .filter(Boolean) : [];
  const caseId = cleanText(input.case_id, "mock-preview");
  const sourceId = cleanText(input.source_id, "unknown-source");
  return {
    schema: "wellington-replay-handoff/v1",
    case_id: caseId,
    mode: "case_investigation",
    replay_url: `/replay?case=${encodeURIComponent(caseId)}&source=${encodeURIComponent(sourceId)}${asOf ? `&as_of=${encodeURIComponent(asOf)}` : ""}#history-replay`,
    as_of: asOf,
    window: { starts_at: cleanText(input.starts_at, null), ends_at: asOf },
    selected_sources: [sourceId],
    selected_evidence_ids: selectedEvidenceIds,
    evidence_policy: "available_at_only",
    policy_status: evidence.length && evidence.every((item) => validTime(item?.available_at))
      ? "enforced_for_supplied_records"
      : "requires_available_at",
    dispatched: false,
    external_effect: "none",
  };
}
