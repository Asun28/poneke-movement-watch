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
    .map((source) => ({ id: source.source_id, name: source.name, state: source.runtime_state }));

  let attention;
  if (review.new > 0) {
    attention = {
      kind: "candidate",
      label: `${review.new} new candidate${review.new === 1 ? "" : "s"}`,
      detail: `${review.active} active. Review evidence before creating a case.`,
      href: "/alerts",
      action_label: "Review evidence",
    };
  } else if (review.active > 0) {
    attention = {
      kind: "active",
      label: `${review.active} active investigation${review.active === 1 ? "" : "s"}`,
      detail: "Continue review in Signal Review.",
      href: "/alerts",
      action_label: "Continue investigation",
    };
  } else if (sourceHealth.issues > 0) {
    attention = {
      kind: "source_issue",
      label: `${sourceHealth.issues} feed issue${sourceHealth.issues === 1 ? "" : "s"}`,
      detail: `No promoted candidates. Not an all-clear. ${held} held observations remain monitored.`,
      href: "/integration",
      action_label: "Check source health",
    };
  } else {
    attention = {
      kind: "monitoring",
      label: "No promoted candidates",
      detail: `Not an all-clear. ${held} held observations remain monitored.`,
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
      ? snapshot.evidence_inbox.monitoring_groups
      : [],
  };
}
