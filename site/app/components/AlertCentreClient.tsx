"use client";

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useState } from "react";
import { prepareWarningApproval } from "../../lib/caseWorkflow.mjs";
import {
  buildReviewQueueView,
  classificationFeedback,
  queueForReviewStatus,
  REVIEW_CLASSIFICATIONS,
  REVIEW_QUEUES,
  REVIEW_STORAGE_KEY,
} from "../../lib/signalReview.mjs";
import { WORKFLOW_ADAPTERS } from "../../lib/workflowAdapters.mjs";
import { buildStartedCaseReference } from "../../lib/operationalIdentifiers.mjs";

type Candidate = {
  id: string;
  canonical_id: string;
  signal_ref: string;
  signal_name: string;
  title: string;
  severity: string;
  observed_at: string;
  source_id: string;
  review_state: string;
  rule_id: string;
  epistemic_state: string;
  decision_authority: string;
  evidence: {
    supporting: string[];
    contradicting: string[];
    missing: string[];
    context: string[];
  };
};

type EvidenceLink = {
  link_id: string;
  evidence_id: string;
  relation: "supports" | "contradicts" | "missing" | "context";
  source_signal_id: string;
  reviewer_state: string;
};

type Situation = {
  id: string;
  canonical_id: string;
  situation_ref: string;
  title: string;
  priority: string;
  severity: string;
  opened_at: string;
  last_observed_at: string;
  source_ids: string[];
  signal_count: number;
  signal_ids: string[];
  signals: Candidate[];
  gate: { type: "hard" | "soft" | "monitor"; outcome: string; reason_codes: string[]; authority: string };
  non_escalation: { reason_code: string; rationale: string } | null;
  evidence_links: EvidenceLink[];
};

type ReviewStatus = "open" | "investigating" | "needs_action" | "closed";
type ReviewQueue = "new" | "active" | "closed" | "history" | "all";
type ReviewClassification = "true_positive" | "benign_positive" | "false_positive" | "undetermined";
type ReviewDraft = { status: ReviewStatus; classification: ReviewClassification; assignee: string; note: string; updatedAt: string };
type TabId = "case" | "warning" | "evidence" | "activity";
type TimelineItem = { version: number; occurredAt: string; action: string; summary: string };
type CopVersion = { version: number; capturedAt: string; situation: string; confirmed: string[]; unknown: string[]; currentActions: string[] };
type FieldTask = { id: string; type: string; instruction: string; owner: string; status: "draft_not_dispatched"; createdAt: string };
type Decision = { id: string; outcome: string; rationale: string; actorId: string; createdAt: string };
type TicketEvent = { eventId: string; direction: "inbound" | "outbound"; eventType: string; occurredAt: string; status: string };
type CaseDraft = {
  incidentState: "unconfirmed" | "investigating" | "confirmed" | "controlled" | "recovery" | "closed";
  nextReview: string;
  affectedArea: string;
  situation: string;
  confirmed: string;
  unknown: string;
  currentActions: string;
  hazard: string;
  warningLevel: string;
  communityImpact: string;
  publicAction: string;
  effectiveAt: string;
  expiresAt: string;
  nextUpdateAt: string;
  evidenceLinks: string;
  creator: string;
  approver: string;
  warningState: "none" | "draft" | "awaiting_approval";
  timeline: TimelineItem[];
  copVersions: CopVersion[];
  fieldTasks: FieldTask[];
  decisions: Decision[];
  ticketEvents: TicketEvent[];
  updatedAt: string;
};
type WorkflowResult = {
  adapter_id: string;
  adapter_name: string;
  status: string;
  dispatched: boolean;
  provider_payload: Record<string, unknown>;
  references?: { signal: string; case: string; ticket?: string };
  names?: { case: string; ticket?: string };
};
type ChannelPreparation = { channel_id: string; label: string; status: string; boundary: string };
type WarningResult = {
  ready: boolean;
  errors: string[];
  warning: { state: "draft" | "awaiting_approval" };
  channels: ChannelPreparation[];
};

const CASE_STORAGE_KEY = "poneke-case-cop-drafts-v1";
const MOCK_ID = "mock-preview";
const EMPTY_REVIEW: ReviewDraft = { status: "open", classification: "undetermined", assignee: "", note: "", updatedAt: "" };
const TABS: { id: TabId; label: string }[] = [
  { id: "evidence", label: "Evidence" },
  { id: "case", label: "Case & COP" },
  { id: "warning", label: "Warning preparation" },
  { id: "activity", label: "Activity" },
];
const EMPTY_CHANNELS: ChannelPreparation[] = [
  { channel_id: "wcc_website", label: "WCC website", status: "not_prepared", boundary: "No external delivery" },
  { channel_id: "wcc_social", label: "WCC social", status: "not_prepared", boundary: "No external delivery" },
  { channel_id: "cdem_nema", label: "Civil Defence / NEMA", status: "not_prepared", boundary: "Authorisation required" },
  { channel_id: "ema", label: "Emergency Mobile Alert", status: "not_prepared", boundary: "NEMA authority required" },
];

const preview = {
  title: "Synthetic northern-access investigation",
  signal: {
    id: "mock-signal-1",
    signal_ref: "SIG-20260812-9001",
    title: "Synthetic countline movement drop",
    source_id: "synthetic-fixture",
  },
  supporting: ["Mock sensor drop at a synthetic countline"],
  contradicting: [],
  missing: ["No current official road-status record", "No independent movement source"],
  context: ["Static reopening plan is context only"],
};

function emptyCaseDraft(): CaseDraft {
  return {
    incidentState: "unconfirmed", nextReview: "", affectedArea: "", situation: "", confirmed: "", unknown: "", currentActions: "",
    hazard: "", warningLevel: "", communityImpact: "", publicAction: "", effectiveAt: "", expiresAt: "",
    nextUpdateAt: "", evidenceLinks: "", creator: "", approver: "", warningState: "none", timeline: [],
    copVersions: [], fieldTasks: [], decisions: [], ticketEvents: [], updatedAt: "",
  };
}

function safeReviewDrafts(value: unknown): Record<string, ReviewDraft> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = new Set<ReviewStatus>(["open", "investigating", "needs_action", "closed"]);
  const allowedClassifications = new Set<ReviewClassification>(["true_positive", "benign_positive", "false_positive", "undetermined"]);
  return Object.fromEntries(Object.entries(value).flatMap(([key, draft]) => {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return [];
    const item = draft as Partial<ReviewDraft>;
    if (!item.status || !allowed.has(item.status)) return [];
    return [[key.slice(0, 180), {
      status: item.status,
      classification: item.classification && allowedClassifications.has(item.classification) ? item.classification : "undetermined",
      assignee: typeof item.assignee === "string" ? item.assignee.slice(0, 240) : "",
      note: typeof item.note === "string" ? item.note.slice(0, 4000) : "",
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : "",
    }]];
  }));
}

function safeCaseDrafts(value: unknown): Record<string, CaseDraft> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const textKeys = Object.keys(emptyCaseDraft()).filter((key) => ![
    "timeline", "copVersions", "fieldTasks", "decisions", "ticketEvents", "warningState", "incidentState",
  ].includes(key)) as (keyof CaseDraft)[];
  const incidentStates = new Set<CaseDraft["incidentState"]>(["unconfirmed", "investigating", "confirmed", "controlled", "recovery", "closed"]);
  return Object.fromEntries(Object.entries(value).flatMap(([key, draft]) => {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return [];
    const raw = draft as Partial<CaseDraft>;
    const next = emptyCaseDraft();
    for (const field of textKeys) {
      const fieldValue = raw[field];
      if (typeof fieldValue === "string") (next[field] as string) = fieldValue.slice(0, 4000);
    }
    if (raw.incidentState && incidentStates.has(raw.incidentState)) next.incidentState = raw.incidentState;
    if (["none", "draft", "awaiting_approval"].includes(raw.warningState ?? "")) next.warningState = raw.warningState!;
    next.timeline = Array.isArray(raw.timeline) ? raw.timeline.filter((item) => Boolean(
      item && typeof item.occurredAt === "string" && typeof item.action === "string" && typeof item.summary === "string",
    )).slice(-100).map((item, index) => ({
      version: Number.isInteger(item.version) && item.version > 0 ? item.version : index + 1,
      occurredAt: item.occurredAt,
      action: item.action,
      summary: item.summary,
    })) : [];
    next.copVersions = Array.isArray(raw.copVersions) ? raw.copVersions.filter((item) => Boolean(
      item && Number.isInteger(item.version) && typeof item.capturedAt === "string",
    )).slice(-50).map((item) => ({
      version: item.version,
      capturedAt: item.capturedAt,
      situation: typeof item.situation === "string" ? item.situation.slice(0, 4000) : "",
      confirmed: Array.isArray(item.confirmed) ? item.confirmed.filter((value): value is string => typeof value === "string").slice(0, 100) : [],
      unknown: Array.isArray(item.unknown) ? item.unknown.filter((value): value is string => typeof value === "string").slice(0, 100) : [],
      currentActions: Array.isArray(item.currentActions) ? item.currentActions.filter((value): value is string => typeof value === "string").slice(0, 100) : [],
    })) : [];
    next.fieldTasks = Array.isArray(raw.fieldTasks) ? raw.fieldTasks.filter((item) => Boolean(
      item && typeof item.id === "string" && typeof item.instruction === "string" && typeof item.owner === "string",
    )).slice(-50).map((item) => ({ ...item, status: "draft_not_dispatched" as const })) : [];
    next.decisions = Array.isArray(raw.decisions) ? raw.decisions.filter((item) => Boolean(
      item && typeof item.id === "string" && typeof item.outcome === "string" && typeof item.rationale === "string" && typeof item.actorId === "string",
    )).slice(-50) : [];
    next.ticketEvents = Array.isArray(raw.ticketEvents) ? raw.ticketEvents.filter((item) => Boolean(
      item && typeof item.eventId === "string" && ["inbound", "outbound"].includes(item.direction) && typeof item.eventType === "string",
    )).slice(-50) : [];
    return [[key.slice(0, 180), next]];
  }));
}

function lines(value: string) {
  return [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];
}

function warningError(error: string) {
  if (error === "distinct_approver_required") return "Creator and approver must be different people.";
  if (error === "invalid:evidence_ids") return "Evidence links must belong to this case.";
  if (error.startsWith("required:")) return `${error.slice(9).replaceAll("_", " ")} is required.`;
  if (error.startsWith("time_order:")) return "Check the effective, next update and expiry order.";
  return "Enter a valid date and time.";
}

function Bucket({ label, values }: { label: string; values: string[] }) {
  return (
    <section className={`alert-evidence-bucket bucket-${label.toLowerCase()}${values.length ? "" : " is-empty"}`} data-evidence-empty={values.length === 0}>
      <header><h3>{label}</h3><span>{values.length}</span></header>
      {values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p className="empty">None received</p>}
    </section>
  );
}

export default function AlertCentreClient() {
  const [candidates, setCandidates] = useState<Situation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [activeQueue, setActiveQueue] = useState<ReviewQueue>("new");
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [caseDrafts, setCaseDrafts] = useState<Record<string, CaseDraft>>({});
  const [activeTab, setActiveTab] = useState<TabId>("evidence");
  const [notice, setNotice] = useState("");
  const [warningResult, setWarningResult] = useState<WarningResult | null>(null);
  const [workflowAdapterId, setWorkflowAdapterId] = useState(WORKFLOW_ADAPTERS[1].id);
  const [workflowState, setWorkflowState] = useState<"idle" | "preparing" | "ready" | "error">("idle");
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [taskDraft, setTaskDraft] = useState({ instruction: "", owner: "" });
  const [decisionDraft, setDecisionDraft] = useState({ outcome: "open_investigation", rationale: "", actorId: "" });
  const [ticketDirection, setTicketDirection] = useState<"inbound" | "outbound">("inbound");
  const [ticketEventType, setTicketEventType] = useState("status_changed");
  const [ticketEventState, setTicketEventState] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    let active = true;
    fetch("/api/alerts/v1/situations", { headers: { accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("Alert candidate service unavailable");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        const next = payload.situations ?? [];
        setCandidates(next);
        setSelectedId(next[0]?.id ?? null);
        setState("ready");
      })
      .catch(() => { if (active) setState("error"); });

    const loadDrafts = window.setTimeout(() => {
      try {
        const review = JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? "{}");
        const cases = JSON.parse(window.localStorage.getItem(CASE_STORAGE_KEY) ?? "{}");
        if (active) setReviewDrafts(safeReviewDrafts(review));
        if (active) setCaseDrafts(safeCaseDrafts(cases));
      } catch {
        // Invalid browser-local drafts fail closed and never block the queue.
      }
    }, 0);

    return () => { active = false; window.clearTimeout(loadDrafts); };
  }, []);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const displaySignals = selected?.signals ?? [preview.signal];
  const displaySignalCount = selected?.signal_count ?? displaySignals.length;
  const selectedKey = selected?.id ?? MOCK_ID;
  const activeReview = reviewDrafts[selectedKey] ?? EMPTY_REVIEW;
  const activeCase = caseDrafts[selectedKey] ?? emptyCaseDraft();
  const mockStatus = reviewDrafts[MOCK_ID]?.status ?? "open";
  const mockQueueItem = {
    id: MOCK_ID,
    signal_ref: preview.signal.signal_ref,
    title: preview.title,
    source_id: "synthetic-fixture",
    status: mockStatus,
    has_history: Boolean(reviewDrafts[MOCK_ID]?.updatedAt),
  };
  const queueView = buildReviewQueueView(candidates, reviewDrafts, {
    queue: activeQueue,
    query,
    mock: mockQueueItem,
  }) as { counts: Record<ReviewQueue, number>; visible_ids: string[] };
  const queueCounts = queueView.counts;
  const visibleIds = new Set(queueView.visible_ids);
  const filteredCandidates = candidates.filter((candidate) => visibleIds.has(candidate.id));
  const evidenceBuckets = selected ? {
    supporting: selected.evidence_links.filter((link) => link.relation === "supports").map((link) => link.evidence_id),
    contradicting: selected.evidence_links.filter((link) => link.relation === "contradicts").map((link) => link.evidence_id),
    missing: selected.evidence_links.filter((link) => link.relation === "missing").map((link) => link.evidence_id),
    context: selected.evidence_links.filter((link) => link.relation === "context").map((link) => link.evidence_id),
  } : preview;
  const observedLabel = selected
    ? new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Pacific/Auckland" }).format(new Date(selected.last_observed_at))
    : "No observation";
  const signalState = activeReview.status === "closed" ? "Dismissed" : activeReview.status === "needs_action" ? "Promoted" : activeReview.status === "open" ? "Candidate" : "Under review";
  const workflowStep = activeReview.status === "closed" ? 3 : activeReview.status === "open" ? 1 : 2;
  const classification = classificationFeedback(activeReview.classification, { is_mock: !selected });
  const signalReference = selected?.situation_ref ?? "MOCK-SITUATION";
  const caseReference = selected ? buildStartedCaseReference({
    canonicalId: selected.id,
    occurredAt: selected.opened_at,
    reviewStatus: activeReview.status,
    caseUpdatedAt: activeCase.updatedAt,
  }) : null;
  const showMock = visibleIds.has(MOCK_ID);
  const channelRows = warningResult?.channels ?? (activeCase.warningState === "awaiting_approval"
    ? EMPTY_CHANNELS.map((channel) => ({ ...channel, status: "prepared_not_sent" }))
    : EMPTY_CHANNELS);

  function selectCandidate(id: string | null) {
    setSelectedId(id);
    setNotice("");
    setWarningResult(null);
    setWorkflowResult(null);
    setWorkflowState("idle");
    setTaskDraft({ instruction: "", owner: "" });
    setDecisionDraft({ outcome: "open_investigation", rationale: "", actorId: "" });
    setTicketEventState("idle");
    setActiveTab("evidence");
  }

  function changeReview(change: Partial<ReviewDraft>) {
    setNotice("");
    if (change.status && activeQueue !== "all" && activeQueue !== "history") {
      setActiveQueue(queueForReviewStatus(change.status) as ReviewQueue);
    }
    setReviewDrafts((current) => ({ ...current, [selectedKey]: { ...(current[selectedKey] ?? EMPTY_REVIEW), ...change } }));
  }

  function changeCase(change: Partial<CaseDraft>) {
    setNotice("");
    setWarningResult(null);
    setCaseDrafts((current) => ({
      ...current,
      [selectedKey]: { ...(current[selectedKey] ?? emptyCaseDraft()), ...change },
    }));
  }

  function persistCase(nextCase: CaseDraft, success: string) {
    const nextCases = { ...caseDrafts, [selectedKey]: nextCase };
    try {
      window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(nextCases));
      setCaseDrafts(nextCases);
      setNotice(success);
    } catch {
      setCaseDrafts(nextCases);
      setNotice("Saved for this session; browser storage failed.");
    }
  }

  function saveCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date().toISOString();
    const nextReview = { ...activeReview, updatedAt: now };
    const copVersion = {
      version: activeCase.copVersions.length + 1,
      capturedAt: now,
      situation: activeCase.situation,
      confirmed: lines(activeCase.confirmed),
      unknown: lines(activeCase.unknown),
      currentActions: lines(activeCase.currentActions),
    };
    const nextCase = {
      ...activeCase,
      updatedAt: now,
      copVersions: [...activeCase.copVersions, copVersion],
      timeline: [...activeCase.timeline, {
        version: activeCase.timeline.length + 1,
        occurredAt: now,
        action: activeReview.status === "closed" ? "outcome_classified" : "cop_snapshot_saved",
        summary: `COP v${copVersion.version} · ${queueForReviewStatus(activeReview.status)} · ${classification.label}`,
      }],
    };
    const nextReviews = { ...reviewDrafts, [selectedKey]: nextReview };
    try {
      window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(nextReviews));
      setReviewDrafts(nextReviews);
      persistCase(nextCase, `COP v${copVersion.version} saved in this browser. Not shared.`);
    } catch {
      setNotice("Could not save on this browser.");
    }
  }

  function addFieldTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const instruction = taskDraft.instruction.trim();
    const owner = taskDraft.owner.trim();
    if (!instruction || !owner) return;
    const now = new Date().toISOString();
    const task: FieldTask = {
      id: `${selectedKey}:task:${activeCase.fieldTasks.length + 1}`,
      type: "field_verification",
      instruction,
      owner,
      status: "draft_not_dispatched",
      createdAt: now,
    };
    persistCase({
      ...activeCase,
      fieldTasks: [...activeCase.fieldTasks, task],
      updatedAt: now,
      timeline: [...activeCase.timeline, {
        version: activeCase.timeline.length + 1,
        occurredAt: now,
        action: "field_task_drafted",
        summary: `Field verification drafted for ${owner}; not dispatched`,
      }],
    }, "Field task drafted locally. Nothing dispatched.");
    setTaskDraft({ instruction: "", owner: "" });
  }

  function addDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rationale = decisionDraft.rationale.trim();
    const actorId = decisionDraft.actorId.trim();
    if (!rationale || !actorId) return;
    const now = new Date().toISOString();
    const decision: Decision = {
      id: `${selectedKey}:decision:${activeCase.decisions.length + 1}`,
      outcome: decisionDraft.outcome,
      rationale,
      actorId,
      createdAt: now,
    };
    persistCase({
      ...activeCase,
      decisions: [...activeCase.decisions, decision],
      updatedAt: now,
      timeline: [...activeCase.timeline, {
        version: activeCase.timeline.length + 1,
        occurredAt: now,
        action: "decision_recorded",
        summary: `${decision.outcome}: ${decision.rationale}`,
      }],
    }, "Human decision recorded locally.");
    setDecisionDraft({ outcome: "open_investigation", rationale: "", actorId: "" });
  }

  function prepareApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = prepareWarningApproval({
      case_id: selectedKey,
      hazard: activeCase.hazard,
      affected_area: activeCase.affectedArea,
      warning_level: activeCase.warningLevel,
      community_impact: activeCase.communityImpact,
      public_action: activeCase.publicAction,
      effective_at: activeCase.effectiveAt,
      expires_at: activeCase.expiresAt,
      next_update_at: activeCase.nextUpdateAt,
      evidence_ids: lines(activeCase.evidenceLinks),
      allowed_evidence_ids: selected
        ? selected.evidence_links.map((link) => link.evidence_id)
        : [...preview.supporting, ...preview.contradicting, ...preview.missing, ...preview.context],
      creator_id: activeCase.creator,
      approver_id: activeCase.approver,
    }) as WarningResult;
    setWarningResult(result);
    if (!result.ready) {
      setCaseDrafts((current) => ({
        ...current,
        [selectedKey]: { ...(current[selectedKey] ?? emptyCaseDraft()), warningState: "draft" },
      }));
      return;
    }
    const now = new Date().toISOString();
    const nextCase = {
      ...activeCase,
      warningState: "awaiting_approval" as const,
      updatedAt: now,
      timeline: [...activeCase.timeline, { version: activeCase.timeline.length + 1, occurredAt: now, action: "approval_pack_prepared", summary: "Local approval pack prepared; nothing sent" }],
    };
    const nextCases = { ...caseDrafts, [selectedKey]: nextCase };
    try {
      window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(nextCases));
      setCaseDrafts(nextCases);
    } catch {
      setNotice("Prepared for this session; browser save failed.");
    }
  }

  async function prepareWorkflow() {
    setWorkflowState("preparing");
    setWorkflowResult(null);
    try {
      const response = await fetch("/api/integration/v1/workflow-adapters", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          adapter_id: workflowAdapterId,
          case: {
            case_id: selectedKey,
            title: selected?.title ?? preview.title,
            severity: selected?.severity ?? "unassigned",
            source_id: selected?.source_ids[0] ?? "synthetic-fixture",
            observed_at: selected?.opened_at ?? null,
            affected_area: activeCase.affectedArea || "Synthetic Wellington area",
            as_of: new Date().toISOString(),
          },
        }),
      });
      if (!response.ok) throw new Error("Mock adapter unavailable");
      const result = await response.json() as WorkflowResult;
      setWorkflowResult(result);
      const now = new Date().toISOString();
      const nextCase = {
        ...activeCase,
        updatedAt: now,
        timeline: [...activeCase.timeline, {
          version: activeCase.timeline.length + 1,
          occurredAt: now,
          action: result.adapter_id === "replay-case-handoff" ? "replay_handoff_prepared" : "workflow_prepared",
          summary: `${result.adapter_name} prepared locally; nothing sent`,
        }],
      };
      const nextCases = { ...caseDrafts, [selectedKey]: nextCase };
      setCaseDrafts(nextCases);
      try {
        window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(nextCases));
      } catch {
        setNotice("Handoff prepared for this session; browser save failed.");
      }
      setWorkflowState("ready");
    } catch {
      setWorkflowState("error");
    }
  }

  async function simulateTicketEvent(preparedResult: WorkflowResult | null) {
    if (preparedResult?.adapter_id !== "wcc-ticket") return;
    setTicketEventState("saving");
    try {
      const response = await fetch("/api/integration/v1/wcc-ticket-events", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          direction: ticketDirection,
          event_type: ticketEventType,
          situation_id: selectedKey,
          case_id: caseReference,
          previous_event_id: activeCase.ticketEvents.at(-1)?.eventId ?? null,
          provider_payload: preparedResult.provider_payload,
        }),
      });
      if (!response.ok) throw new Error("Ticket simulator unavailable");
      const result = await response.json() as {
        event_id: string; direction: "inbound" | "outbound"; event_type: string; occurred_at: string; status: string;
      };
      const ticketEvent: TicketEvent = {
        eventId: result.event_id,
        direction: result.direction,
        eventType: result.event_type,
        occurredAt: result.occurred_at,
        status: result.status,
      };
      setCaseDrafts((current) => {
        const currentCase = current[selectedKey] ?? activeCase;
        const nextCase = {
          ...currentCase,
          ticketEvents: [...currentCase.ticketEvents, ticketEvent],
          updatedAt: result.occurred_at,
          timeline: [...currentCase.timeline, {
            version: currentCase.timeline.length + 1,
            occurredAt: result.occurred_at,
            action: "wcc_ticket_event_simulated",
            summary: `${result.direction} ${result.event_type} · mock · no external write`,
          }],
        };
        const nextCases = { ...current, [selectedKey]: nextCase };
        try {
          window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(nextCases));
        } catch {
          // The simulator remains usable for this session when browser storage is unavailable.
        }
        return nextCases;
      });
      setNotice("WCC Ticket event simulated locally. No external write.");
      setTicketEventState("idle");
    } catch {
      setTicketEventState("error");
    }
  }

  function handleTabKey(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    const keyMove = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    let nextIndex = keyMove ? (index + keyMove + TABS.length) % TABS.length : index;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    if (!keyMove && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = TABS[nextIndex];
    setActiveTab(next.id);
    document.getElementById(`alert-tab-${next.id}`)?.focus();
  }

  return (
    <section className="alert-centre-grid" data-operator-workflow="signal-master-detail" data-review-unit="situation">
      <aside className="alert-queue" data-review-surface="queue" data-default-queue="new" data-visible-review-count={queueView.visible_ids.length} data-queue-count-new={queueCounts.new} aria-label="Situation review queue" aria-busy={state === "loading"}>
        <header className="alert-queue-header">
          <h2>Review queue</h2>
          <output>{queueCounts[activeQueue]}</output>
        </header>
        <label className="alert-queue-select">
          <span>Queue</span>
          <select
            aria-label="Review queue"
            value={activeQueue}
            onChange={(event) => {
              const queue = event.currentTarget.value as ReviewQueue;
              setActiveQueue(queue);
              const next = buildReviewQueueView(candidates, reviewDrafts, { queue, query, mock: mockQueueItem }).visible_ids[0];
              setSelectedId(next && next !== MOCK_ID ? next : null);
            }}
          >
            {REVIEW_QUEUES.map((queue) => (
              <option key={queue.id} value={queue.id}>{queue.label} · {queueCounts[queue.id as ReviewQueue]}</option>
            ))}
          </select>
        </label>
        <div className="alert-queue-tools">
          <label><span>Search situations</span><input type="search" value={query} onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            const next = buildReviewQueueView(candidates, reviewDrafts, { queue: activeQueue, query: nextQuery, mock: mockQueueItem }).visible_ids[0];
            setSelectedId(next && next !== MOCK_ID ? next : null);
          }} placeholder="Situation, signal or source" /></label>
        </div>
        <div className="alert-ticket-list">
          {state === "loading" && <p className="ops-state is-loading" role="status">Loading situation queue…</p>}
          {state === "error" && <p className="ops-state is-error" role="alert">Situation service unavailable.</p>}
          {state === "ready" && queueView.visible_ids.length === 0 && <div className="alert-empty-state"><strong>{query.trim() ? "No matching situations" : "No situations in this queue"}</strong><p>{query.trim() ? "Clear search or choose another queue." : "Monitoring continues"}</p></div>}
          {filteredCandidates.map((candidate) => (
            <button key={candidate.id} type="button" className={`alert-ticket-row ${candidate.id === selectedId ? "is-selected" : ""}`} aria-pressed={candidate.id === selectedId} onClick={() => selectCandidate(candidate.id)}>
              <span className="alert-ticket-row-meta"><b>{candidate.priority} · {candidate.gate.type} gate</b><i>{queueForReviewStatus(reviewDrafts[candidate.id]?.status ?? "open")}</i></span>
              <strong>{candidate.title}</strong><small>{candidate.situation_ref} · {candidate.signal_count} signal{candidate.signal_count === 1 ? "" : "s"}</small>
            </button>
          ))}
          {showMock && (
            <button type="button" className={`alert-ticket-row is-mock ${selected ? "" : "is-selected"}`} aria-pressed={!selected} onClick={() => selectCandidate(null)}>
              <span className="alert-ticket-row-meta"><b>Mock · monitor gate</b><i>{queueForReviewStatus(mockStatus)}</i></span>
              <strong>{preview.title}</strong><small>mock-preview · {displaySignalCount} synthetic signal</small>
            </button>
          )}
        </div>
      </aside>

      <article className="alert-review-panel" data-review-surface="evidence-workspace" aria-labelledby="alert-ticket-title">
        <header className="alert-ticket-header">
          <div className="alert-ticket-identity">
            <span className={selected ? "truth-chip" : "mock-chip"}>{selected ? "Situation · unreviewed" : "Mock · not a live situation"}</span>
            <code>{signalReference}</code>
          </div>
          <h2 id="alert-ticket-title">{selected?.title ?? preview.title}</h2>
          <span className="case-rule">{selected ? `${selected.gate.type} gate · ${selected.gate.outcome.replaceAll("_", " ")}` : "monitor gate · synthetic preview"}</span>
        </header>

        <ol className="alert-review-lifecycle" aria-label="Situation review workflow">
          {["Signals", "Situation", "Investigate", "Outcome"].map((step, index) => {
            const stepState = index < workflowStep ? "complete" : index === workflowStep ? "current" : "future";
            return (
              <li key={step} className={stepState === "complete" ? "is-complete" : undefined} data-step-state={stepState} aria-label={`${step}, ${stepState}`} aria-current={stepState === "current" ? "step" : undefined}>
                <span aria-hidden="true">{stepState === "complete" ? "✓" : index + 1}</span><strong>{step}</strong>
              </li>
            );
          })}
        </ol>

        <div className="alert-ticket-workspace" data-detail-layout="responsive-stack">
          <section className="alert-ticket-main" aria-label="Investigation content">
            <div className="alert-tabs" role="tablist" aria-label="Case workspace">
          {TABS.map((tab, index) => (
            <button key={tab.id} id={`alert-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`alert-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => handleTabKey(event, index)}>{tab.label}</button>
          ))}
            </div>

            <section id="alert-panel-case" className="alert-tab-panel" role="tabpanel" aria-labelledby="alert-tab-case" hidden={activeTab !== "case"}>
              <form className="alert-review-form" onSubmit={saveCase}>
                <fieldset className="alert-case-fields">
                  <legend>Investigation</legend>
              <label className="alert-field-wide"><span>Affected area</span><input value={activeCase.affectedArea} onChange={(event) => changeCase({ affectedArea: event.target.value, warningState: "draft" })} placeholder="Working area; no validated polygon" /></label>
              <label className="alert-field-wide"><span>Situation / Review note</span><textarea name="review-note" value={activeCase.situation || activeReview.note} onChange={(event) => { changeCase({ situation: event.target.value }); changeReview({ note: event.target.value }); }} rows={3} placeholder="What is happening now?" /></label>
              <label><span>Confirmed</span><textarea value={activeCase.confirmed} onChange={(event) => changeCase({ confirmed: event.target.value })} rows={3} placeholder="One item per line" /></label>
              <label><span>Unknown / verify</span><textarea value={activeCase.unknown} onChange={(event) => changeCase({ unknown: event.target.value })} rows={3} placeholder="Missing telemetry or checks" /></label>
                  <label className="alert-field-wide"><span>Current actions</span><textarea value={activeCase.currentActions} onChange={(event) => changeCase({ currentActions: event.target.value })} rows={3} placeholder="Owner and next action" /></label>
                </fieldset>
                <div className="alert-review-actions"><button type="submit">Save COP version</button><span>{activeCase.updatedAt ? "Saved in this browser. Not shared." : "This browser only"}</span></div>
              </form>

              <section className="situation-record-grid" aria-label="Investigation records">
                <section className="situation-record-panel">
                  <header><h3>COP versions</h3><span>{activeCase.copVersions.length}</span></header>
                  {activeCase.copVersions.length ? <ol>{activeCase.copVersions.slice().reverse().map((version) => (
                    <li key={version.version}><strong>v{version.version}</strong><span>{new Date(version.capturedAt).toLocaleString("en-NZ")}</span><p>{version.situation || "No situation summary"}</p></li>
                  ))}</ol> : <p className="record-empty">No saved COP version</p>}
                </section>

                <section className="situation-record-panel">
                  <header><h3>Field tasks</h3><span>{activeCase.fieldTasks.length}</span></header>
                  {activeCase.fieldTasks.length ? <ul>{activeCase.fieldTasks.map((task) => (
                    <li key={task.id}><strong>{task.owner}</strong><span>Draft · not dispatched</span><p>{task.instruction}</p></li>
                  ))}</ul> : <p className="record-empty">No field task</p>}
                  <form className="situation-inline-form" onSubmit={addFieldTask}>
                    <label><span>Task</span><input required value={taskDraft.instruction} onChange={(event) => setTaskDraft((current) => ({ ...current, instruction: event.target.value }))} placeholder="Safe verification instruction" /></label>
                    <label><span>Owner</span><input required value={taskDraft.owner} onChange={(event) => setTaskDraft((current) => ({ ...current, owner: event.target.value }))} placeholder="Team or role" /></label>
                    <button type="submit">Add draft task</button>
                  </form>
                </section>

                <section className="situation-record-panel">
                  <header><h3>Decisions</h3><span>{activeCase.decisions.length}</span></header>
                  {activeCase.decisions.length ? <ul>{activeCase.decisions.map((decision) => (
                    <li key={decision.id}><strong>{decision.outcome.replaceAll("_", " ")}</strong><span>{decision.actorId}</span><p>{decision.rationale}</p></li>
                  ))}</ul> : <p className="record-empty">No decision recorded</p>}
                  <form className="situation-inline-form" onSubmit={addDecision}>
                    <label><span>Outcome</span><select value={decisionDraft.outcome} onChange={(event) => setDecisionDraft((current) => ({ ...current, outcome: event.target.value }))}><option value="open_investigation">Open investigation</option><option value="continue_monitoring">Continue monitoring</option><option value="not_escalate">Do not escalate</option><option value="activate_incident">Recommend incident activation</option></select></label>
                    <label><span>Rationale</span><input required value={decisionDraft.rationale} onChange={(event) => setDecisionDraft((current) => ({ ...current, rationale: event.target.value }))} placeholder="Evidence and operational reason" /></label>
                    <label><span>Decision maker</span><input required value={decisionDraft.actorId} onChange={(event) => setDecisionDraft((current) => ({ ...current, actorId: event.target.value }))} placeholder="Name or role" /></label>
                    <button type="submit">Record decision</button>
                  </form>
                </section>
              </section>
            </section>

            <section id="alert-panel-warning" className="alert-tab-panel" role="tabpanel" aria-labelledby="alert-tab-warning" hidden={activeTab !== "warning"}>
          <form className="alert-warning-form" onSubmit={prepareApproval}>
            <header><h2>Warning preparation</h2><span>Never auto-issued</span></header>
            <div className="alert-warning-fields">
              <label><span>Hazard</span><input required value={activeCase.hazard} onChange={(event) => changeCase({ hazard: event.target.value, warningState: "draft" })} /></label>
              <label><span>Warning level</span><select required value={activeCase.warningLevel} onChange={(event) => changeCase({ warningLevel: event.target.value, warningState: "draft" })}><option value="">Select</option><option value="advice">Operational advice</option><option value="protective_action">Protective action</option><option value="emergency_action">Emergency action</option></select></label>
              <label className="alert-field-wide"><span>Affected area</span><input required value={activeCase.affectedArea} onChange={(event) => changeCase({ affectedArea: event.target.value, warningState: "draft" })} /></label>
              <label className="alert-field-wide"><span>Community impact</span><textarea value={activeCase.communityImpact} onChange={(event) => changeCase({ communityImpact: event.target.value, warningState: "draft" })} rows={2} /></label>
              <label className="alert-field-wide"><span>Public action</span><textarea required value={activeCase.publicAction} onChange={(event) => changeCase({ publicAction: event.target.value, warningState: "draft" })} rows={2} placeholder="What should people do now?" /></label>
              <label><span>Effective</span><input required type="datetime-local" value={activeCase.effectiveAt} onChange={(event) => changeCase({ effectiveAt: event.target.value, warningState: "draft" })} /></label>
              <label><span>Expires</span><input required type="datetime-local" value={activeCase.expiresAt} onChange={(event) => changeCase({ expiresAt: event.target.value, warningState: "draft" })} /></label>
              <label><span>Next update</span><input required type="datetime-local" value={activeCase.nextUpdateAt} onChange={(event) => changeCase({ nextUpdateAt: event.target.value, warningState: "draft" })} /></label>
              <label className="alert-field-wide"><span>Evidence links</span><textarea required value={activeCase.evidenceLinks} onChange={(event) => changeCase({ evidenceLinks: event.target.value, warningState: "draft" })} rows={2} placeholder="One current case evidence ID per line" /></label>
              <label><span>Creator</span><input required value={activeCase.creator} onChange={(event) => changeCase({ creator: event.target.value, warningState: "draft" })} /></label>
              <label><span>Approver</span><input required value={activeCase.approver} onChange={(event) => changeCase({ approver: event.target.value, warningState: "draft" })} /></label>
            </div>
            {warningResult && !warningResult.ready ? <ul className="alert-form-errors" role="alert">{warningResult.errors.map((error) => <li key={error}>{warningError(error)}</li>)}</ul> : null}
            <div className="alert-warning-action"><button type="submit">Prepare local approval pack</button><span aria-live="polite">{warningResult?.ready ? "Prepared locally · awaiting approval · not sent" : "Creator and approver must be different"}</span></div>
          </form>
          <section className="alert-channel-section" aria-labelledby="alert-channel-title">
            <header><h3 id="alert-channel-title">Channel status</h3><span className="sr-only">Allowed states: not_prepared and prepared_not_sent</span></header>
            <div className="alert-channel-table" role="table" aria-label="Warning channel preparation states">
              {channelRows.map((channel) => <div role="row" key={channel.channel_id}><strong role="cell">{channel.label}</strong><code role="cell">{channel.status}</code><span role="cell">{channel.boundary}</span></div>)}
            </div>
          </section>
            </section>

            <section id="alert-panel-evidence" className="alert-tab-panel" role="tabpanel" aria-labelledby="alert-tab-evidence" hidden={activeTab !== "evidence"}>
          <section className={`situation-gate gate-${selected?.gate.type ?? "monitor"}`} aria-labelledby="situation-gate-title">
            <div><span>Gate decision</span><h2 id="situation-gate-title">{selected ? selected.gate.outcome.replaceAll("_", " ") : "Continue monitoring"}</h2></div>
            <dl><div><dt>Gate</dt><dd>{selected?.gate.type ?? "monitor"}</dd></div><div><dt>Reasons</dt><dd>{selected?.gate.reason_codes.map((reason) => reason.replaceAll("_", " ")).join(", ") ?? "insufficient independent evidence"}</dd></div><div><dt>Authority</dt><dd>Human only</dd></div></dl>
            {(selected?.non_escalation || !selected) && <p>{selected?.non_escalation?.rationale ?? "Synthetic evidence has no operational authority."}</p>}
          </section>
          <section className="alert-evidence-section" aria-labelledby="alert-evidence-title">
            <header><h2 id="alert-evidence-title">Typed evidence</h2><span>Read-only</span></header>
            <div className="alert-evidence-grid">
              <Bucket label="Supporting" values={evidenceBuckets.supporting} />
              <Bucket label="Contradicting" values={evidenceBuckets.contradicting} />
              <Bucket label="Missing" values={evidenceBuckets.missing} />
              <Bucket label="Context" values={evidenceBuckets.context} />
            </div>
            <details className="situation-signals" data-mock-signal-count={selected ? undefined : displaySignalCount}>
              <summary><strong>Original signals</strong><span>{displaySignalCount}</span></summary>
              <ol>{displaySignals.map((signal) => <li key={signal.id}><code>{signal.signal_ref}</code><div><strong>{signal.title}</strong><span>{signal.source_id}</span></div></li>)}</ol>
            </details>
            <a className="alert-replay-link" href={`/replay?case=${encodeURIComponent(selectedKey)}&source=${encodeURIComponent(selected?.source_ids[0] ?? "synthetic-fixture")}${selected?.last_observed_at ? `&as_of=${encodeURIComponent(selected.last_observed_at)}` : ""}#history-replay`}><strong>Open in Replay</strong><span>available_at-only policy required in v1</span></a>
          </section>
            </section>

            <section id="alert-panel-activity" className="alert-tab-panel" role="tabpanel" aria-labelledby="alert-tab-activity" hidden={activeTab !== "activity"}>
          <section className="alert-activity-section">
            <header><h2>Activity</h2><span>Browser only</span></header>
            <ol className="alert-timeline">
              <li><time>{observedLabel}</time><div><strong>situation_grouped</strong><span>{displaySignalCount} original Signal{displaySignalCount === 1 ? "" : "s"} grouped for review{selected ? "" : " · synthetic preview"}</span></div></li>
              {activeCase.timeline.map((item, index) => <li key={`${item.occurredAt}-${index}`}><time>{new Date(item.occurredAt).toLocaleString("en-NZ")}</time><div><strong><b>v{item.version}</b>{" "}{item.action}</strong><span>{item.summary}</span></div></li>)}
            </ol>
          </section>
          <details className="alert-handoff-details">
            <summary>Prepare handoff</summary>
            <section className="alert-workflow-section" aria-labelledby="alert-workflow-title" aria-label="Mock workflow actions; no external delivery">
              <header><h2 id="alert-workflow-title">Handoffs</h2><span>Mock · not sent</span></header>
              <div className="alert-workflow-controls">
                <label><span>Adapter</span><select aria-label="Choose workflow mock adapter" value={workflowAdapterId} onChange={(event) => { setWorkflowAdapterId(event.target.value); setWorkflowResult(null); setWorkflowState("idle"); }}>{WORKFLOW_ADAPTERS.map((adapter) => <option key={adapter.id} value={adapter.id}>{adapter.name}</option>)}</select></label>
                <button type="button" onClick={() => void prepareWorkflow()} disabled={workflowState === "preparing"}>{workflowState === "preparing" ? "Preparing…" : "Prepare mock"}</button>
              </div>
              <div className="alert-workflow-result" aria-live="polite">
                {workflowState === "error" ? <strong>Mock adapter unavailable</strong> : null}
                {workflowResult ? <><div><strong>{workflowResult.adapter_id === "wcc-ticket" ? workflowResult.references?.ticket : workflowResult.references?.case} · {workflowResult.adapter_name}</strong><span>Prepared · not sent · zero evidence weight</span></div>{workflowResult.adapter_id === "replay-case-handoff" && typeof workflowResult.provider_payload.replay_url === "string" ? <a href={workflowResult.provider_payload.replay_url}>Open case in Replay</a> : null}<details><summary>View mock payload</summary><pre>{JSON.stringify(workflowResult.provider_payload, null, 2)}</pre></details></> : null}
              </div>
            </section>
            <section className="wcc-ticket-simulator" aria-labelledby="wcc-ticket-simulator-title">
              <header><div><h2 id="wcc-ticket-simulator-title">WCC Ticket Simulator</h2><span>Mock · no external write</span></div><p>Supplied WCC fields stay inside the provider snapshot.</p></header>
              <div className="wcc-ticket-simulator-controls">
                <label><span>Direction</span><select value={ticketDirection} onChange={(event) => setTicketDirection(event.target.value as "inbound" | "outbound")}><option value="inbound">Inbound change</option><option value="outbound">Outbound preparation</option></select></label>
                <label><span>Event</span><select value={ticketEventType} onChange={(event) => setTicketEventType(event.target.value)}><option value="status_changed">Status changed</option><option value="triaged">Triaged</option><option value="linked_to_situation">Linked to Situation</option><option value="link_prepared">Link prepared</option><option value="closed">Closed</option></select></label>
                <button type="button" disabled={workflowResult?.adapter_id !== "wcc-ticket" || ticketEventState === "saving"} onClick={() => void simulateTicketEvent(workflowResult)}>{ticketEventState === "saving" ? "Adding…" : "Add mock event"}</button>
              </div>
              {workflowResult?.adapter_id !== "wcc-ticket" && <p className="wcc-ticket-simulator-help">Prepare the WCC ticket adapter first.</p>}
              {ticketEventState === "error" && <p className="wcc-ticket-simulator-error" role="alert">Ticket simulator unavailable.</p>}
              {activeCase.ticketEvents.length ? <ol>{activeCase.ticketEvents.map((item) => <li key={item.eventId}><strong>{item.direction} · {item.eventType.replaceAll("_", " ")}</strong><span>{item.status.replaceAll("_", " ")}</span><time>{new Date(item.occurredAt).toLocaleString("en-NZ")}</time></li>)}</ol> : <p className="record-empty">No simulated ticket event</p>}
            </section>
          </details>
            </section>
          </section>

          <aside className="alert-signal-details" aria-label="Situation details">
            <header className="alert-signal-details-header"><h3>Details</h3><span>Browser draft</span></header>
            <dl className="alert-detail-fields" aria-label="Situation details fields">
              <div><dt>Situation ID</dt><dd><code>{signalReference}</code></dd></div>
              <div><dt>Case ID</dt><dd><code>{caseReference ?? "Not created"}</code></dd></div>
              <div><dt>Review</dt><dd>{signalState}</dd></div>
              <div><dt>Signals</dt><dd>{displaySignalCount}</dd></div>
              <div><dt>Gate</dt><dd>{selected?.gate.type ?? "monitor"}</dd></div>
              <div><dt>Incident</dt><dd>{activeCase.incidentState}</dd></div>
              <div><dt>Warning</dt><dd>{activeCase.warningState.replaceAll("_", " ")}</dd></div>
              <div><dt>System severity</dt><dd>{selected?.severity ?? "Not computed"}</dd></div>
              <div><dt>Sources</dt><dd>{selected?.source_ids.join(", ") ?? "Synthetic fixture"}</dd></div>
              <div><dt>Source record</dt><dd>{selected?.canonical_id ?? selectedKey}</dd></div>
              <div><dt>Observed</dt><dd>{observedLabel}</dd></div>
              <div><dt>Evidence state</dt><dd>{selected ? "Unreviewed typed links" : "Zero weight"}</dd></div>
              <div><dt>Decision authority</dt><dd>Human</dd></div>
              <div><dt>Affected area</dt><dd>{activeCase.affectedArea || "Not set"}</dd></div>
            </dl>

            <form className="alert-detail-form alert-staff-fields" onSubmit={saveCase}>
              <fieldset>
                <legend>Staff fields</legend>
                <label><span>Review status</span><select name="review-status" value={activeReview.status} onChange={(event) => changeReview({ status: event.target.value as ReviewStatus })}><option value="open">New</option><option value="investigating">Active · investigating</option><option value="needs_action">Active · needs action</option><option value="closed">Closed</option></select></label>
                <label><span>Incident status</span><select name="incident-status" value={activeCase.incidentState} onChange={(event) => changeCase({ incidentState: event.target.value as CaseDraft["incidentState"] })}><option value="unconfirmed">Unconfirmed</option><option value="investigating">Investigating</option><option value="confirmed">Confirmed by staff</option><option value="controlled">Controlled</option><option value="recovery">Recovery</option><option value="closed">Closed</option></select></label>
                <label><span>Assigned to <small>Information manager</small></span><input name="assignee" value={activeReview.assignee} onChange={(event) => changeReview({ assignee: event.target.value })} placeholder="Name or team" /></label>
                <label><span>Next review</span><input type="datetime-local" value={activeCase.nextReview} onChange={(event) => changeCase({ nextReview: event.target.value })} /></label>
                <label><span>Classification <small>Human outcome</small></span><select name="classification" value={activeReview.classification} onChange={(event) => changeReview({ classification: event.target.value as ReviewClassification })}>{REVIEW_CLASSIFICATIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              </fieldset>
              <details className="alert-classification-guidance">
                <summary><strong>{classification.label}</strong><span>Guidance</span></summary>
                <dl>
                  <div><dt>Meaning</dt><dd>{classification.meaning}</dd></div>
                  <div><dt>Next step</dt><dd>{classification.next_step}</dd></div>
                </dl>
                <p>{classification.training_use === "review_candidate" ? "Governed review candidate" : "Excluded from model feedback"} · Not trained automatically</p>
              </details>
              <div className="alert-detail-actions"><button type="submit">Update details</button><span aria-live="polite">{notice || (activeCase.updatedAt ? "Saved locally" : "This browser only")}</span></div>
            </form>

            <div className="alert-authority-note"><strong>Human approval required</strong><span>{selected ? "Not issued" : "Mock · no alert"}</span></div>
          </aside>
        </div>
      </article>
    </section>
  );
}
