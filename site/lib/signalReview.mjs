export const REVIEW_QUEUES = Object.freeze([
  { id: "new", label: "New" },
  { id: "active", label: "Active" },
  { id: "closed", label: "Closed" },
  { id: "history", label: "History" },
  { id: "all", label: "All" },
]);

export const REVIEW_STORAGE_KEY = "poneke-alert-review-drafts-v1";

export const REVIEW_CLASSIFICATIONS = Object.freeze([
  {
    id: "true_positive",
    label: "True Positive",
    meaning: "A real disruption occurred as detected.",
    next_step: "Escalate the response and preserve verified evidence.",
  },
  {
    id: "benign_positive",
    label: "Benign Positive",
    meaning: "Expected activity triggered the detection rule.",
    next_step: "Keep it as a reviewed benign baseline example.",
  },
  {
    id: "false_positive",
    label: "False Positive",
    meaning: "Normal telemetry triggered the rule incorrectly.",
    next_step: "Review the rule before any governed model update.",
  },
  {
    id: "undetermined",
    label: "Undetermined",
    meaning: "Evidence is insufficient for a reliable outcome.",
    next_step: "Record notes and keep it out of model training.",
  },
]);

const STATUS_QUEUE = Object.freeze({
  open: "new",
  investigating: "active",
  needs_action: "active",
  closed: "closed",
});

export function queueForReviewStatus(status) {
  return STATUS_QUEUE[status] ?? "new";
}

export function reviewQueueIncludesStatus(queue, status, { has_history = false } = {}) {
  if (queue === "all") return true;
  if (queue === "history") return has_history;
  return queueForReviewStatus(status) === queue;
}

export function buildReviewQueueView(items, drafts, {
  queue = "new",
  query = "",
  mock = null,
} = {}) {
  const normalizedQuery = String(query).trim().toLowerCase();
  const candidates = Array.isArray(items) ? items.map((item) => ({
    id: String(item?.id ?? ""),
    status: drafts?.[item?.id]?.status ?? "open",
    has_history: Boolean(drafts?.[item?.id]?.updatedAt),
    search_text: [
      item?.id,
      item?.situation_ref,
      item?.signal_ref,
      item?.title,
      item?.source_id,
      ...(Array.isArray(item?.source_ids) ? item.source_ids : []),
      ...(Array.isArray(item?.signals) ? item.signals.flatMap((signal) => [
        signal?.id,
        signal?.signal_ref,
        signal?.title,
        signal?.source_id,
      ]) : []),
    ].filter(Boolean).join(" ").toLowerCase(),
  })).filter((item) => item.id) : [];
  const entries = mock?.id ? [...candidates, {
    id: String(mock.id),
    status: mock.status ?? "open",
    has_history: Boolean(mock.has_history),
    search_text: [mock.id, mock.signal_ref, mock.title, mock.source_id].filter(Boolean).join(" ").toLowerCase(),
  }] : candidates;
  const searchable = normalizedQuery
    ? entries.filter((item) => item.search_text.includes(normalizedQuery))
    : entries;
  const counts = Object.fromEntries(REVIEW_QUEUES.map(({ id }) => [
    id,
    searchable.filter((item) => reviewQueueIncludesStatus(id, item.status, { has_history: item.has_history })).length,
  ]));

  return {
    counts,
    visible_ids: searchable
      .filter((item) => reviewQueueIncludesStatus(queue, item.status, { has_history: item.has_history }))
      .map((item) => item.id),
  };
}

export function classificationFeedback(classification, { is_mock = false } = {}) {
  const item = REVIEW_CLASSIFICATIONS.find(({ id }) => id === classification)
    ?? REVIEW_CLASSIFICATIONS.at(-1);
  return {
    ...item,
    training_use: is_mock || item.id === "undetermined" ? "excluded" : "review_candidate",
  };
}
