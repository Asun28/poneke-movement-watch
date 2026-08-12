export const OPERATIONAL_REFERENCE_CONVENTIONS = Object.freeze({
  signal: Object.freeze({ pattern: "SIG-YYYYMMDD-####", lifecycle: "candidate_created" }),
  case: Object.freeze({ pattern: "CASE-YYYY-####", lifecycle: "investigation_started" }),
  ticket: Object.freeze({ pattern: "WCC-EM-YYYY-####", lifecycle: "ticket_prepared" }),
});

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`invalid_${field}`);
  }
  return value.trim();
}

function dateParts(value) {
  const raw = requiredText(value, "occurred_at");
  const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (direct) return { year: direct[1], compact: `${direct[1]}${direct[2]}${direct[3]}` };

  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) throw new TypeError("invalid_occurred_at");
  const iso = parsed.toISOString();
  return { year: iso.slice(0, 4), compact: iso.slice(0, 10).replaceAll("-", "") };
}

function shortCode(canonicalId) {
  const value = requiredText(canonicalId, "canonical_id");
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return String((hash >>> 0) % 10_000).padStart(4, "0");
}

export function buildSignalReference({ canonicalId, occurredAt }) {
  const date = dateParts(occurredAt);
  return `SIG-${date.compact}-${shortCode(canonicalId)}`;
}

export function buildCaseReference({ canonicalId, occurredAt }) {
  const date = dateParts(occurredAt);
  return `CASE-${date.year}-${shortCode(canonicalId)}`;
}

export function buildStartedCaseReference({
  canonicalId,
  occurredAt,
  reviewStatus = "open",
  caseUpdatedAt = "",
  isMock = false,
}) {
  if (isMock || (reviewStatus === "open" && !caseUpdatedAt)) return null;
  return buildCaseReference({ canonicalId, occurredAt });
}

export function buildTicketReference({ canonicalId, occurredAt }) {
  const date = dateParts(occurredAt);
  return `WCC-EM-${date.year}-${shortCode(canonicalId)}`;
}

function compactLabel(value, fallback) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\s+/g, " ").slice(0, 160)
    : fallback;
}

export function buildCaseName({ title, affectedArea }) {
  return `${compactLabel(title, "Investigation")} · ${compactLabel(affectedArea, "Wellington")}`;
}

export function buildTicketName({ caseReference, service = "Emergency management" }) {
  return `${requiredText(caseReference, "case_reference")} · ${compactLabel(service, "Emergency management")}`;
}
