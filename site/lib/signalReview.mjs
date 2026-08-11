export const REVIEW_QUEUES = Object.freeze([
  { id: "new", label: "New" },
  { id: "active", label: "Active" },
  { id: "closed", label: "Closed" },
  { id: "history", label: "History" },
  { id: "all", label: "All" },
]);

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

export function classificationFeedback(classification, { is_mock = false } = {}) {
  const item = REVIEW_CLASSIFICATIONS.find(({ id }) => id === classification)
    ?? REVIEW_CLASSIFICATIONS.at(-1);
  return {
    ...item,
    training_use: is_mock || item.id === "undetermined" ? "excluded" : "review_candidate",
  };
}
