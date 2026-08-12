import { queueForReviewStatus } from "./signalReview.mjs";

const ISSUE_STATES = new Set(["stale", "unavailable", "error"]);

function candidateReview(candidate, reviewDrafts) {
  const draft = reviewDrafts?.[candidate?.id];
  const status = typeof draft?.status === "string" ? draft.status : "open";
  return {
    queue: queueForReviewStatus(status),
    has_history: Boolean(draft?.updatedAt),
  };
}

export function buildOperatorDashboardSummary(snapshot = {}, reviewDrafts = {}) {
  const sources = Array.isArray(snapshot?.sources) ? snapshot.sources : [];
  const liveSources = sources.filter((source) => source?.connector_mode === "live");
  const candidates = Array.isArray(snapshot?.evidence_inbox?.candidates)
    ? snapshot.evidence_inbox.candidates
    : [];
  const reviewed = candidates.map((candidate) => candidateReview(candidate, reviewDrafts));
  const review = {
    new: reviewed.filter(({ queue }) => queue === "new").length,
    active: reviewed.filter(({ queue }) => queue === "active").length,
    closed: reviewed.filter(({ queue }) => queue === "closed").length,
    history: reviewed.filter(({ has_history }) => has_history).length,
    all: candidates.length,
  };
  const held = Number(snapshot?.evidence_inbox?.suppressed_observation_count) || 0;
  const sourceHealth = {
    connected: liveSources.filter((source) => source?.runtime_state === "live").length,
    empty: liveSources.filter((source) => source?.runtime_state === "empty").length,
    issues: liveSources.filter((source) => ISSUE_STATES.has(source?.runtime_state)).length,
  };
  const issueSources = liveSources
    .filter((source) => ISSUE_STATES.has(source?.runtime_state))
    .map((source) => ({
      id: source.source_id,
      name: source.name || source.source_id || "Unknown source",
      state: source.runtime_state,
    }));

  let attention;
  if (review.new > 0) {
    attention = {
      kind: "candidate",
      label: `${review.new} new candidate${review.new === 1 ? "" : "s"}`,
      facts: [
        { id: "review_state", label: "Review", value: `${review.new} new`, tone: "warning" },
        { id: "active_state", label: "Active", value: String(review.active), tone: "neutral" },
        { id: "decision_state", label: "Authority", value: "Human review", tone: "neutral" },
      ],
      href: "/alerts",
      action_label: "Review evidence",
    };
  } else if (review.active > 0) {
    attention = {
      kind: "active",
      label: `${review.active} active investigation${review.active === 1 ? "" : "s"}`,
      facts: [
        { id: "active_state", label: "Active", value: String(review.active), tone: "warning" },
        { id: "decision_state", label: "Next", value: "Continue review", tone: "neutral" },
      ],
      href: "/alerts",
      action_label: "Continue investigation",
    };
  } else if (sourceHealth.issues > 0) {
    attention = {
      kind: "source_issue",
      label: `${sourceHealth.issues} feed issue${sourceHealth.issues === 1 ? "" : "s"}`,
      source_label: issueSources.map((source) => source.name).join(", "),
      facts: [
        { id: "candidate_state", label: "Candidates", value: "None promoted", tone: "neutral" },
        { id: "operational_state", label: "Status", value: "Not an all-clear", tone: "warning" },
        { id: "held_observations", label: "Held", value: `${held} monitored`, tone: "neutral" },
      ],
      href: "/integration",
      action_label: "Check source health",
    };
  } else {
    attention = {
      kind: "monitoring",
      label: "No promoted candidates",
      facts: [
        { id: "candidate_state", label: "Candidates", value: "None promoted", tone: "neutral" },
        { id: "operational_state", label: "Status", value: "Not an all-clear", tone: "warning" },
        { id: "held_observations", label: "Held", value: `${held} monitored`, tone: "neutral" },
      ],
      href: "/live",
      action_label: "Open Live map",
    };
  }

  return {
    generated_at: snapshot?.generated_at ?? null,
    source_health: sourceHealth,
    issue_sources: issueSources,
    current_records: Array.isArray(snapshot?.observations) ? snapshot.observations.length : 0,
    raw_records: Number(snapshot?.evidence_inbox?.raw_observation_count) || 0,
    held,
    review,
    attention,
    monitoring_groups: Array.isArray(snapshot?.evidence_inbox?.monitoring_groups)
      ? snapshot.evidence_inbox.monitoring_groups.map((group) => ({
        ...group,
        is_empty: (Number(group?.fresh_count) || 0) === 0,
      }))
      : [],
  };
}
